"use client";

import { useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { ChevronDown, FileUp, X } from "lucide-react";

export function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
}: {
  label: string;
  hint?: ReactNode;
  required?: boolean;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
      >
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && (
        <div className="text-xs leading-relaxed text-muted-foreground/85">
          {hint}
        </div>
      )}
    </div>
  );
}

export function TextField({
  id,
  name,
  placeholder,
  defaultValue,
  required,
}: {
  id: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      name={name}
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      className="h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
    />
  );
}

export function SelectField({
  id,
  name,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-full appearance-none rounded-lg border border-input bg-muted/30 px-3 pr-9 text-sm transition-colors focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

type FilePickerProps = {
  id: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function FilePicker({ id, name, accept, multiple, required, onChange }: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const labelId = useId();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setFiles(list);
    onChange?.(e);
  }

  function clear() {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-labelledby={labelId}
        className="flex w-full items-center gap-3 rounded-lg border border-dashed border-input bg-muted/30 px-4 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted/50 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
      >
        <FileUp className="size-4 shrink-0 text-muted-foreground" />
        <span id={labelId} className="flex-1 text-muted-foreground">
          {files.length === 0
            ? `Choose ${multiple ? "files" : "a file"}…`
            : files.length === 1
              ? files[0]!.name
              : `${files.length} files selected`}
        </span>
        {accept && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {accept}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={handleChange}
        className="sr-only"
      />
      {files.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
        >
          <X className="size-3" /> Clear
        </button>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  type = "submit",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--color-govdoc-primary)] px-5 text-sm font-semibold text-white shadow-sm shadow-[var(--color-govdoc-primary)]/15 transition-all hover:bg-[var(--color-govdoc-deep)] hover:shadow-md hover:shadow-[var(--color-govdoc-primary)]/25 disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "submit" | "button";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "groq", label: "Groq" },
];

export function RadioGroup({
  name,
  options,
  defaultValue,
  required,
  legend,
}: {
  name: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue?: string;
  required?: boolean;
  legend?: string;
}) {
  return (
    <fieldset role="radiogroup" aria-label={legend ?? name} className="space-y-2">
      {options.map((o) => (
        <label
          key={o.value}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-input bg-muted/30 p-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/50 has-checked:border-primary has-checked:bg-card"
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            defaultChecked={defaultValue === o.value}
            required={required}
            aria-label={o.label}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="flex-1">
            <span className="block font-medium text-foreground">{o.label}</span>
            {o.description && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
