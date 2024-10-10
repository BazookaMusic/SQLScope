import { ChangeEventHandler } from "react";

interface SelectProps {
    selectStyle: string;
    value: string;
    onChange: ChangeEventHandler<HTMLSelectElement>;
    ariaLabel: string;
    title: string;
    options: string[];
  }
  
  const Selector: React.FC<SelectProps> = ({
    selectStyle,
    value,
    onChange,
    ariaLabel,
    title,
    options,
  }) => (
    <select
      className={selectStyle}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      title={title}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
  
  export {Selector};