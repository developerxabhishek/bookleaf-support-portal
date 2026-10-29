import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleAlert, FileText, Image, Paperclip, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { fetchMyBooks } from '../../api/books.js';
import { errorMessage, fieldErrors } from '../../api/client.js';
import { queryKeys } from '../../api/query-keys.js';
import { fetchHealth } from '../../api/system.js';
import { createTicket } from '../../api/tickets.js';
import { PageHeader, Spinner } from '../../components/States.jsx';
import { useToast } from '../../components/Toaster.jsx';
import { ATTACHMENT_RULES } from '../../lib/constants.js';
import { formatBytes } from '../../lib/format.js';

const GENERAL = 'general';

function FieldError({ message }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export default function NewTicketPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const fileInput = useRef(null);

  const [bookId, setBookId] = useState(searchParams.get('bookId') ?? GENERAL);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState('');

  const { data: booksResponse, isLoading: booksLoading } = useQuery({ queryKey: queryKeys.books, queryFn: fetchMyBooks });
  const books = booksResponse?.data ?? [];
  // Attachments need file storage on the server; hide the picker rather than fail on submit.
  const { data: health } = useQuery({ queryKey: queryKeys.health, queryFn: fetchHealth, staleTime: 5 * 60_000 });
  const uploadsEnabled = health?.uploads?.enabled ?? true;
  // Ignore a ?bookId that isn't one of this author's books.
  const selectedBookId = books.some((book) => book.id === bookId) ? bookId : GENERAL;

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketLists });
      toast.success(`Ticket #${ticket.ticketNumber} raised. We'll reply here.`);
      navigate(`/tickets/${ticket.id}`);
    },
  });
  const errors = fieldErrors(mutation.error);

  function addFiles(fileList) {
    const incoming = [...fileList];
    const combined = [...files, ...incoming];
    if (combined.length > ATTACHMENT_RULES.maxFiles) {
      setFileError(`You can attach up to ${ATTACHMENT_RULES.maxFiles} files.`);
      return;
    }
    const invalid = incoming.find((file) => !ATTACHMENT_RULES.accept.includes(file.type));
    if (invalid) {
      setFileError(`"${invalid.name}" isn't supported. Please attach JPG, PNG, WebP or PDF files.`);
      return;
    }
    const tooLarge = incoming.find((file) => file.size > ATTACHMENT_RULES.maxBytes);
    if (tooLarge) {
      setFileError(`"${tooLarge.name}" is larger than 5 MB.`);
      return;
    }
    setFileError('');
    setFiles(combined);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData();
    form.append('bookId', selectedBookId);
    form.append('subject', subject);
    form.append('description', description);
    files.forEach((file) => form.append('attachments', file));
    mutation.mutate(form);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Raise a query" subtitle="Tell us what's going on and our author support team will get back to you on this ticket." />

      <form onSubmit={handleSubmit} className="card space-y-5 p-6">
        {mutation.isError && !Object.keys(errors).length && (
          <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <CircleAlert className="size-4 shrink-0" />
            {errorMessage(mutation.error)}
          </p>
        )}

        <div>
          <label htmlFor="book" className="label">
            Which book is this about?
          </label>
          <select
            id="book"
            className="input"
            value={selectedBookId}
            onChange={(event) => setBookId(event.target.value)}
            disabled={booksLoading}
          >
            <option value={GENERAL}>General / Account Level</option>
            {/* Grouped so a book can never be mistaken for the "General" option, even with a similar title. */}
            {books.length > 0 && (
              <optgroup label="Your books">
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                    {book.productionStage.isPublished ? '' : ` (in production: ${book.productionStage.name})`}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <FieldError message={errors.bookId} />
        </div>

        <div>
          <label htmlFor="subject" className="label">
            Subject
          </label>
          <input
            id="subject"
            className="input"
            placeholder="e.g. Royalty for last quarter not received"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
            minLength={5}
            maxLength={150}
          />
          <FieldError message={errors.subject} />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Details
          </label>
          <textarea
            id="description"
            className="input min-h-40"
            placeholder="Include anything that helps us look into it: dates, platforms, order numbers, what you expected to see."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            minLength={20}
            maxLength={5000}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <FieldError message={errors.description} />
            <span className="ml-auto">{description.length}/5000</span>
          </div>
        </div>

        {uploadsEnabled ? (
          <div>
            <span className="label">Attachments (optional)</span>
            <p className="mb-2 text-xs text-slate-500">
              Up to 3 files, 5 MB each (JPG, PNG, WebP or PDF). For print quality issues, photos of the affected pages help us
              verify faster.
            </p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ATTACHMENT_RULES.accept.join(',')}
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInput.current?.click()}
              disabled={files.length >= ATTACHMENT_RULES.maxFiles}
            >
              <Paperclip className="size-4" /> Add files
            </button>
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    {file.type.startsWith('image/') ? <Image className="size-4 text-slate-400" /> : <FileText className="size-4 text-slate-400" />}
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-slate-400">{formatBytes(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <FieldError message={fileError} />
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            File attachments aren't available right now. If our team needs photos or documents, they'll ask for them in their reply.
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner />}
            Submit query
          </button>
        </div>
      </form>
    </div>
  );
}
