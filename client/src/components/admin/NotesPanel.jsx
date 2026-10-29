import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { errorMessage } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import { addNote } from '../../api/tickets.js';
import { timeAgo } from '../../lib/format.js';
import { Spinner } from '../States.jsx';
import { useToast } from '../Toaster.jsx';

export default function NotesPanel({ ticket }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => addNote(ticket.id, body),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: queryKeys.ticket(ticket.id) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <section className="card border-amber-200 bg-amber-50/50 p-5">
      <h2 className="flex items-center gap-1.5 font-semibold text-slate-900">
        <StickyNote className="size-4 text-amber-600" /> Internal notes
      </h2>
      <p className="mt-1 flex items-center gap-1 text-xs text-amber-800">
        <Lock className="size-3" /> Support team only. AI drafts may use these facts but never mention the notes.
      </p>

      {ticket.notes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {ticket.notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm">
              <p className="whitespace-pre-wrap text-slate-800">{note.body}</p>
              <p className="mt-1 text-xs text-slate-400">
                {note.createdBy?.name ?? 'Support'} · {timeAgo(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <textarea
          className="input min-h-20 bg-white"
          placeholder="e.g. Checked with finance: payout batch failed, re-run scheduled."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
        />
        <div className="mt-2 flex justify-end">
          <button type="submit" className="btn btn-secondary" disabled={!body.trim() || mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Add note
          </button>
        </div>
      </form>
    </section>
  );
}
