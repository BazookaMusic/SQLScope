// TranspileView.tsx
// Requires: npm install @uiw/react-codemirror @codemirror/lang-sql @codemirror/theme-dracula

import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { RemoveAnsiAndUnderline } from "../api-utils/errors-formatting";
import { Selector } from "./selector";
import { TranspileToSection } from "./transpileto-section";
import {
  DecodeQuery,
  EncodeQuery,
  MakeQueryParams,
} from "../query-utils/query-encoder";
import {
  CopyCurrentUrlToClipboard,
  CopyToClipboard,
} from "./copy-to-clipboard";
import { ITranslationProvider } from "../common/ITranslationProvider";
import { QueryAnalysisSection } from "./queryanalysis-section";
import { Queries } from "../query-utils/queries";

interface TranspileViewProps {
  translationProvider: ITranslationProvider;
}

const TranspileView: React.FC<TranspileViewProps> = ({ translationProvider }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const inputSqlParam =
    urlParams.get("inputSql") ?? EncodeQuery(Queries.EXAMPLE);
  const [inputSQL, setInputSQL] = useState<string>(DecodeQuery(inputSqlParam ?? ""));
  const [outputSQL, setOutputSQL] = useState<string>("");
  const [inputDialect, setInputDialect] = useState<string>(
    urlParams.get("inputDialect") ?? "TSQL"
  );
  const [outputDialect, setOutputDialect] = useState<string>("TSQL");
  const [availableDialects, setAvailableDialects] =
    useState<string[] | undefined>(undefined);
  const [prettyPrint, setPrettyPrint] = useState<boolean>(false);
  const [errors, setErrors] = useState<string | undefined>();

  /* ----------------------------- Fetch Dialects ---------------------------- */
  useEffect(() => {
    async function fetchDialects() {
      if (!translationProvider) return;
      const dialects = await translationProvider.AvailableDialects();
      if (dialects) setAvailableDialects(dialects);
    }
    fetchDialects();
  }, [translationProvider]);

  /* --------------------------- Read Query Params --------------------------- */
  useEffect(() => {
    const inputSQLParam = urlParams.get("inputSQL");
    const inputDialectParam = urlParams.get("inputDialect");
    const outputDialectParam = urlParams.get("outputDialect");
    if (inputSQLParam) setInputSQL(DecodeQuery(inputSQLParam));
    if (inputDialectParam) setInputDialect(inputDialectParam);
    if (outputDialectParam) setOutputDialect(outputDialectParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------- Persist to URL ----------------------------- */
  useEffect(() => {
    const params = MakeQueryParams({
      inputSql: inputSQL,
      inputDialect,
      outputDialect,
    });
    window.history.replaceState(null, "", params);
  }, [inputSQL, inputDialect, outputDialect]);

  /* -------------------------- Debounced Transpile -------------------------- */
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (inputSQL.trim() === "") {
        setOutputSQL("");
        setErrors(undefined);
        return;
      }
      try {
        if (!translationProvider) return;
        const result = await translationProvider.Transpile(
          inputSQL,
          inputDialect,
          outputDialect,
          prettyPrint
        );
        setOutputSQL(result.query);
        setErrors(undefined);
      } catch (error) {
        console.error("Transpilation failed:", error);
        setErrors(String(error));
        setOutputSQL("Failed to transpile the query.");
      }
    }, 500); // 500 ms debounce
    return () => clearTimeout(timeoutId);
  }, [inputSQL, inputDialect, outputDialect, prettyPrint, translationProvider]);

  /* ------------------------------- Handlers -------------------------------- */
  const handleInputDialectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => setInputDialect(e.target.value);
  const handleOutputDialectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => setOutputDialect(e.target.value);

  /* ---------------------------------- UI ----------------------------------- */
  return (
    <div>
      {/* ----------------------- Dialect Selector & Editor ---------------------- */}
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
            selectStyle="main-view-select bg-dracula-selection text-dracula-foreground border border-dracula-pink/40 rounded-md px-3 py-1.5 leading-none font-sans focus:outline-none hover:bg-dracula-selection/70"
            value={inputDialect}
            onChange={handleInputDialectChange}
            ariaLabel="Select input SQL dialect"
            title="Select the dialect to transpile from"
            options={availableDialects ?? []}
          />
        </div>
        {/* --------------------------- CodeMirror Editor --------------------------- */}
        <div
          className="w-full border-l-4 border-dracula-pink rounded-lg shadow-inner bg-dracula-selection/25"
        >
          <CodeMirror
            value={inputSQL}
            minHeight="15rem"
            maxHeight="20rem"
            theme={dracula}
            extensions={[sql()]}
            onChange={(value) => setInputSQL(value)}
            basicSetup={{ lineNumbers: true, foldGutter: true }}
            aria-label="Input SQL query"
          />
        </div>
        {errors && (
          <div
            className="text-dracula-red bg-dracula-background p-2 rounded mt-2 border border-dracula-red font-mono overflow-auto"
            dangerouslySetInnerHTML={{
              __html: RemoveAnsiAndUnderline(errors),
            }}
            aria-live="assertive"
          />
        )}
      </div>

      {/* ---------------------- Transpiled Query & Analysis --------------------- */}
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
      <QueryAnalysisSection
        query={outputSQL}
        translationProvider={translationProvider}
        dialect={outputDialect}
      />
    </div>
  );
};

export { TranspileView };
