# BookLeaf Author Support & Communication Portal

A support portal for BookLeaf Publishing with two sides:

- **Author portal:** authors log in, see their books and royalties, raise support tickets and read replies live.
- **Admin portal:** the support team works a queue where every ticket is already categorised and prioritised by AI, and every reply starts as an AI draft built from BookLeaf's policies and the author's real account data.

| | |
|---|---|
| **Live demo** | https://bookleaf-support-portal-o0e7.onrender.com |
| **API docs (Swagger)** | https://bookleaf-support-portal-o0e7.onrender.com/api/docs |
| **Write-up** | [WRITEUP.md](WRITEUP.md) |

> **First visit can take about a minute.** The demo runs on Render's free plan, which puts the server to sleep after 15 minutes without traffic. After the first load it is fast.

---

## Test logins

**Support team (admin portal):** password `Admin@123`

| Name | Email |
|---|---|
| Aditi Rao | `admin@bookleaf.com` |
| Karan Mehta | `karan@bookleaf.com` |
| Abhishek Pandey | `abhishek@bookleaf.com` |
| Emma Clarke | `emma@bookleaf.com` |

**Authors (author portal):** password `Author@123`. These are the 10 authors from `bookleaf_sample_data.json`.

| Author | Email | Worth checking |
|---|---|---|
| Priya Sharma | `priya.sharma@email.com` | Two published books, royalty pending |
| Rohit Kapoor | `rohit.kapoor@email.com` | Best-selling author, large pending royalty |
| Ananya Reddy | `ananya.reddy@email.com` | Never been paid: AI treats a royalty question as overdue |
| Vikram Joshi | `vikram.joshi@email.com` | One book fully paid, one with pending royalty |
| Meera Nair | `meera.nair@email.com` | Book listed on Amazon US |
| Arjun Malhotra | `arjun.malhotra@email.com` | Never been paid |
| Sneha Kulkarni | `sneha.kulkarni@email.com` | Three books, one in production (Cover Design) |
| Farhan Sheikh | `farhan.sheikh@email.com` | Fully paid, nothing pending |
| Kavita Deshmukh | `kavita.deshmukh@email.com` | Book in production (Typesetting) and ₹850 pending, below the ₹1,000 payout minimum |
| Diya Chatterjee | `diya.chatterjee@email.com` | Two books, one never paid |

## How to test

The admin queue starts empty, so start as an author:

1. **As an author** (e.g. Priya), open **My Books**, then **Raise a query**. Pick a book, write a subject and a few lines, attach a photo if you like, and submit.
2. **In a second browser or a private window**, log in as **admin@bookleaf.com**. The ticket appears in the **Ticket queue** straight away. Within a few seconds the AI sets its category and priority.
3. **Open the ticket.** The AI draft appears in the reply box, using the author's real numbers. Edit it and click **Send reply**.
4. **Back in the author's window**, the reply shows up without refreshing the page.

Also worth trying: change the category or priority (it is marked **Edited** and the AI never overwrites it), add an internal note (the author never sees it), assign the ticket to yourself, and use the queue filters.

---

## Features

### Author portal
- **Login** with email and password. Authors can only ever see their own data.
- **My Books:** title, ISBN, genre, publication date, status, MRP, copies sold, royalty earned, paid and pending. A summary on top explains what happens next: the next payout date, "below the ₹1,000 minimum, rolls over", or "fully paid up". Books still in production show a 9-step progress bar instead of empty sales fields.
- **Raise a query:** choose a book or "General / Account Level", add a subject, details and up to 3 files (JPG, PNG, WebP or PDF, 5 MB each). Uploads are real: stored in a private bucket.
- **My Tickets:** status, the original query and every reply. Updates arrive live. Replying to a resolved ticket reopens it; closed tickets are read-only.

### Admin portal
- **Ticket queue:** most urgent first, then longest-waiting. Filters for status, category, priority, assignee and date, plus search. Critical tickets have a red edge, and tickets waiting too long are flagged.
- **AI classification and priority:** set automatically, with the AI's reason and confidence. The team can override both.
- **AI draft reply:** built from the BookLeaf knowledge base and the author's account. Edit, then **Send** or **Send & mark resolved**.
- **Ticket management:** change status, assign to yourself or a teammate, and add internal notes.
- **Author context:** the author's contact details, royalty position and all their books, next to the ticket.

