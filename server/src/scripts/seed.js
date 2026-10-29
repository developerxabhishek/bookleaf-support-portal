/**
 * Seeds the database from server/data/bookleaf_sample_data.json plus the demo
 * admin accounts. Re-running wipes all data (including tickets) and recreates it.
 *
 *   npm run seed     # from server/
 */
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../db/connect.js';
import { AiCall } from '../models/ai-call.model.js';
import { Book } from '../models/book.model.js';
import { Message } from '../models/message.model.js';
import { Note } from '../models/note.model.js';
import { Ticket } from '../models/ticket.model.js';
import { User } from '../models/user.model.js';

const DATA_PATH = path.resolve(import.meta.dirname, '../../data/bookleaf_sample_data.json');

// Demo passwords come from server/.env so none are hardcoded here.
const ADMIN_PASSWORD = env.SEED_ADMIN_PASSWORD;
const AUTHOR_PASSWORD = env.SEED_AUTHOR_PASSWORD;
const MIN_PASSWORD_LENGTH = 8;

// The dataset has no support staff, so the admin portal gets demo agents (several, so assignment can be tested).
const ADMINS = [
  { name: 'Aditi Rao', email: 'admin@bookleaf.com' },
  { name: 'Karan Mehta', email: 'karan@bookleaf.com' },
  { name: 'Abhishek Pandey', email: 'abhishek@bookleaf.com' },
  { name: 'Emma Clarke', email: 'emma@bookleaf.com' },
];

// --- Dataset shape (validated so a malformed file fails loudly) -------------

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const bookRecord = z.object({
  book_id: z.string(),
  title: z.string(),
  isbn: z.string(),
  genre: z.string(),
  publication_date: isoDate.nullable(),
  status: z.string(),
  mrp: z.number().nullable(),
  author_royalty_per_copy: z.number().nullable(),
  total_copies_sold: z.number(),
  total_royalty_earned: z.number(),
  royalty_paid: z.number(),
  royalty_pending: z.number(),
  last_royalty_payout_date: isoDate.nullable(),
  print_partner: z.string().nullable(),
  available_on: z.array(z.string()),
});
const dataset = z.object({
  authors: z.array(
    z.object({
      author_id: z.string(),
      name: z.string(),
      email: z.email(),
      phone: z.string(),
      city: z.string(),
      joined_date: isoDate,
      books: z.array(bookRecord),
    }),
  ),
});

const toDate = (value) => (value ? new Date(`${value}T00:00:00.000Z`) : null);

// --- Seeding ---------------------------------------------------------------

async function clearDatabase() {
  // Tickets reference users and books, so everything is reset together.
  await Promise.all([User, Book, Ticket, Message, Note, AiCall].map((model) => model.deleteMany({})));
  await mongoose.connection.db.collection('counters').deleteMany({});
}

async function seedUsersAndBooks() {
  const data = dataset.parse(JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')));
  const [authorHash, adminHash] = await Promise.all([bcrypt.hash(AUTHOR_PASSWORD, 10), bcrypt.hash(ADMIN_PASSWORD, 10)]);

  await User.insertMany(ADMINS.map((admin) => ({ ...admin, role: 'admin', passwordHash: adminHash })));

  let bookCount = 0;
  for (const author of data.authors) {
    const user = await User.create({
      name: author.name,
      email: author.email,
      role: 'author',
      passwordHash: authorHash,
      externalId: author.author_id,
      phone: author.phone,
      city: author.city,
      joinedAt: toDate(author.joined_date),
    });

    const books = await Book.insertMany(
      author.books.map((book) => ({
        externalId: book.book_id,
        author: user._id,
        title: book.title,
        isbn: book.isbn,
        genre: book.genre,
        publicationDate: toDate(book.publication_date),
        status: book.status,
        mrp: book.mrp,
        authorRoyaltyPerCopy: book.author_royalty_per_copy,
        totalCopiesSold: book.total_copies_sold,
        totalRoyaltyEarned: book.total_royalty_earned,
        royaltyPaid: book.royalty_paid,
        royaltyPending: book.royalty_pending,
        lastRoyaltyPayoutDate: toDate(book.last_royalty_payout_date),
        printPartner: book.print_partner,
        availableOn: book.available_on,
      })),
    );
    bookCount += books.length;
  }

  return { authorCount: data.authors.length, bookCount };
}

async function main() {
  if ([ADMIN_PASSWORD, AUTHOR_PASSWORD].some((password) => !password || password.length < MIN_PASSWORD_LENGTH)) {
    throw new Error(
      `Set SEED_ADMIN_PASSWORD and SEED_AUTHOR_PASSWORD (at least ${MIN_PASSWORD_LENGTH} characters) in server/.env; see .env.example.`,
    );
  }
  await connectDatabase(env.MONGODB_URI);

  console.log('[seed] clearing existing data…');
  await clearDatabase();
  await Promise.all([User, Book, Ticket, Message, Note, AiCall].map((model) => model.syncIndexes()));

  const { authorCount, bookCount } = await seedUsersAndBooks();
  console.log(`[seed] ${ADMINS.length} admins, ${authorCount} authors, ${bookCount} books`);

  console.log(`
Demo logins
  Admins   ${ADMINS.map((admin) => admin.email).join(', ')}   (password: SEED_ADMIN_PASSWORD)
  Authors  any author email from the dataset, e.g. priya.sharma@email.com   (password: SEED_AUTHOR_PASSWORD)
`);
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
