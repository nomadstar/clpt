import { app } from './app';
import { createStubClient } from './blockchain/client';
import { log } from './logger';

const port = process.env.PORT || 3000;

async function main() {
  app.listen(port, () => log.info(`server listening on ${port}`));
  const bc = createStubClient();
  if (bc.startListening) await bc.startListening();
}

main().catch(err => { log.error(err); process.exit(1); });
