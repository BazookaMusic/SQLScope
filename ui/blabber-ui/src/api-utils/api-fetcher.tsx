const APIEndpoint: string | undefined = process.env.REACT_APP_APIEndpoint;

if (!APIEndpoint) {
    throw new Error("APIEndpoint environment variable is not defined");
}

interface Dialects
{
    dialects: string[]
}

async function FetchDialects() {
    const response = await fetch(`${APIEndpoint}/dialects`);
    const dialects : Dialects = await response.json();
    return dialects.dialects;
};

let Dialects: string[] | undefined = undefined;


/**
 * Returns the available dialects, fetching them from the API if they haven't been fetched yet.
 * 
 * @returns {Promise<string[]>} A promise that resolves to an array of available dialects.
 */
async function AvailableDialects()
{
    if (!Dialects)
    {
        Dialects = await FetchDialects();
    }

    return Dialects;
}

interface TranspileRequest {
    query: string;
    inDialect: string;
    outDialect: string;
    pretty: boolean;
}

interface TranspileResponse {
    query: string;
}

/**
 * Transpiles the given code from one dialect to another.
 * 
 * @param {string} code - The code to be transpiled.
 * @param {string} dialect - The source dialect of the code.
 * @param {string} targetDialect - The target dialect to transpile the code to.
 * @param {boolean} pretty - Whether to pretty-print the output code.
 * @returns {Promise<void>} A promise that resolves when the transpilation is complete.
 */
async function Transpile(code: string, dialect: string, targetDialect: string, pretty: boolean) : Promise<TranspileResponse> {
    const request: TranspileRequest = {
        query: code,
        inDialect: dialect,
        outDialect: targetDialect,
        pretty: pretty
    };

    const response = await fetch(`${APIEndpoint}/transpile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        const transpileErrorJson = await response.json();
        const transpileError = transpileErrorJson.error;
        throw new Error(`Transpilation failed: ${transpileError}`);
    }

    const result : TranspileResponse = await response.json();
    return result;
}


export { AvailableDialects, Transpile };