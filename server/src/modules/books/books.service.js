import { parseProductionStage } from '../../domain/production.js';
import { summarizeRoyalties } from '../../domain/royalty.js';
import { Book } from '../../models/book.model.js';

export function toBookDTO(book) {
  return {
    id: book._id.toString(),
    externalId: book.externalId,
    authorId: book.author.toString(),
    title: book.title,
    isbn: book.isbn,
    genre: book.genre,
    publicationDate: book.publicationDate,
    status: book.status,
    productionStage: parseProductionStage(book.status),
    mrp: book.mrp,
    authorRoyaltyPerCopy: book.authorRoyaltyPerCopy,
    totalCopiesSold: book.totalCopiesSold,
    totalRoyaltyEarned: book.totalRoyaltyEarned,
    royaltyPaid: book.royaltyPaid,
    royaltyPending: book.royaltyPending,
    lastRoyaltyPayoutDate: book.lastRoyaltyPayoutDate,
    printPartner: book.printPartner,
    availableOn: book.availableOn,
  };
}

/**
 * Authors always get their own books; admins get all books or one author's.
 * Returns { books, summary } where summary (account-level royalties) is only
 * present when the list is scoped to a single author.
 */
export async function listBooks(actor, authorId) {
  const scopedAuthorId = actor.role === 'author' ? actor.id : authorId;
  const filter = scopedAuthorId ? { author: scopedAuthorId } : {};

  // Books in production have no publication date and come first, then newest published.
  const books = await Book.find(filter).sort({ publicationDate: 1 }).lean();
  const ordered = [
    ...books.filter((book) => !book.publicationDate),
    ...books.filter((book) => book.publicationDate).reverse(),
  ];

  return {
    books: ordered.map(toBookDTO),
    summary: scopedAuthorId ? summarizeRoyalties(books) : undefined,
  };
}
