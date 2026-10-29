import { FileText, Paperclip } from 'lucide-react';
import { attachmentUrl } from '../../api/tickets.js';
import { formatBytes } from '../../lib/format.js';

export default function AttachmentList({ ticketId, attachments }) {
  if (!attachments?.length) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 flex items-center gap-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
        <Paperclip className="size-3.5" /> Attachments
      </p>
      <div className="flex flex-wrap gap-3">
        {attachments.map((file) => {
          const url = attachmentUrl(ticketId, file.id);
          const isImage = file.mimeType.startsWith('image/');
          return (
            <a
              key={file.id}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="group flex w-40 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-brand-200"
            >
              {isImage ? (
                <img src={url} alt={file.filename} className="h-24 w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-24 items-center justify-center bg-slate-50">
                  <FileText className="size-8 text-slate-400" />
                </div>
              )}
              <div className="px-2 py-1.5">
                <p className="truncate text-xs font-medium text-slate-700 group-hover:text-brand-700">{file.filename}</p>
                <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
