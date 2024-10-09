import { IDialects } from "../common/IDialects";
import { IErrors, ITranslationProvider, ITranspileResponse } from "../common/ITranslationProvider";

declare global {
    interface Window {
      loadPyodide: any;
    }
}
  
const pythonDeclarations = 
`import sqlglot
import sqlglot.dialects
import json

def dialects():
    return [name for name, obj in sqlglot.dialects.__dict__.items() if isinstance(obj, type) and issubclass(obj, sqlglot.Dialect) and obj is not sqlglot.Dialect and 'dialect' not in name.lower()]

supported_dialects = {dialect.lower() for dialect in dialects()}
def is_supported_dialect(dialect: str) -> bool:
    # get submodules from dialect
    lower_dialect = dialect.lower()
    return lower_dialect in supported_dialects

def translate(source: str, in_dialect: str, out_dialect: str, pretty:bool = False) -> str:
    print(f"Translating from {in_dialect} to {out_dialect}")
    return sqlglot.transpile(source, read=in_dialect, write = out_dialect, pretty=pretty)

print("initialized")
`

const availableDialectsSrc =
`
dialects_json = { "dialects" : dialects()}
json.dumps(dialects_json)`

const transpileSrc =
`
in_dialect = in_dialect.lower()
out_dialect = out_dialect.lower()

try:
    if (not is_supported_dialect(in_dialect)):
        raise Exception(f"{in_dialect} is not a supported dialect")
    if (not is_supported_dialect(out_dialect)):
        raise Exception(f"{out_dialect} is not a supported dialect")
    
    result = { "query" : '\\n'.join(sqlglot.transpile(source, read=in_dialect, write = out_dialect, pretty=pretty)) }
except Exception as ex:
    result = {"errors" : str(ex)}

json.dumps(result)
`

class PythonWASMProvider implements ITranslationProvider
{
    initialized = false;

    codeRunner: ((code: string) => Promise<string>) | undefined = undefined;
    createVariable: ((name: string, value: any) => Promise<void>) | undefined = undefined;

    public async AvailableDialects(): Promise<string[]> {
        if (!this.initialized)
        {
            await this.Initialize();
        }

        let dialects : IDialects | undefined = await this.RunWithOutput<IDialects>(availableDialectsSrc);
        if (!dialects)
        {
            return []
        }
       
        return dialects.dialects;
    }

    public async Transpile(code: string, dialect: string, targetDialect: string, pretty: boolean): Promise<ITranspileResponse> {
        if (!this.initialized)
        {
            await this.Initialize();
        }

        const content = await this.RunWithOutput<ITranspileResponse>(
            transpileSrc, 
            {
                source: code,
                in_dialect: dialect,
                out_dialect: targetDialect,
                pretty: pretty
            }
        );

        if (!content)
        {
            return {
                query: '',
                errors: 'Could not transpile due to a parsing error.'
            }
        }

        if (content.errors)
        {
            throw Error(content.errors);
        }

        return content;
    }
    
    private async Initialize()
    {
        try
        {
            const instance = await window
                .loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' });
            
            await instance.loadPackage("micropip");
            const micropip = instance.pyimport("micropip");
            await micropip.install('sqlglot');

            await instance.runPythonAsync(pythonDeclarations);
            
            this.codeRunner = instance.runPythonAsync;
            this.createVariable = (key: string, value: any) => instance.globals.set(key, value)
        }
        catch (e)
        {
            console.error(e);
        }

        this.initialized = true;
    }

    private async RunWithOutput<T>(codeToRun: string, parameters: object | undefined = undefined) : Promise<T | undefined>
    {
        if (!this.initialized)
        {
            await this.Initialize();
        }

        if (!this.codeRunner)
        {
            return;
        }

        if (parameters && this.createVariable)
        {
            for (const [key, value] of Object.entries(parameters))
            {
                this.createVariable(key, value);
            }
        }
    
        const content = await this.codeRunner(codeToRun);
        if (!content)
        {
            throw new Error(`Transpilation failed: Couldn't parse result`);
        }

        const result = JSON.parse(content);
        if ((result as IErrors)?.errors)
        {
            throw new Error(`Transpilation failed: ${result.errors}`);
        }

        return result;
    }
}

export {PythonWASMProvider}