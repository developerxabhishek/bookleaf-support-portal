import { Bot, Pencil, Sparkles } from 'lucide-react';

const STATUS_STYLES = {
  Open: 'bg-sky-50 text-sky-700 ring-sky-200',
  'In Progress': 'bg-amber-50 text-amber-800 ring-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const PRIORITY_STYLES = {
  Critical: 'bg-red-600 text-white ring-red-600',
  High: 'bg-orange-50 text-orange-700 ring-orange-200',
  Medium: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  Low: 'bg-slate-50 text-slate-600 ring-slate-200',
};

export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] ?? STATUS_STYLES.Closed}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  return <span className={`badge ${PRIORITY_STYLES[priority]}`}>{priority}</span>;
}

export function CategoryBadge({ category }) {
  return <span className="badge bg-white text-slate-600 ring-slate-200">{category}</span>;
}

const SOURCE_TAGS = {
  ai: { icon: Sparkles, label: 'AI', title: 'Set by AI triage', className: 'text-violet-600' },
  rules: { icon: Bot, label: 'Auto', title: 'Set by keyword rules (AI unavailable or pending)', className: 'text-slate-400' },
  admin: { icon: Pencil, label: 'Edited', title: 'Set manually by the support team', className: 'text-brand-600' },
};

/** Shows who decided a ticket's category/priority. */
export function SourceTag({ source }) {
  const tag = SOURCE_TAGS[source];
  if (!tag) return null;
  const Icon = tag.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${tag.className}`} title={tag.title}>
      <Icon className="size-3" />
      {tag.label}
    </span>
  );
}
