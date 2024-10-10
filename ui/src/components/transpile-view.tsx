import { useEffect, useState } from "react";
import { RemoveAnsiAndUnderline } from "../api-utils/errors-formatting";
import { Selector } from "./selector";
import { TranspileToSection } from "./transpileto-section";
import { DecodeQuery, EncodeQuery, MakeQueryParams } from "../query-utils/query-encoder";
import { CopyCurrentUrlToClipboard, CopyToClipboard } from "./copy-to-clipboard";
import { ITranslationProvider } from "../common/ITranslationProvider";

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
        <div className="main-view-input-section mb-4 mt-10">
        <Selector
            selectStyle="main-view-select bg-dracula-selection text-dracula-pink p-2 rounded mb-2 font-sans"
            value={inputDialect}
            onChange={handleInputDialectChange}
            ariaLabel="Select input SQL dialect"
            title="Select the dialect to transpile from"
            options={availableDialects || []}
        />
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
    </div>
)}

export {TranspileView};