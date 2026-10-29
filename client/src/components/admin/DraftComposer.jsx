import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, RefreshCw, Send, Sparkles, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import { addMessage, generateDraft } from '../../api/tickets.js';
import { aiFailureReason, describeAiFailure } from '../../lib/ai.js';
import { ACTIVE_STATUSES } from '../../lib/constants.js';
import { Spinner } from '../States.jsx';
import { useToast } from '../Toaster.jsx';

function Banner({ tone, icon: Icon, children, action }) {
  const tones = {
    info: 'bg-violet-50 text-violet-800',
    warning: 'bg-amber-50 text-amber-800',
    error: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`flex flex-wrap items-center gap-2 px-5 py-2.5 text-sm ${tones[tone]}`}>
      <Icon className="size-4 shrink-0" />
      <p className="flex-1">{children}</p>
      {action}
    </div>
  );
}

/**
 * Reply editor with the AI draft. The draft is generated automatically only
 * when the author is waiting on us (otherwise on demand, to save tokens), is
 * cached server-side, and never overwrites text the agent has typed.
 */
export default function DraftComposer({ ticket }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [fromDraft, setFromDraft] = useState(false);
  const insertedDraft = useRef(null);
  const seenDraft = useRef(null);
  const autoRequested = useRef(new Set());

  const { draft } = ticket;
  const awaitingReply = ACTIVE_STATUSES.includes(ticket.status) && ticket.lastMessageBy === 'author';
  const firstName = ticket.author.name.split(' ')[0];

  function insertDraft(text) {
    setBody(text);
    insertedDraft.current = text;
    setFromDraft(true);
  }

  const draftMutation = useMutation({
    mutationFn: ({ regenerate }) => generateDraft(ticket.id, { regenerate }),
    onSuccess: (newDraft) => {
      queryClient.setQueryData(queryKeys.ticket(ticket.id), (current) => current && { ...current, draft: newDraft });
    },
  });

  // Auto-draft once per author message while the author is waiting on us.
  useEffect(() => {
    const key = `${ticket.id}:${ticket.lastActivityAt}`;
    if (draft.status !== 'none' || !awaitingReply || autoRequested.current.has(key)) return;
    autoRequested.current.add(key);
    draftMutation.mutate({ regenerate: false });
  }, [ticket.id, ticket.lastActivityAt, draft.status, awaitingReply, draftMutation]);

  // Load each new draft into the editor, unless the agent has already started writing their own reply.
  useEffect(() => {
    if (!draft.body || draft.body === seenDraft.current) return;
    seenDraft.current = draft.body;
    const untouched = body.trim() === '' || body === insertedDraft.current;
    if (untouched) insertDraft(draft.body);
  }, [draft.body, body]);

  function regenerate() {
    const edited = body.trim() !== '' && body !== insertedDraft.current;
    if (edited && !window.confirm('Replace your edits with a new AI draft?')) return;
    draftMutation.mutate({ regenerate: true }, { onSuccess: (newDraft) => newDraft.body && insertDraft(newDraft.body) });
  }

  const send = useMutation({
    mutationFn: (status) => addMessage(ticket.id, { body, aiDraftUsed: fromDraft, ...(status ? { status } : {}) }),
    onSuccess: () => {
      setBody('');
      setFromDraft(false);
      insertedDraft.current = null;
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticket.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketLists });
      queryClient.invalidateQueries({ queryKey: queryKeys.queueSummary });
      toast.success(`Reply sent. ${firstName} will see it right away.`);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const failureReason = draftMutation.isError ? aiFailureReason(draftMutation.error) : null;
  const hasDraft = draft.status === 'ready' || draft.status === 'stale';

  let banner = null;
  if (draftMutation.isPending) {
    banner = (
      <Banner tone="info" icon={Sparkles}>
        <span className="inline-flex items-center gap-2">
          <Spinner className="size-3.5" /> Drafting a reply from the BookLeaf knowledge base and {firstName}'s account…
        </span>
      </Banner>
    );
  } else if (draftMutation.isError) {
    banner = failureReason ? (
      <Banner
        tone="warning"
        icon={TriangleAlert}
        action={
          <button type="button" className="btn btn-ghost px-2 py-1 text-amber-900" onClick={() => draftMutation.mutate({ regenerate: true })}>
            Try again
          </button>
        }
      >
        AI draft unavailable: {describeAiFailure(failureReason)}. Please write the reply manually.
      </Banner>
    ) : (
      <Banner tone="error" icon={CircleAlert}>
        {errorMessage(draftMutation.error)}
      </Banner>
    );
  } else if (draft.status === 'stale') {
    banner = (
      <Banner
        tone="warning"
        icon={TriangleAlert}
        action={
          <button type="button" className="btn btn-ghost px-2 py-1 text-amber-900" onClick={regenerate}>
            <RefreshCw className="size-3.5" /> Regenerate
          </button>
        }
      >
        {firstName} replied after this draft was written.
      </Banner>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
        <h2 className="font-semibold text-slate-900">Reply to {firstName}</h2>
        {!draftMutation.isPending && (
          <button type="button" className="btn btn-ghost px-2 py-1 text-violet-700" onClick={hasDraft ? regenerate : () => draftMutation.mutate({ regenerate: false })}>
            {hasDraft ? <RefreshCw className="size-3.5" /> : <Sparkles className="size-3.5" />}
            {hasDraft ? 'Regenerate draft' : 'Generate AI draft'}
          </button>
        )}
      </div>

      {banner}

      <div className="p-5">
        <textarea
          className="input min-h-64 font-[inherit] leading-relaxed"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            if (!event.target.value.trim()) setFromDraft(false);
          }}
          placeholder={draftMutation.isPending ? 'The AI draft will appear here. You can start typing your own reply instead.' : `Write your reply to ${firstName}…`}
          maxLength={5000}
        />

        {hasDraft && draft.model && (
          <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
            <Sparkles className="size-3 text-violet-500" />
            AI draft by {draft.model}
            {draft.kbSections.length > 0 && <> · grounded in: {draft.kbSections.join(', ')}</>}
            {draft.promptTokens && <> · {draft.promptTokens.toLocaleString('en-IN')} prompt tokens</>}
            <span className="text-slate-400">· review before sending</span>
          </p>
        )}

        {ticket.status === 'Closed' && (
          <p className="mt-2 text-xs text-slate-500">This ticket is closed, so the author can't reply to it.</p>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" className="btn btn-secondary" disabled={!body.trim() || send.isPending} onClick={() => send.mutate(undefined)}>
            {send.isPending && send.variables === undefined ? <Spinner /> : <Send className="size-4" />}
            Send reply
          </button>
          <button type="button" className="btn btn-primary" disabled={!body.trim() || send.isPending} onClick={() => send.mutate('Resolved')}>
            {send.isPending && send.variables === 'Resolved' && <Spinner />}
            Send &amp; mark resolved
          </button>
        </div>
      </div>
    </section>
  );
}
