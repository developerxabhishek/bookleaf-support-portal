# Write-up: Author Support & Communication Portal

**Abhishek Pandey**

## How I understood the problem

The brief says author questions are handled manually, which leads to slow replies, inconsistent answers and a growing backlog. Most of that time goes into answering: for every ticket, someone has to open the author's account, find the right policy, and write a clear, polite reply. So I built the tool to make that step fast. **Every ticket arrives already sorted, and every reply starts as a ready draft that uses the author's real numbers.**

## What I focused on

1. **The app works even when the AI does not.** New tickets are saved at once and get a quick category and priority from keyword rules; the AI improves them in the background. If OpenAI is down, tickets still come in and the team replies by hand.
2. **AI replies built on facts.** The code works out the facts (next payout date, the ₹1,000 minimum, late payments, production stage) and gives them to the AI with the relevant policy and BookLeaf's tone rules. The AI writes; it does not do maths. A person always reviews the draft before it is sent.
3. **Low AI cost.** A small model (gpt-4o-mini), only the relevant policy and recent messages, and each draft is made once and saved.
4. **Easy to use.** The author's books and royalties sit next to each ticket, and replies appear live for authors.

## How priority is decided

The brief gave four levels and two hints: "no royalty for 6 months" must rank above "update my author bio", and ISBN errors are high priority. I turned these into rules:

- **Critical:** money or rights at real risk, e.g. no royalty for 6+ months, a legal threat.
- **High:** sales blocked or escalated by policy, e.g. ISBN errors, damaged prints, a book showing unavailable, a late payout.
- **Medium:** needs a check but nothing is broken, e.g. "my royalty looks low".
- **Low:** information or small changes, e.g. updating an author bio.

The AI judges the problem, not the author's tone, and the team can always change it. The queue shows Critical first, then the longest-waiting ticket within each level.

## Trade-offs I made

- **Server-Sent Events, not WebSockets:** updates only go from server to browser, so SSE is enough and simpler (plain HTTP, the login cookie works, automatic reconnect). The cost: no two-way channel for things like a "typing…" indicator.
- **Keyword matching, not vector search, to pick policy sections:** a ticket needs only one or two of six short policy sections, so category plus keywords is cheap, fast and predictable. A much bigger knowledge base would need vector search.
- **Background AI work and live connections run inside the app,** not in a job queue or Redis. Fine on one server; several servers would need Redis (for SSE or WebSockets alike) and a queue.
- **Free hosting:** the server sleeps when idle, so the first visit can take about a minute.

## How I would grow this into a real product

1. **Reliability:** a job queue, Redis, and alerts on AI errors and cost.
2. **Measure the AI:** the app already records priority overrides and draft use; I would turn this into a dashboard and a test set of real tickets.
3. **Careful automation:** once the AI proves accurate, auto-send replies to simple, low-risk questions.
4. **Live data:** connect to BookLeaf's real royalty and production systems.
5. **Every channel:** turn emails and WhatsApp messages into tickets, and alert authors there when the team replies.
6. **Self-serve answers:** answer common questions (payout dates, listing times) before a ticket is raised.
7. **Languages:** support Hindi and other Indian languages.
8. **Spot bulk issues:** group tickets about one problem (like an Amazon outage) and update them together.
9. **Team workload:** auto-assign tickets by workload and report response times.
10. **Accounts and safety:** invite links, password reset, staff SSO, virus scanning and automated tests.
