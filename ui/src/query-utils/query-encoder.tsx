
import pako from 'pako';

function uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

function EncodeQuery(query: string) : string
{
    const compressed_uint8array = pako.gzip(query);
    return uint8ArrayToBase64(compressed_uint8array);
}

function DecodeQuery(encodedQuery: string) : string
{
    if (encodedQuery.trim() === '')
    {
        return '';
    }
    try
    {
        const compressed_uint8array = new Uint8Array(atob(encodedQuery).split('').map(c => c.charCodeAt(0)));
        return pako.ungzip(compressed_uint8array, { to: 'string' });
    }
    catch (e)
    {
        console.error('Failed to decode query: ', e);
        return '';
    }
}

interface QueryParams
{
    inputSql: string;
    inputDialect: string;
    outputDialect: string;
}

function MakeQueryParams(queryParams: QueryParams): string
{
    return `?inputDialect=${queryParams.inputDialect}&outputDialect=${queryParams.outputDialect}&inputSql=${EncodeQuery(queryParams.inputSql)}`;
}

export { EncodeQuery, DecodeQuery, MakeQueryParams };
export type { QueryParams };