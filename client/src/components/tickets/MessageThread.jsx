import { Sparkles } from 'lucide-react';
import { formatDateTime } from '../../lib/format.js';

export default function MessageThread({ messages, viewerRole }) {
  if (messages.length === 0) return null;

  return (
    <ol className="space-y-4">
      {messages.map((message) => {
        const isMine = message.senderRole === viewerRole;
        const isSupport = message.senderRole === 'admin';
        const label = isSupport && viewerRole === 'author' ? `${message.senderName} · BookLeaf Support` : message.senderName;

        return (
          <li key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{label}</span>
                <span>{formatDateTime(message.createdAt)}</span>
                {message.aiDraftUsed && (
                  <span className="inline-flex items-center gap-0.5 text-violet-600" title="Started from the AI draft">
                    <Sparkles className="size-3" /> AI-assisted
                  </span>
                )}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isSupport ? 'border border-brand-100 bg-brand-50 text-slate-800' : 'border border-slate-200 bg-white text-slate-800'
                }`}
              >
                {message.body}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
