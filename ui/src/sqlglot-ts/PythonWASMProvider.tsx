import { IDialects } from "../common/IDialects";
import { IErrors, ITranslationProvider, ITranspileResponse } from "../common/ITranslationProvider";
import SQLGlotPython, { fetchPythonDeclarations } from "./sqlglot_python";

declare global {
    interface Window {
      loadPyodide: any;
    }
}

class PythonWASMProvider implements ITranslationProvider {
    initialized = false;
    codeRunner: ((code: string) => Promise<string>) | undefined = undefined;
    createVariable: ((name: string, value: any) => Promise<void>) | undefined = undefined;

    public async AvailableDialects(): Promise<string[]> {
        if (!this.initialized) {
            await this.Initialize();
        }

        let dialects: IDialects | undefined = await this.RunWithOutput<IDialects>(SQLGlotPython.GetAvailableDialects);
        return dialects?.dialects ?? [];
    }

    public async Transpile(
        code: string,
        dialect: string,
        targetDialect: string,
        pretty: boolean
    ): Promise<ITranspileResponse> {
        if (!this.initialized) {
            await this.Initialize();
        }

        const content = await this.RunWithOutput<ITranspileResponse>(
            SQLGlotPython.TranspileQuery,
            { source: code, in_dialect: dialect, out_dialect: targetDialect, pretty }
        );

        if (!content) {
            return { query: "", errors: "Could not transpile due to a parsing error." };
        }
        if (content.errors) {
            throw new Error(content.errors);
        }
        return content;
    }

    /**
     * Retrieve all columns grouped by the table qualifier (or "unqualified").
     */
    public async GetColumns(
        query: string,
        dialect: string
    ): Promise<string[]> {
        if (!this.initialized) {
            await this.Initialize();
        }

        const content = await this.RunWithOutput<{ columns: string[] }>(
            SQLGlotPython.GetColumns,
            { source: query, in_dialect: dialect }
        );

        if (!content) {
            throw new Error("Failed to retrieve columns.");
        }
        if ((content as IErrors).errors) {
            throw new Error((content as IErrors).errors!);
        }
        return content.columns;
    }

    /**
     * New: Extracts a flat, deduped list of all joined tables (including nested).
     */
    public async GetJoins(
        code: string,
        dialect: string
    ): Promise<Record<string, any>> {
        if (!this.initialized) {
            await this.Initialize();
        }

        const content = await this.RunWithOutput<{ tables: string[], join_count: number }>(
            SQLGlotPython.GetJoins,
            {
                source: code,
                in_dialect: dialect,
            }
        );

        if (!content) {
            throw new Error(
                "Could not extract joins: parsing or runtime error."
            );
        }

        return content;
    }

    public async Initialize() {
        if (this.initialized) {
            return;
        }

        try {
            const instance = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' });
            await instance.loadPackage("micropip");
            const micropip = instance.pyimport("micropip");
            await micropip.install('sqlglot');
            const declarations = await fetchPythonDeclarations();
            await instance.runPythonAsync(declarations);
            this.codeRunner = instance.runPythonAsync;
            this.createVariable = (key: string, value: any) => instance.globals.set(key, value);
        } catch (e) {
            console.error(e);
        }

        this.initialized = true;
    }

    private async RunWithOutput<T>(codeToRun: string, parameters?: object): Promise<T | undefined> {
        if (!this.initialized) {
            await this.Initialize();
        }

        if (!this.codeRunner) {
            return;
        }
        if (parameters && this.createVariable) {
            for (const [key, value] of Object.entries(parameters)) {
                this.createVariable(key, value);
            }
        }

        const content = await this.codeRunner(codeToRun);
        if (!content) {
            throw new Error(`Execution failed: no result`);
        }

        const result = JSON.parse(content);
        if ((result as IErrors).errors) {
            throw new Error((result as IErrors).errors!);
        }
        return result as T;
    }
}

export { PythonWASMProvider };
