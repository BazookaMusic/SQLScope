import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CustomSyntaxHighlighterProps {
    children: string;
    [key: string]: any;
}

const CustomSyntaxHighlighter = ({ children, ...props }: CustomSyntaxHighlighterProps) => {
    const customStyle = {
        fontFamily: 'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace'
    };

    return (
        <div className="syntax-highlighter-frame border-2 border-dracula-comment p-4 rounded-lg bg-dracula-selection shadow-lg mt-2">
            <SyntaxHighlighter language="sql" style={dracula} customStyle={customStyle} showLineNumbers={true} {...props}>
                {children}
            </SyntaxHighlighter>
        </div>
    );
};

export { CustomSyntaxHighlighter };