import { formatDateTime } from '../../lib/format.js';
import AttachmentList from './AttachmentList.jsx';

export default function OriginalQuery({ ticket, authorName }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-medium tracking-wide uppercase">Original query{authorName ? ` · ${authorName}` : ''}</span>
        <span>{formatDateTime(ticket.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{ticket.description}</p>
      <AttachmentList ticketId={ticket.id} attachments={ticket.attachments} />
    </section>
  );
}
