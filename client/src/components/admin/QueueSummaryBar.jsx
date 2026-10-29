import { Sparkles } from 'lucide-react';

export default function QueueSummaryBar({ summary, onSelect }) {
  if (!summary) return <div className="h-16" />;

  const chips = [
    { label: 'Open', value: summary.byStatus.Open, filter: { status: 'Open' } },
    { label: 'In progress', value: summary.byStatus['In Progress'], filter: { status: 'In Progress' } },
    { label: 'Critical', value: summary.activeByPriority.Critical, filter: { priority: 'Critical' }, alert: true },
    { label: 'High', value: summary.activeByPriority.High, filter: { priority: 'High' } },
    { label: 'Unassigned', value: summary.unassigned, filter: { assignee: 'unassigned' } },
    { label: 'Assigned to me', value: summary.assignedToMe, filter: { assignee: 'me' } },
  ];

  const ai = summary.ai;
  const aiState = !ai.enabled
    ? { text: 'AI not configured · rules-only triage', className: 'bg-slate-100 text-slate-600 ring-slate-200' }
    : ai.available
      ? { text: `AI triage & drafts on · ${ai.model}`, className: 'bg-violet-50 text-violet-700 ring-violet-200' }
      : { text: 'AI paused · manual mode', className: 'bg-amber-50 text-amber-800 ring-amber-200' };

  return (
    <div className="mb-5 space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {chips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => onSelect(chip.filter)}
            className={`card px-3 py-2 text-left hover:border-brand-200 ${chip.alert && chip.value > 0 ? 'border-red-200 bg-red-50' : ''}`}
          >
            <p className={`text-xl font-semibold ${chip.alert && chip.value > 0 ? 'text-red-700' : 'text-slate-900'}`}>{chip.value}</p>
            <p className="text-xs text-slate-500">{chip.label}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className={`badge ${aiState.className}`}>
          <Sparkles className="size-3" /> {aiState.text}
        </span>
        <span>{summary.awaitingReply} active ticket(s) waiting on a reply from us</span>
      </div>
    </div>
  );
}
