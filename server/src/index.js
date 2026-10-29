import { env } from './config/env.js';
import { createApp } from './app.js';
import { connectDatabase } from './db/connect.js';
import { resumePendingTriage } from './modules/tickets/triage.service.js';

async function main() {
  await connectDatabase(env.MONGODB_URI);

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT} (API docs at /api/docs)`);
    console.log(
      env.aiEnabled
        ? `[ai] enabled with model ${env.OPENAI_MODEL}`
        : '[ai] OPENAI_API_KEY not set: running in rules-only mode (no AI triage or drafts)',
    );
  });

  void resumePendingTriage();
}

main().catch((error) => {
  console.error('[server] failed to start', error);
  process.exit(1);
});
