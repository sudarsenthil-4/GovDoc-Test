"use client";
import type { ReactNode } from "react";
import { RubricSection } from "./rubric-section";

export type EditableItem = { id: string; text: string };

export function EditableSection<T extends EditableItem>({
  sectionKey,
  title,
  items,
  countLabel,
  defaultOpen,
  renderRow,
  onAdd,
  onEditItem,
  onDeleteItem,
  sectionActions,
  children,
}: {
  sectionKey?: string;
  title: string;
  items: T[];
  countLabel: string;
  defaultOpen?: boolean;
  renderRow: (item: T) => ReactNode;
  onAdd: () => void;
  onEditItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  sectionActions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <RubricSection
      sectionKey={sectionKey}
      title={title}
      count={items.length}
      countLabel={countLabel}
      defaultOpen={defaultOpen}
    >
      <div className="flex items-center justify-end gap-2 pb-3">
        {sectionActions}
        {!children && (
          <button
            type="button"
            onClick={onAdd}
            className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
          >
            + Add {countLabel}
          </button>
        )}
      </div>
      {children ?? (
        <ul className="flex flex-col">
          {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-start gap-3 border-b border-[var(--color-line-soft)] py-3 last:border-b-0"
            >
              <div className="flex-1">{renderRow(it)}</div>
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  aria-label={`Edit ${it.text}`}
                  onClick={() => onEditItem(it.id)}
                  className="rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground transition hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${it.text}`}
                  onClick={() => onDeleteItem(it.id)}
                  className="rounded-md border border-destructive/40 px-2 py-0.5 text-[11px] font-medium text-destructive transition hover:bg-destructive/5"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </RubricSection>
  );
}
