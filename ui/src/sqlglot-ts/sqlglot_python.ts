const PYTHON_MODULE_PATH = `${process.env.PUBLIC_URL || ""}/python/sqlglot_wasm.py`;

let pythonDeclarationsPromise: Promise<string> | undefined;

async function fetchPythonDeclarations(): Promise<string> {
    if (!pythonDeclarationsPromise) {
        pythonDeclarationsPromise = fetch(PYTHON_MODULE_PATH).then(async (response) => {
            if (!response.ok) {
                throw new Error(`Failed to load python module from ${PYTHON_MODULE_PATH}: ${response.statusText}`);
            }

            return response.text();
        });
    }

    return pythonDeclarationsPromise;
}

const SQLGlotPython = {
    GetAvailableDialects: "get_available_dialects()",
    TranspileQuery: "transpile_query(source, in_dialect, out_dialect, pretty)",
    GetColumns: "get_columns(source, in_dialect)",
    GetJoins: "get_joins(source, in_dialect)",
};

export { fetchPythonDeclarations };
export default SQLGlotPython;