---

## Tech stack

| Part | Choice | Why |
|---|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, TanStack Query, React Router | Fast to build; TanStack Query handles server data and caching, so no Redux was needed |
| Backend | Node.js 22, Express 5, zod | Simple REST API; zod checks every request |
| Database | MongoDB (Atlas) with Mongoose | Flexible documents, free hosted tier |
| AI | OpenAI `gpt-4o-mini` | Cheap, fast, and supports structured JSON output (see below) |
| Live updates | Server-Sent Events | Updates only go from server to browser; simple and works with the login cookie |
| File storage | Backblaze B2 through the S3 API | Free tier; the same code works with AWS S3 |
| Hosting | Render (one web service) | The API also serves the built React app, so everything is on one URL |

---

## Run it locally

You need **Node.js 20.19+** (built on 22), a **MongoDB** database (local or a free Atlas cluster), and optionally an **OpenAI API key** and an **S3-compatible bucket**.

`client/` and `server/` are separate npm projects, so run them in two terminals:

```bash
# Terminal 1: API on http://localhost:4000
cd server
npm install
cp .env.example .env      # fill in the values (see below)
npm run seed              # loads the sample authors and books, plus the admin accounts
npm run dev

# Terminal 2: web app on http://localhost:5173
cd client
npm install
npm run dev
```

The web app forwards `/api` calls to the API, so open **http://localhost:5173**.

### Environment variables (`server/.env`)

| Variable | Needed? | What it is |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string, e.g. `mongodb://127.0.0.1:27017/bookleaf` |
| `JWT_SECRET` | Yes | Random string of 32+ characters (`openssl rand -hex 32`) |
| `SEED_ADMIN_PASSWORD`, `SEED_AUTHOR_PASSWORD` | For `npm run seed` | Passwords given to the seeded accounts (8+ characters) |
| `OPENAI_API_KEY` | No | Without it, the app runs without AI: keyword rules set category and priority, and the team writes replies by hand |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | No | Default `20000` |
| `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | No | Private bucket for attachments. Without them, the file picker is hidden and tickets are text-only |
| `S3_ENDPOINT` | No | Only for S3-compatible services like Backblaze B2 (e.g. `https://s3.eu-central-003.backblazeb2.com`) |
| `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, `CLIENT_ORIGIN` | No | Defaults: `7d`, `4000`, `development`, empty |

The server checks these at start-up and stops with a clear message if something required is missing. `npm run seed` wipes the database and recreates the data.

---

## Architecture

```
React app (client/)                         Express API (server/)
  pages, components                           routes → controllers → services → models
  TanStack Query (server data)  ── REST ──▶   middleware: login check, role check, rate limits,
  AuthContext (who is logged in)              input checks (zod), error handler
  useTicketEvents (live updates) ◀── SSE ──   realtime/sse: sends event IDs to the right users
                                              ai/: prompts, knowledge base, OpenAI client, keyword rules
                                                 │              │               │
                                              MongoDB     Backblaze B2       OpenAI
```

### Folder structure

```
server/
  data/bookleaf_sample_data.json   the dataset provided with the brief
  docs/openapi.yaml                API documentation (served at /api/docs)
  src/
    config/       environment checks
    domain/       business rules: statuses, royalty calendar, production stages
    models/       User, Book, Ticket, Message, Note, Counter, AiCall
    modules/      auth, books, tickets, users (each: routes → controller → service)
    ai/           OpenAI client, triage, drafts, keyword rules, knowledge base, prompts/
    realtime/     Server-Sent Events
    storage/      S3 client for attachments
    middleware/   authentication, roles, rate limits, error handling
    scripts/      seed
client/
  src/
    api/          API calls and cache keys
    context/      login session
    hooks/        live updates
    lib/          formatting and constants
    components/   shared UI plus books/, tickets/ and admin/ pieces
    pages/        author/ and admin/ screens
