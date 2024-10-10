import { IDialects } from "../common/IDialects";
import { IErrors, ITranslationProvider, ITranspileResponse } from "../common/ITranslationProvider";
import SQLGlotPython from "./sqlglot_python";

declare global {
    interface Window {
      loadPyodide: any;
    }
}

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

        let dialects : IDialects | undefined = await this.RunWithOutput<IDialects>(SQLGlotPython.GetAvailableDialects);
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
            SQLGlotPython.TranspileQuery, 
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

            await instance.runPythonAsync(SQLGlotPython.PythonFunctionDeclarations);
            
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