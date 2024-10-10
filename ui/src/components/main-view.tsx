import React, { useState, useEffect } from 'react';
import { CustomSyntaxHighlighter } from './syntax-highlighter';
import { CopyToClipboard, CopyCurrentUrlToClipboard } from './copy-to-clipboard';
import { FaClipboard, FaLink } from 'react-icons/fa';
import { DecodeQuery, EncodeQuery, MakeQueryParams } from '../query-utils/query-encoder';
import { RemoveAnsiAndBold as RemoveAnsiAndUnderline } from '../api-utils/errors-formatting';
import { ITranslationProvider } from '../common/ITranslationProvider';
import { PythonWASMProvider } from '../sqlglot-ts/PythonWASMProvider';

import { DotLoader } from 'react-spinners';

const draculaPink = '#ff79c6';

const translationProvider : ITranslationProvider = new PythonWASMProvider();

const MainView: React.FC = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const inputSqlParam = urlParams.get('inputSql') ?? EncodeQuery('SELECT * FROM table;');
    const [inputSQL, setInputSQL] = useState(DecodeQuery(inputSqlParam ?? ''));
    const [outputSQL, setOutputSQL] = useState('');
    const [inputDialect, setInputDialect] = useState(urlParams.get('inputDialect') ?? 'TSQL');
    const [outputDialect, setOutputDialect] = useState('TSQL');
    const [availableDialects, setAvailableDialects] = useState<string[] | undefined>(undefined);
    const [prettyPrint, setPrettyPrint] = useState(false);

    const [errors, setErrors] = useState<string>();

    const defaultCopyMessage = 'Copy';
    const defaultLinkCopyMessage = 'Copy Link';

    const updatedCopyMessage = 'Copied to clipboard!';
    const updatedLinkCopyMessage = 'Copied link to clipboard!';

    const [copiedToClipboardMessage, setCopiedToClipboardMessage] = useState(defaultCopyMessage);
    const [copiedLinkToClipboardMessage, setCopiedLinkToClipboardMessage] = useState(defaultLinkCopyMessage);

    useEffect(() => {
        async function fetchDialects() {
            if (!translationProvider)
            {
                return;
            }

            const dialects = await translationProvider?.AvailableDialects();

            if (dialects) {
                setAvailableDialects(dialects);
            }
        }

        fetchDialects();
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const inputSQLParam = urlParams.get('inputSQL');
        const inputDialectParam = urlParams.get('inputDialect');
        const outputDialectParam = urlParams.get('outputDialect');

        if (inputSQLParam) {
            setInputSQL(DecodeQuery(inputSQLParam));
        }

        if (inputDialectParam) {
            setInputDialect(inputDialectParam);
        }

        if (outputDialectParam)
        {
            setOutputDialect(outputDialect);
        }
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('inputSQL', inputSQL);
        urlParams.set('inputDialect', inputDialect);
        urlParams.set('outputDialect', inputDialect);
        window.history.replaceState(null, '', MakeQueryParams({ inputSql: inputSQL, inputDialect, outputDialect: outputDialect }));
    }, [inputSQL, inputDialect, outputDialect]);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (inputSQL.trim() === '') {
                setOutputSQL('');
                setErrors(undefined);
                return;
            }

            try {
                if (!translationProvider)
                {
                    return;
                }

                const result = await translationProvider?.Transpile(inputSQL, inputDialect, outputDialect, prettyPrint);
                setOutputSQL(result.query);
                setErrors(undefined);
            } catch (error) {
                console.error('Transpilation failed:', error);
                setErrors(`${error}`);
                setOutputSQL('Failed to transpile the query.');
            }
        }, 500); // 500ms cooldown

        return () => clearTimeout(timeoutId); // Cleanup the timeout if dependencies change
    }, [inputSQL, inputDialect, outputDialect, prettyPrint]);

    const handleInputSQLChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputSQL(e.target.value);
    };

    const handleInputDialectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setInputDialect(e.target.value);
    };

    const handleOutputDialectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setOutputDialect(e.target.value);
    };

    return (
        <div className="main-view bg-dracula-background text-dracula-foreground min-h-screen p-4 lg:px-32 xl:px-64 mt-8 lg:mt-16 xl:mt-24 mx-auto my-8 font-sans">
            <header className="main-view-header mb-4">
                <h1 className="main-view-title text-3xl font-bold text-center mb-4">
                    <span className="text-dracula-pink">SQL</span>
                    <span className="text-dracula-cyan">Scope</span>
                </h1>
                <p className="text-center text-dracula-comment mb-2">
                    Convert SQL queries between different dialects effortlessly.
                </p>
            </header>
            { availableDialects && <div>
                <div className="main-view-input-section mb-4 mt-10">
                    <select
                        className="main-view-select bg-dracula-selection text-dracula-pink p-2 rounded mb-2 font-sans"
                        value={inputDialect}
                        onChange={handleInputDialectChange}
                        aria-label="Select input SQL dialect"
                        title='Select the dialect to transpile from'
                    >
                        {availableDialects?.map((dialect) => (
                            <option key={dialect} value={dialect}>
                                {dialect}
                            </option>
                        ))}
                    </select>
                    {
                        <textarea
                        className="input-textarea bg-dracula-selection text-dracula-foreground p-2 rounded mb-2 w-full font-mono mt-2"
                        value={inputSQL}
                        onChange={handleInputSQLChange}
                        placeholder="Enter SQL here"
                        rows={10}
                        cols={50}
                        aria-label="Input SQL query"
                    />
                    }
                    {
                        errors && <div 
                            className="text-dracula-red bg-dracula-background p-2 rounded mb-2 border border-dracula-red font-mono fade-in overflow-auto" 
                            dangerouslySetInnerHTML={{ __html: RemoveAnsiAndUnderline(`${errors}`) }} 
                            aria-live="assertive"
                        />
                    }
                    <CustomSyntaxHighlighter language="sql">
                        {inputSQL}
                    </CustomSyntaxHighlighter>
                </div>
                {!errors &&
                    <div className="main-view-output-section fade-in mt-15">
                        <div className="main-view-output-header flex items-center justify-between mb-2">
                            <div className="flex items-center w-full">
                                <select
                                    className="main-view-select bg-dracula-selection text-dracula-pink p-2 rounded mr-2 font-sans"
                                    value={outputDialect}
                                    onChange={handleOutputDialectChange}
                                    aria-label="title='Select the dialect to transpile to"
                                    title='Select the dialect to transpile to'
                                >
                                    {availableDialects?.map((dialect) => (
                                        <option key={dialect} value={dialect}>
                                            {dialect}
                                        </option>
                                    ))}
                                </select>
                                <div className='output-header-options flex items-center w-full'>
                                    <div className='flex items-center'>
                                        <button className={`p-2 rounded flex items-center bg-dracula-selection text-dracula-foreground ml-4 active:bg-dracula-pink active:text-dracula-background font-sans`}  
                                            onClick={() => CopyToClipboard(outputSQL, () => setCopiedToClipboardMessage(updatedCopyMessage), () => setCopiedToClipboardMessage(defaultCopyMessage) )} 
                                            aria-label="Copy the transpiled query to the clipboard"
                                            title='Copy the transpiled query'>
                                            <label className="mr-2 hidden sm:inline">{copiedToClipboardMessage}</label>
                                            <FaClipboard />
                                        </button>
                                        <button className={`p-2 rounded flex items-center bg-dracula-selection text-dracula-foreground ml-4 active:bg-dracula-pink active:text-dracula-background font-sans`}  
                                        onClick={() => CopyCurrentUrlToClipboard(() => setCopiedLinkToClipboardMessage(updatedLinkCopyMessage), () => setCopiedLinkToClipboardMessage(defaultLinkCopyMessage))} 
                                        aria-label="Copy current URL to clipboard"
                                        title='Copy link to query'
                                        >
                                            <label className="mr-2 hidden sm:inline">{copiedLinkToClipboardMessage}</label>
                                            <FaLink />
                                        </button>
                                    </div>
                                    <div className='pretty-print-option-toggle option-toggle flex mr-2 ml-2 lg:mr-4 xl:mr-6'>
                                        <button 
                                            className={`ml-2 p-2 rounded flex items-center ${prettyPrint ? 'bg-dracula-pink text-dracula-background opacity-90' : 'bg-dracula-selection text-dracula-foreground opacity-40'}  hover:opacity-100 font-sans`} 
                                            onClick={() => setPrettyPrint(!prettyPrint)}
                                            aria-label="Toggle pretty print option"
                                            title="Toggle pretty printing 🌈"
                                        >
                                            <label><span className="hidden sm:inline">Prettify</span>🌈</label>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {
                            outputSQL && 
                            <CustomSyntaxHighlighter language="sql">
                                {outputSQL}
                            </CustomSyntaxHighlighter>
                        }
                    </div>
                }
            </div>
            }
            {!availableDialects && 
            <div className='flex items-center justify-center w-full flex-col mt-20'>
                <DotLoader
                    color={draculaPink}
                    loading={true}
                    size={200}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                    title='Loading'
                    >
                </DotLoader>
                <h2 className='text-dracula-pink mt-10 text-center italic'>
                    Summoning the spirits (fetching dependencies)
                </h2>
            </div>
            }
            
            <footer className="main-view-footer mt-8 text-center text-dracula-comment text-sm">
                <p>&copy; {new Date().getFullYear()} All rights reserved, Sotiris Dragonas. Powered by <a href="https://github.com/tobymao/sqlglot">SQLGlot</a> and <a href="https://pyodide.org/en/stable/">Pyodide</a>. 
                <a href="https://www.flaticon.com/free-icons/bird" title="bird icons"> Bird icons created by Freepik - Flaticon.</a></p>
            </footer>
        </div>
    );    
};

export default MainView;