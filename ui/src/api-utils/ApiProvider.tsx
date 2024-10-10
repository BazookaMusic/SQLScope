import { IDialects } from "../common/IDialects";
import { ITranslationProvider, ITranspileRequest, ITranspileResponse } from "../common/ITranslationProvider";

class APIProvider implements ITranslationProvider
{
    private Dialects: string[] | undefined;
    private APIEndpoint: string | undefined = process.env.REACT_APP_APIEndpoint;

    async AvailableDialects(): Promise<string[]> {
        if (!this.Dialects)
        {
            this.Dialects = (await this.FetchDialects()).dialects;
        }
        
        return this.Dialects;
    }

    async Transpile(code: string, dialect: string, targetDialect: string, pretty: boolean): Promise<ITranspileResponse> {
        const request: ITranspileRequest = {
            query: code,
            inDialect: dialect,
            outDialect: targetDialect,
            pretty: pretty
        };
    
        const response = await fetch(`${this.APIEndpoint}/transpile`, {
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
    
        const result : ITranspileResponse = await response.json();
        return result;
    }

    private async FetchDialects()  {
        const response = await fetch(`${this.APIEndpoint}/dialects`);
        const dialects : IDialects = await response.json();
        return dialects;
    };
}

export {APIProvider}