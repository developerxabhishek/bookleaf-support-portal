import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../../lib/constants.js';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  ...TICKET_STATUSES.map((status) => ({ value: status, label: status })),
  { value: 'all', label: 'All statuses' },
];

const SORT_OPTIONS = [
  { value: 'urgency', label: 'Most urgent first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'updated', label: 'Recently updated' },
];

function SelectFilter({ label, value, onChange, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
      {label}
      <select className="input py-1.5" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

/** Search input that updates the `q` filter 300ms after typing stops. */
function SearchBox({ value, onSearch }) {
  const [text, setText] = useState(value);
  const committed = useRef(value);

  // Follow changes made elsewhere (clear filters, summary chips).
  useEffect(() => {
    if (value === committed.current) return;
    committed.current = value;
    setText(value);
  }, [value]);

  useEffect(() => {
    const next = text.trim();
    if (next === committed.current) return undefined;
    const timer = setTimeout(() => {
      committed.current = next;
      onSearch(next);
    }, 300);
    return () => clearTimeout(timer);
  }, [text, onSearch]);

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:col-span-2">
      Search
      <span className="relative">
        <Search className="absolute top-2 left-2.5 size-4 text-slate-400" />
        <input className="input py-1.5 pl-8" placeholder="Subject or ticket #" value={text} onChange={(event) => setText(event.target.value)} />
      </span>
    </label>
  );
}

export default function QueueFilters({ filters, onChange, onReset, isFiltered }) {
  const onSearch = useCallback((value) => onChange('q', value), [onChange]);

  return (
    <div className="card mb-4 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <SearchBox value={filters.q ?? ''} onSearch={onSearch} />
        <SelectFilter label="Status" value={filters.status} onChange={(value) => onChange('status', value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectFilter>
        <SelectFilter label="Category" value={filters.category ?? ''} onChange={(value) => onChange('category', value)}>
          <option value="">All categories</option>
          {TICKET_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </SelectFilter>
        <SelectFilter label="Priority" value={filters.priority ?? ''} onChange={(value) => onChange('priority', value)}>
          <option value="">All priorities</option>
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </SelectFilter>
        <SelectFilter label="Assignee" value={filters.assignee ?? ''} onChange={(value) => onChange('assignee', value)}>
          <option value="">Anyone</option>
          <option value="me">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </SelectFilter>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Raised from
          <input type="date" className="input py-1.5" value={filters.from ?? ''} onChange={(event) => onChange('from', event.target.value)} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          Raised to
          <input type="date" className="input py-1.5" value={filters.to ?? ''} onChange={(event) => onChange('to', event.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="w-56">
          <SelectFilter label="Sort" value={filters.sort} onChange={(value) => onChange('sort', value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectFilter>
        </div>
        {isFiltered && (
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            <X className="size-4" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
