import { Lock } from 'lucide-react';

import EditField from './EditField';
import type { EditGroup, FormState } from './types';

export default function EditSection({
  group,
  form,
  onChange,
  disabled,
  optionsByColumn,
  lockedNote,
}: {
  group: EditGroup;
  form: FormState;
  onChange: (key: keyof FormState, value: string) => void;
  disabled: boolean;
  optionsByColumn: Record<string, string[]>;
  lockedNote?: string;
}) {
  return (
    <section
      className={`bg-card border rounded-xl shadow-xs overflow-hidden transition-opacity ${
        lockedNote ? 'border-border/60 opacity-60' : 'border-border'
      }`}
    >
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest">
            {group.title}
          </h3>
          {lockedNote && (
            <span className="inline-flex items-center gap-1 text-2xs font-bold text-warning shrink-0">
              <Lock className="h-3 w-3" />
              {lockedNote}
            </span>
          )}
        </div>
        <p className="text-2xs text-secondary mt-1">{group.description}</p>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {group.fields.map((field) => (
          <EditField
            key={field.key}
            field={field}
            value={form[field.key]}
            onChange={(value) => onChange(field.key, value)}
            disabled={disabled}
            options={field.codeGrp ? (optionsByColumn[field.codeGrp] ?? []) : []}
          />
        ))}
      </div>
    </section>
  );
}
