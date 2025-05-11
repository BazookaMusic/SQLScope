import React from "react";

interface QueryElementBadgeProps {
  text: string;
  bgColorClass: string;
}

const QueryElementBadge: React.FC<QueryElementBadgeProps> = ({ text, bgColorClass }) => {
  return (
    <code className={`${bgColorClass} text-dracula-foreground rounded px-2 py-1 text-xs
        transform transition-all duration-200 ease-out
        hover:scale-[1.20]
        hover:bg-opacity-80`}>
      {text}
    </code>
  );
};

export {QueryElementBadge}