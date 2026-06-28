import type { ReactNode } from 'react';

import FlagToggle from '@/components/FlagToggle';
import MappedFlagToggle from '@/components/MappedFlagToggle';
import MultiCombobox from '@/components/MultiCombobox';
import RangeInput from '@/components/RangeInput';
import SearchCombobox from '@/components/SearchCombobox';
import type { EditFieldConfig } from './types';

export default function EditField({
  field,
  value,
  onChange,
  disabled,
  options = [],
}: {
  field: EditFieldConfig;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  options?: string[];
}) {
  const fieldId = `edit-field-${field.key}`;

  let control: ReactNode;
  switch (field.type) {
    case 'select':
      control = (
        <SearchCombobox
          id={fieldId}
          value={value}
          onChange={onChange}
          options={options}
          placeholder="선택..."
          disabled={disabled}
          allowClear
          mono={field.mono}
        />
      );
      break;
    case 'flag':
      control =
        field.flagOn !== undefined ? (
          <MappedFlagToggle
            id={fieldId}
            value={value}
            onChange={onChange}
            onValue={field.flagOn}
            offValue={field.flagOff ?? ''}
            disabled={disabled}
          />
        ) : (
          <FlagToggle id={fieldId} value={value} onChange={onChange} disabled={disabled} />
        );
      break;
    case 'range':
      control = (
        <RangeInput id={fieldId} value={value} onChange={onChange} disabled={disabled} unit={field.unit} />
      );
      break;
    case 'multi':
      control = (
        <MultiCombobox
          id={fieldId}
          value={value}
          onChange={onChange}
          options={options}
          separator={field.separator}
          defaultHighlight={field.defaultHighlight}
          placeholder="선택..."
          disabled={disabled}
        />
      );
      break;
    default:
      control = (
        <input
          id={fieldId}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full border border-border rounded-lg px-3 py-2 text-xs focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none text-foreground bg-card disabled:opacity-60 transition-all ${field.mono ? 'font-mono' : ''}`}
        />
      );
  }

  return (
    <div
      className={`space-y-1.5 min-w-0 ${field.full ? 'md:col-span-2 xl:col-span-4' : field.wide ? 'md:col-span-2' : ''
        }`}
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={fieldId} className="text-2xs font-bold text-secondary uppercase tracking-wider">
          {field.column}
        </label>
        <span className="text-2xs text-muted-foreground/70 truncate">{field.label}</span>
      </div>
      {control}
    </div>
  );
}