```

### Key decisions

- **Each feature is split into routes, controller and service.** HTTP handling, business logic and database code stay separate.
- **Authors can only reach their own data.** Every query is filtered by the logged-in author. Asking for someone else's ticket returns **404**, not 403, so ticket IDs cannot be guessed.
- **Different responses for authors and admins.** Authors never receive priority, AI details, the assignee or internal notes.
- **Internal notes live in their own collection,** so no author-facing query can return one by mistake.
- **The AI's suggestion is stored separately** from the ticket's current category and priority, each marked as set by rules, AI or admin. An admin override is never overwritten.
- **Login uses a JWT in an httpOnly cookie,** so JavaScript in the page cannot read it. The same token also works as a Bearer header for Swagger and Postman.
- **Live updates carry only IDs.** The browser then reloads the data through the normal API, so access checks happen in one place.
- **Consistent errors:** every error is `{ error: { code, message, details } }` with the right HTTP status.

---

## AI integration

All AI code is in [server/src/ai](server/src/ai).

### Why `gpt-4o-mini`
- Both tasks (classify a ticket, write a short reply from given facts) are simple, so a large model is not needed. A person always reviews the reply.
- It supports **structured output**, so the model can only return one of the 6 categories and 4 priorities.
- It is cheap and fast (triage finishes in a second or two).
- The model is set by `OPENAI_MODEL`, and all calls go through one file, so switching is easy.

### 1. Category and priority (triage)
1. When a ticket is created, **keyword rules** ([fallback.js](server/src/ai/fallback.js)) give it a category and priority instantly, so it is sorted from the first second.
2. Then, in the background, **the AI** reads the ticket ([triage.prompt.js](server/src/ai/prompts/triage.prompt.js)) and improves both. It gets:
   - the 6 category definitions and a priority rubric, built from the brief's hints ("no royalty for 6 months" ranks above "update my author bio"; ISBN errors are high priority),
   - a one-line summary of the book (status, pending royalty, last payout),
   - an instruction to judge the problem, not the author's tone.
3. The AI returns JSON with its reasoning first, then the labels. The result is checked with zod before it is saved. If an admin has already changed a value, the AI's suggestion is recorded but not applied.

### 2. Reply drafts
When an admin opens a ticket that is waiting for a reply, the AI writes a draft ([draft.prompt.js](server/src/ai/prompts/draft.prompt.js)). The prompt has three parts:
1. **How BookLeaf writes:** the tone rules from the brief (acknowledge the concern first, be specific, own BookLeaf's mistakes, give a clear timeline, end with a next step) and strict rules (never invent numbers or dates, no promises outside policy).
2. **Only the relevant policy:** the knowledge base is split into 6 sections ([knowledge-base.js](server/src/ai/knowledge-base.js)). A ticket gets the sections for its category plus any matched by keywords, at most 3. It also gets the "how to answer" guide for its category, taken from the brief's sample answers.
3. **Facts worked out in code:** today's date, the next payout date, whether the author is over the ₹1,000 minimum, whether a payment looks overdue, and the book's production stage ([royalty.js](server/src/domain/royalty.js), [production.js](server/src/domain/production.js)). The AI writes; it never does the maths.

It also gets the original query, the **last 6 messages** and the **last 3 internal notes** (it may use facts from notes but never mentions them). Author text is wrapped in tags and marked as data, so instructions hidden in a ticket are ignored.

The draft is saved on the ticket. If the author replies after that, the draft is marked out of date and the admin can regenerate it. A draft never overwrites text the admin has already typed.

### 3. If the AI fails
Every AI call goes through [openai.client.js](server/src/ai/openai.client.js): a 20-second timeout, 2 retries, and a **circuit breaker** that pauses AI calls for 60 seconds after 3 failures in a row, so the app doesn't keep waiting on a broken service.

| Situation | What happens |
|---|---|
| No API key | App runs without AI. Keyword rules set category and priority; admins write replies by hand. |
| OpenAI down, slow or rate-limited | The ticket keeps its keyword-based values (marked **Auto**, with a retry button). The draft box says AI is unavailable and the admin writes manually. |
| Repeated failures | The circuit breaker pauses AI calls; the queue shows "AI paused". |
| Strange AI output | Rejected by the zod check; nothing bad is saved. |
| Server restarts during triage | Unfinished tickets are picked up again on start-up. |

Creating tickets, replying, notes and live updates never depend on the AI.

### 4. Keeping cost low
| What | Effect |
|---|---|
| Small model (`gpt-4o-mini`) | Low price per token |
| Only 1–3 relevant policy sections per draft | Sends 10–41% of the knowledge base instead of all of it |
| Drafts made once and saved; auto-drafted only when the author is waiting for a reply | Reopening a ticket costs nothing |
| Two admins opening the same ticket share one AI call | No duplicate cost |
| Last 6 messages and 3 notes only; long text is cut | Prompt size stays small however long the thread gets |
| Output limits (150 tokens for triage, 600 for drafts) | Answer length is capped |
| Fixed instructions placed first in every prompt | OpenAI can reuse them through its automatic prompt caching |
| Ticket creation limited to 20 per author per hour | Stops runaway cost from abuse or a broken client |
| Every AI call logged (tokens, time, success) in `aicalls` | Real cost can be checked at any time |

Measured on the live demo: triage uses about 790 input + 40 output tokens, a draft about 1,260 + 190. At `gpt-4o-mini` list prices that is roughly **$0.0004 per ticket**.

### 5. API key safety
The OpenAI key (and every other secret) lives only in server environment variables. It is never in the code, the repository or the browser bundle.

---

## API

Interactive docs: **`/api/docs`** (Swagger). Log in with `POST /api/auth/login`, copy the returned token, and click **Authorize**.

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/health` | anyone | Server status, AI status, whether uploads are on |
| POST | `/api/auth/login` | anyone | Log in (sets the cookie and returns a token) |
| POST | `/api/auth/logout` | anyone | Log out |
| GET | `/api/auth/me` | logged in | Current user |
| GET | `/api/books` | author: own · admin: all | Books plus a royalty summary |
| GET | `/api/tickets` | author: own · admin: all | Ticket list with filters: `status, category, priority, assignee, from, to, q, sort, page, limit` |
| POST | `/api/tickets` | author | New ticket (multipart, up to 3 files) |
| GET | `/api/tickets/summary` | admin | Queue counts |
| GET | `/api/tickets/:id` | owner · admin | Ticket with conversation (admins also get notes, AI details and author context) |
| PATCH | `/api/tickets/:id` | admin | Change status, category, priority or assignee |
| POST | `/api/tickets/:id/messages` | owner · admin | Reply |
| POST | `/api/tickets/:id/notes` | admin | Internal note |
| POST | `/api/tickets/:id/draft` | admin | Get or regenerate the AI draft |
| POST | `/api/tickets/:id/triage` | admin | Run AI classification again |
| GET | `/api/tickets/:id/attachments/:attachmentId` | owner · admin | Download a file |
| GET | `/api/users/admins` | admin | Support team list, for assigning |
| GET | `/api/events` | logged in | Live update stream (SSE) |

