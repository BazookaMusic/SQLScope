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
     * Applies a schema definition, provided as a JSON document, to the
     * translation backend. Passing an empty string clears the active schema.
     */
    SetSchema(schemaJson: string): Promise<void>;

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

    /**
     * Gets the columns for a given query
     * @param query The query to be analyzed
     * @param dialect The dialect of the code
     */
    GetColumns(query: string, dialect: string): Promise<string[]>;

    /**
     * Gets the columns for a given query
     * @param query The query to be analyzed
     * @param dialect The dialect of the code
     */
    GetJoins(query: string, dialect: string): Promise<Record<string, any>>;

}

export type {ITranslationProvider, ITranspileRequest, ITranspileResponse, IErrors}