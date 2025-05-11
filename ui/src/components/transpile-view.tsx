import { useEffect, useState } from "react";
import { RemoveAnsiAndUnderline } from "../api-utils/errors-formatting";
import { Selector } from "./selector";
import { TranspileToSection } from "./transpileto-section";
import { DecodeQuery, EncodeQuery, MakeQueryParams } from "../query-utils/query-encoder";
import { CopyCurrentUrlToClipboard, CopyToClipboard } from "./copy-to-clipboard";
import { ITranslationProvider } from "../common/ITranslationProvider";
import { QueryAnalysisSection } from "./queryanalysis-section";

interface TranspileViewProps {
    translationProvider: ITranslationProvider
  }

  const TranspileView: React.FC<TranspileViewProps> = (props: {
    translationProvider: ITranslationProvider
  }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const inputSqlParam = urlParams.get('inputSql') ?? EncodeQuery('SELECT * FROM table;');
    const [inputSQL, setInputSQL] = useState(DecodeQuery(inputSqlParam ?? ''));
    const [outputSQL, setOutputSQL] = useState('');
    const [inputDialect, setInputDialect] = useState(urlParams.get('inputDialect') ?? 'TSQL');
    const [outputDialect, setOutputDialect] = useState('TSQL');
    const [availableDialects, setAvailableDialects] = useState<string[] | undefined>(undefined);
    const [prettyPrint, setPrettyPrint] = useState(false);

    const [errors, setErrors] = useState<string>();
    const translationProvider = props.translationProvider;

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
    }, [translationProvider]);

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
            setOutputDialect(outputDialectParam);
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
    }, [inputSQL, inputDialect, outputDialect, prettyPrint, translationProvider]);

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
     <div>
        <div className="mb-4 mt-10">
        <div className="flex items-center gap-3 mb-4 select-none h-full">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-dracula-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Source SQL dialect"
                >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
            <Selector
                selectStyle="
                main-view-select
                bg-dracula-selection
                text-dracula-foreground
                border border-dracula-pink/40
                rounded-md
                px-3 py-1.5
                leading-none
                font-sans
                focus:outline-none
                hover:bg-dracula-selection/70
                "
                value={inputDialect}
                onChange={handleInputDialectChange}
                ariaLabel='Select input SQL dialect'
                title='Select the dialect to transpile from'
                options={availableDialects ?? []}
            />
        </div>
            {
                <textarea
                className="
                    input-textarea
                    w-full
                    font-mono text-sm leading-snug resize-y
                    bg-dracula-selection/25            /* lighter surface than before */
                    text-dracula-foreground            /* full foreground */
                    border-l-4 border-dracula-pink     /* accent stripe */
                    rounded-lg shadow-inner
                    px-3 py-2 mt-3
                    placeholder-dracula-comment/80     /* lighter placeholder */
                    outline-none
                    transition-colors
                "
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
        </div>
        <TranspileToSection
            errors={errors}
            outputDialect={outputDialect}
            handleOutputDialectChange={handleOutputDialectChange}
            availableDialects={availableDialects || []}
            outputSQL={outputSQL}
            prettyPrint={prettyPrint}
            setPrettyPrint={setPrettyPrint}
            CopyToClipboard={CopyToClipboard}
            CopyCurrentUrlToClipboard={CopyCurrentUrlToClipboard}
        />
        <QueryAnalysisSection query={outputSQL} translationProvider={translationProvider} dialect={outputDialect} />
    </div>
)}

export {TranspileView};