Errors always look like `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`. Codes include `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `AI_UNAVAILABLE` and `UPLOADS_UNAVAILABLE`.

Rate limits: 20 login attempts per 15 minutes per IP, and 20 new tickets per hour per author.

---

## Assumptions

- **Royalty dates:** the brief says royalties are paid quarterly, within 45 days of the quarter ending. I used calendar quarters (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec).
- **₹1,000 minimum:** applied to the author's total across all books, since payouts go to one bank account.
- **"Overdue":** the brief doesn't define it. I treat a payout as likely overdue when the author is over ₹1,000 and nothing has been paid for more than one quarter plus 45 days (135 days).
- **Today's real date is used.** The sample data's last payouts are from late 2025, so most pending royalties now look overdue, and the AI drafts treat them that way.
- **Priority rules:** the brief gave the four levels and two examples; the full rubric (in the write-up) is my own.
- **Response targets** used to flag waiting tickets (Critical 4h, High 24h, Medium 48h, Low 72h) are my assumption, not a BookLeaf policy.
- **Admin accounts** are mine; the dataset has only authors. All seeded passwords are demo passwords.
- **Authors don't see priority,** only status and category.
- **No sign-up page:** author accounts come from BookLeaf's onboarding, not from the support portal.
- **The repository is public** because the submission email asked for it (the brief said private).

---

## Known limitations and next steps

- Live updates and background AI work run inside one server. Several servers would need Redis and a job queue.
- Saving a message and updating its ticket are two separate writes, not one database transaction.
- The knowledge base is in code; the team can't edit it from the app yet.
- Files can be attached only when a ticket is created, not to later replies, and they are not virus-scanned.
- No sign-up, password reset or staff SSO.
- No automated test suite; all flows were checked by hand on the live site.
- The free hosting plan sleeps when idle, so the first visit is slow.

More on what I would build next is in [WRITEUP.md](WRITEUP.md).
