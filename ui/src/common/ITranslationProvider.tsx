interface ITranspileRequest extends IErrors {
    query: string;
    inDialect: string;
    outDialect: string;
    pretty: boolean;
}

interface ITranspileResponse extends IErrors {
    query: string;
}

interface IErrors
{
    errors?: string | undefined;
}

interface ITranslationProvider
{
    Initialize(): Promise<void>;

    AvailableDialects() : Promise<string[]>;

    /**
     * Transpiles the given code from one dialect to another.
     * 
     * @param {string} code - The code to be transpiled.
     * @param {string} dialect - The source dialect of the code.
     * @param {string} targetDialect - The target dialect to transpile the code to.
     * @param {boolean} pretty - Whether to pretty-print the output code.
     * @returns {Promise<void>} A promise that resolves when the transpilation is complete.
     */
    Transpile(code: string, dialect: string, targetDialect: string, pretty: boolean) : Promise<ITranspileResponse>;
}

export type {ITranslationProvider, ITranspileRequest, ITranspileResponse, IErrors}