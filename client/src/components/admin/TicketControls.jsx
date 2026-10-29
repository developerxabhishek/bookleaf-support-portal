import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Sparkles, UserCheck } from 'lucide-react';
import { errorMessage } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import { rerunTriage, updateTicket } from '../../api/tickets.js';
import { fetchAdmins } from '../../api/users.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { describeAiFailure } from '../../lib/ai.js';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../../lib/constants.js';
import { SourceTag } from '../Badges.jsx';
import { Spinner } from '../States.jsx';
import { useToast } from '../Toaster.jsx';

function Field({ label, tag, hint, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {tag}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-violet-700">{hint}</p>}
    </div>
  );
}

function TriageInsight({ triage, onRetry, retrying }) {
  if (triage.status === 'pending') {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
        <Spinner className="size-3.5" /> AI is classifying this ticket…
      </p>
    );
  }

  if (triage.status === 'failed') {
    return (
      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <p>AI triage didn't run ({describeAiFailure(triage.error)}). Category and priority come from keyword rules.</p>
        <button type="button" className="mt-1 inline-flex items-center gap-1 font-medium hover:underline" onClick={onRetry} disabled={retrying}>
          {retrying ? <Spinner className="size-3" /> : <RefreshCw className="size-3" />} Retry AI triage
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
      <p className="flex items-center gap-1 font-medium">
        <Sparkles className="size-3.5" /> AI triage · {Math.round((triage.confidence ?? 0) * 100)}% confident
      </p>
      {triage.reasoning && <p className="mt-1 italic">“{triage.reasoning}”</p>}
      <button type="button" className="mt-1 inline-flex items-center gap-1 text-violet-600 hover:underline" onClick={onRetry} disabled={retrying}>
        {retrying ? <Spinner className="size-3" /> : <RefreshCw className="size-3" />} Re-run
      </button>
    </div>
  );
}

export default function TicketControls({ ticket }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: admins = [] } = useQuery({ queryKey: queryKeys.admins, queryFn: fetchAdmins, staleTime: 5 * 60_000 });

  const onUpdated = (updated) => {
    queryClient.setQueryData(queryKeys.ticket(ticket.id), updated);
    queryClient.invalidateQueries({ queryKey: queryKeys.ticketLists });
    queryClient.invalidateQueries({ queryKey: queryKeys.queueSummary });
  };

  const update = useMutation({
    mutationFn: (patch) => updateTicket(ticket.id, patch),
    onSuccess: onUpdated,
    onError: (error) => toast.error(errorMessage(error)),
  });

  const retriage = useMutation({
    mutationFn: () => rerunTriage(ticket.id),
    onSuccess: (updated) => {
      onUpdated(updated);
      toast.success('AI triage updated.');
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const { triage } = ticket;
  const aiDisagrees = (field) =>
    triage.status === 'completed' && triage[field] && triage[field] !== ticket[field] ? `AI suggested: ${triage[field]}` : null;

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Ticket</h2>
        {update.isPending && <Spinner className="size-4 text-slate-400" />}
      </div>

      <Field label="Status">
        <select className="input" value={ticket.status} onChange={(event) => update.mutate({ status: event.target.value })}>
          {TICKET_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </Field>

      <Field label="Assignee">
        <div className="flex gap-2">
          <select
            className="input"
            value={ticket.assignee?.id ?? ''}
            onChange={(event) => update.mutate({ assigneeId: event.target.value || null })}
          >
            <option value="">Unassigned</option>
            {admins.map((admin) => (
              <option key={admin.id} value={admin.id}>
                {admin.name}
              </option>
            ))}
          </select>
          {ticket.assignee?.id !== user.id && (
            <button type="button" className="btn btn-secondary px-2.5" onClick={() => update.mutate({ assigneeId: user.id })} title="Assign to me">
              <UserCheck className="size-4" /> Me
            </button>
          )}
        </div>
      </Field>

      <Field label="Category" tag={<SourceTag source={ticket.categorySource} />} hint={aiDisagrees('category')}>
        <select className="input" value={ticket.category} onChange={(event) => update.mutate({ category: event.target.value })}>
          {TICKET_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </Field>

      <Field label="Priority" tag={<SourceTag source={ticket.prioritySource} />} hint={aiDisagrees('priority')}>
        <select className="input" value={ticket.priority} onChange={(event) => update.mutate({ priority: event.target.value })}>
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </Field>

      <TriageInsight triage={triage} onRetry={() => retriage.mutate()} retrying={retriage.isPending} />
    </section>
  );
}
