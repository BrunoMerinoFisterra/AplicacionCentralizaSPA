import { useEffect, useMemo, useRef, useState } from 'react';

export type SelectOption = { label: string; value: string };

type Props = {
  label: string;
  selectedValue: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
};

// Dropdown con búsqueda (port conceptual de components/searchable-select.tsx de FSTrack).
export function SearchableSelect({
  label,
  selectedValue,
  options,
  onValueChange,
  placeholder = 'Seleccionar...',
  loading = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === selectedValue) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="field searchable-select" ref={rootRef}>
      <label>{label}</label>
      <input
        type="text"
        value={open ? query : selected?.label ?? ''}
        placeholder={loading ? 'Cargando...' : placeholder}
        disabled={loading}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => setQuery(e.target.value)}
      />
      {open && (
        <div className="options">
          {filtered.length === 0 && <div className="option muted">Sin resultados</div>}
          {filtered.slice(0, 200).map((option) => (
            <div
              key={option.value}
              className={`option${option.value === selectedValue ? ' highlighted' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onValueChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
