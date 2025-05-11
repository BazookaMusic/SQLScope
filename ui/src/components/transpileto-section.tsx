// TranspileToSection.tsx
// Requires: npm install @uiw/react-codemirror @codemirror/lang-sql @codemirror/theme-dracula
// If you already installed these for TranspileView, no extra deps needed.

import React, { useState, useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { FaClipboard, FaLink } from "react-icons/fa";
import { Selector } from "./selector";
import { ActionButton } from "./action-button";

interface TranspileToSectionProps {
  errors: string | undefined;
  outputDialect: string;
  handleOutputDialectChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  availableDialects: string[];
  outputSQL: string;
  prettyPrint: boolean;
  setPrettyPrint: (value: boolean) => void;
  CopyToClipboard: (
    content: string,
    onSuccess: () => void,
    onFailure: () => void
  ) => void;
  CopyCurrentUrlToClipboard: (
    onSuccess: () => void,
    onFailure: () => void
  ) => void;
}

const defaultCopyMessage = "Copy";
const defaultLinkCopyMessage = "Copy Link";
const updatedCopyMessage = "Copied!";
const updatedLinkCopyMessage = "Link copied!";

const TranspileToSection: React.FC<TranspileToSectionProps> = ({
  errors,
  outputDialect,
  handleOutputDialectChange,
  availableDialects,
  outputSQL,
  prettyPrint,
  setPrettyPrint,
  CopyToClipboard,
  CopyCurrentUrlToClipboard,
}) => {
  const [copiedTxt, setCopiedTxt] = useState(defaultCopyMessage);
  const [copiedLinkTxt, setCopiedLinkTxt] = useState(defaultLinkCopyMessage);

  if (errors) return null;

  return (
    <div className="transpile-output-card bg-dracula-selection/30 border-l-4 border-dracula-pink rounded-lg shadow px-4 py-4 mt-6">
      {/* ─────────────── Header row */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-dracula-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-label="Transpile to"
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 5h18" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 19H3" />
        </svg>
        <Selector
          selectStyle="main-view-select bg-dracula-selection text-dracula-foreground border border-dracula-pink/40 rounded-md px-3 py-1.5 leading-none font-sans focus:outline-none hover:bg-dracula-selection/70"
          value={outputDialect}
          onChange={handleOutputDialectChange}
          ariaLabel="Select the dialect to transpile to"
          title="Select the dialect to transpile to"
          options={availableDialects || []}
        />

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <ActionButton
            buttonStyle="bg-dracula-selection text-dracula-foreground p-2 rounded flex items-center hover:bg-dracula-selection/80 transition-colors"
            onClick={() =>
              CopyToClipboard(
                outputSQL,
                () => setCopiedTxt(updatedCopyMessage),
                () => setCopiedTxt(defaultCopyMessage)
              )
            }
            ariaLabel="Copy the transpiled query to the clipboard"
            title="Copy the transpiled query"
          >
            <span className="mr-2 hidden sm:inline text-xs font-medium">{copiedTxt}</span>
            <FaClipboard />
          </ActionButton>

          <ActionButton
            buttonStyle="bg-dracula-selection text-dracula-foreground p-2 rounded flex items-center hover:bg-dracula-selection/80 transition-colors"
            onClick={() =>
              CopyCurrentUrlToClipboard(
                () => setCopiedLinkTxt(updatedLinkCopyMessage),
                () => setCopiedLinkTxt(defaultLinkCopyMessage)
              )
            }
            ariaLabel="Copy current URL to clipboard"
            title="Copy link to query"
          >
            <span className="mr-2 hidden sm:inline text-xs font-medium">{copiedLinkTxt}</span>
            <FaLink />
          </ActionButton>

          <ActionButton
            buttonStyle={
              prettyPrint
                ? "bg-dracula-pink text-dracula-background opacity-90 hover:opacity-100 p-2 rounded flex items-center font-sans transition-colors"
                : "bg-dracula-selection text-dracula-foreground opacity-40 hover:opacity-80 p-2 rounded flex items-center font-sans transition-colors"
            }
            onClick={() => setPrettyPrint(!prettyPrint)}
            ariaLabel="Toggle pretty print option"
            title="Toggle pretty printing"
          >
            <span className="hidden sm:inline mr-1 text-xs font-medium">Prettify</span>
            🌈
          </ActionButton>
        </div>
      </div>

      {/* ─────────────── Read‑only SQL viewer (CodeMirror) */}
      {outputSQL && (
        <div className="w-full border-l-4 border-dracula-pink rounded-lg shadow-inner bg-dracula-selection/25">
          <CodeMirror
            value={outputSQL}
            minHeight="5rem"
            theme={dracula}
            extensions={[sql()]}
            basicSetup={{ lineNumbers: true, foldGutter: true, highlightActiveLine: false }}
            editable={false}
            aria-label="Transpiled SQL query (read only)"
          />
        </div>
      )}
    </div>
  );
};

export { TranspileToSection };
