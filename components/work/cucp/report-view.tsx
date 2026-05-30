"use client";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = { markdown: string };

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-3 text-xl font-semibold tracking-tight text-foreground" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-6 mb-2 text-lg font-semibold tracking-tight text-foreground" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 mb-2 text-base font-semibold text-foreground" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-3 text-sm leading-relaxed text-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-3 list-disc space-y-1 pl-5 text-sm" {...props}>
      {children}
    </ul>
  ),
  li: ({ children, ...props }) => (
    <li className="text-sm leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic text-muted-foreground" {...props}>
      {children}
    </em>
  ),
  code: ({ children, ...props }) => (
    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]" {...props}>
      {children}
    </code>
  ),
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted/40" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th
      className="border border-border px-2 py-2 text-left align-top font-semibold text-foreground"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="border border-border px-2 py-2 align-top text-foreground"
      {...props}
    >
      {children}
    </td>
  ),
};

export function ReportView({ markdown }: Props) {
  return (
    <article className="rounded-md border bg-card p-6 shadow-sm">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
