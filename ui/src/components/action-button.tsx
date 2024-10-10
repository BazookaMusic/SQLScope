import { MouseEventHandler, ReactNode } from "react";

interface ActionButtonProps {
    buttonStyle: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
    children: ReactNode;
    ariaLabel: string;
    title: string;
  }
  
  const ActionButton: React.FC<ActionButtonProps> = ({
    buttonStyle,
    onClick,
    children,
    ariaLabel,
    title,
  }) => (
    <button
      className={`${buttonStyle} p-2 rounded flex items-center ml-4 active:bg-dracula-pink active:text-dracula-background font-sans`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );

export {ActionButton};
