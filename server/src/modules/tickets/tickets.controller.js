import { currentUser } from '../../middleware/authenticate.js';
import { validate } from '../../utils/validate.js';
import { openAttachmentStream } from './attachments.js';
import { getOrGenerateDraft } from './draft.service.js';
import * as schemas from './tickets.schemas.js';
import * as ticketsService from './tickets.service.js';
import { runAiTriage } from './triage.service.js';

export async function list(req, res) {
  const query = validate(schemas.listTicketsQuery, req.query);
  res.json(await ticketsService.listTickets(currentUser(req), query));
}

export async function summary(req, res) {
  res.json({ data: await ticketsService.getQueueSummary(currentUser(req)) });
}

export async function create(req, res) {
  const input = validate(schemas.createTicketBody, req.body ?? {});
  const ticket = await ticketsService.createTicket(currentUser(req), input, req.files ?? []);
  res.status(201).location(`/api/tickets/${ticket.id}`).json({ data: ticket });
}

export async function detail(req, res) {
  const { id } = validate(schemas.ticketParams, req.params);
  res.json({ data: await ticketsService.getTicketDetail(currentUser(req), id) });
}

export async function update(req, res) {
  const { id } = validate(schemas.ticketParams, req.params);
  const input = validate(schemas.updateTicketBody, req.body ?? {});
  res.json({ data: await ticketsService.updateTicket(currentUser(req), id, input) });
}

export async function addMessage(req, res) {
  const { id } = validate(schemas.ticketParams, req.params);
  const input = validate(schemas.addMessageBody, req.body ?? {});
  res.status(201).json({ data: await ticketsService.addMessage(currentUser(req), id, input) });
}

export async function addNote(req, res) {
  const { id } = validate(schemas.ticketParams, req.params);
  const { body } = validate(schemas.addNoteBody, req.body ?? {});
  res.status(201).json({ data: await ticketsService.addNote(currentUser(req), id, body) });
}

export async function draft(req, res) {
  const { id } = validate(schemas.ticketParams, req.params);
  const { regenerate } = validate(schemas.draftBody, req.body ?? {});
  res.json({ data: await getOrGenerateDraft(id, { regenerate }) });
}

export async function retriage(req, res) {
  const { id } = validate(schemas.ticketParams, req.params);
  await runAiTriage(id);
  res.json({ data: await ticketsService.getTicketDetail(currentUser(req), id) });
}

export async function downloadAttachment(req, res) {
  const { id, attachmentId } = validate(schemas.attachmentParams, req.params);
  const attachment = await ticketsService.getAttachment(currentUser(req), id, attachmentId);
  // Open the stored file before sending headers, so a storage failure still gets a proper JSON error.
  const stream = await openAttachmentStream(attachment);

  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('Content-Length', attachment.size);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  // Images open in the browser; PDFs download, so their content never runs on our origin.
  if (attachment.mimeType.startsWith('image/')) {
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`);
  } else {
    res.attachment(attachment.filename);
  }

  stream.on('error', () => res.destroy());
  stream.pipe(res);
}
