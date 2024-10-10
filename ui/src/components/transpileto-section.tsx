import React, { useState } from 'react';
import { FaClipboard, FaLink } from 'react-icons/fa';
import { FcStatistics } from "react-icons/fc";
import { Selector } from './selector'; // Assuming Selector is in the same folder
import { ActionButton } from './action-button'; // Assuming ActionButton is in the same folder
import { CustomSyntaxHighlighter } from './syntax-highlighter'; // Assuming CustomSyntaxHighlighter is in the same folder

interface TranspileToSectionProps {
  errors: string | undefined;
  outputDialect: string;
  handleOutputDialectChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  availableDialects: string[];
  outputSQL: string;
  prettyPrint: boolean;
  setPrettyPrint: (value: boolean) => void;
  CopyToClipboard: (content: string, onSuccess: () => void, onFailure: () => void) => void;
  CopyCurrentUrlToClipboard: (onSuccess: () => void, onFailure: () => void) => void;
}

const defaultCopyMessage = 'Copy';
const defaultLinkCopyMessage = 'Copy Link';

const updatedCopyMessage = 'Copied to clipboard!';
const updatedLinkCopyMessage = 'Copied link to clipboard!';

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
    
    const [copiedToClipboardMessage, setCopiedToClipboardMessage] = useState(defaultCopyMessage);
    const [copiedLinkToClipboardMessage, setCopiedLinkToClipboardMessage] = useState(defaultLinkCopyMessage);
  
    if (errors) return null;

    return (
        <div className="main-view-output-section fade-in mt-15">
        <div className="main-view-output-header flex items-center justify-between mb-4">
            <div className="flex items-center w-full">
            <Selector
                selectStyle="main-view-select bg-dracula-selection text-dracula-pink p-2 rounded mr-2 font-sans"
                value={outputDialect}
                onChange={handleOutputDialectChange}
                ariaLabel="Select the dialect to transpile to"
                title="Select the dialect to transpile to"
                options={availableDialects || []}
            />
            <div className="output-header-options flex items-center w-full">
                <div className="flex items-center">
                <ActionButton
                    buttonStyle="bg-dracula-selection text-dracula-foreground"
                    onClick={() =>
                    CopyToClipboard(
                        outputSQL,
                        () => setCopiedToClipboardMessage(updatedCopyMessage),
                        () => setCopiedToClipboardMessage(defaultCopyMessage)
                    )
                    }
                    ariaLabel="Copy the transpiled query to the clipboard"
                    title="Copy the transpiled query"
                >
                    <label className="mr-2 hidden sm:inline">{copiedToClipboardMessage}</label>
                    <FaClipboard />
                </ActionButton>

                <ActionButton
                    buttonStyle="bg-dracula-selection text-dracula-foreground"
                    onClick={() =>
                    CopyCurrentUrlToClipboard(
                        () => setCopiedLinkToClipboardMessage(updatedLinkCopyMessage),
                        () => setCopiedLinkToClipboardMessage(defaultLinkCopyMessage)
                    )
                    }
                    ariaLabel="Copy current URL to clipboard"
                    title="Copy link to query"
                >
                    <label className="mr-2 hidden sm:inline">{copiedLinkToClipboardMessage}</label>
                    <FaLink />
                </ActionButton>
                </div>
                <div className="pretty-print-option-toggle option-toggle flex mr-2 ml-2 lg:mr-4 xl:mr-6">
                <ActionButton
                    buttonStyle={`ml-2 p-2 rounded flex items-center ${
                    prettyPrint
                        ? 'bg-dracula-pink text-dracula-background opacity-90'
                        : 'bg-dracula-selection text-dracula-foreground opacity-40'
                    } hover:opacity-100 font-sans`}
                    onClick={() => setPrettyPrint(!prettyPrint)}
                    ariaLabel="Toggle pretty print option"
                    title="Toggle pretty printing 🌈"
                >
                    <label>
                    <span className="hidden sm:inline">Prettify</span>🌈
                    </label>
                </ActionButton>
                <ActionButton
                    buttonStyle="bg-dracula-selection text-dracula-foreground"
                    onClick={() => {}}
                    ariaLabel="Statistics"
                    title="Statistics"
                >
                    <label className="mr-2 hidden sm:inline">Statistics</label>
                    <FcStatistics />
                </ActionButton>
                </div>
            </div>
            </div>
        </div>
        {outputSQL && (
            <CustomSyntaxHighlighter language="sql">{outputSQL}</CustomSyntaxHighlighter>
        )}
        </div>
    );
};

export  {TranspileToSection};
