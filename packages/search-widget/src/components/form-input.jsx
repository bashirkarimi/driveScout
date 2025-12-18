import { memo } from "react";

export const FormInput = memo(({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  placeholder,
  rows,
}) => {
  const isTextarea = type === "textarea";
  const InputComponent = isTextarea ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <InputComponent
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className={`rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-elm-500 focus:ring-offset-1 ${error
            ? "border-red-300 bg-red-50 focus:ring-red-500"
            : "border-slate-300 bg-white hover:border-slate-400"
          } ${isTextarea ? "resize-y" : ""}`}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
