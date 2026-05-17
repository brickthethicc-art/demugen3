import { ALL_CARDS } from '../packages/client/src/data/cards.js';
import {
  CARD_FRAMEWORK_VERSION,
  createDefaultCardFramework,
} from '../packages/shared/src/types/card.js';

function migrateFrameworkVersion(targetVersion: string) {
  const currentVersion = CARD_FRAMEWORK_VERSION;
  console.log(`Migrating framework from ${currentVersion} to ${targetVersion}`);

  for (const card of ALL_CARDS) {
    if (!card.framework) {
      card.framework = createDefaultCardFramework({ frameworkVersion: targetVersion });
      continue;
    }

    if (card.framework.frameworkVersion !== targetVersion) {
      card.framework.frameworkVersion = targetVersion;
      card.framework.frameworkLastUpdated = new Date().toISOString();
    }
  }

  console.log(`Updated ${ALL_CARDS.length} cards in memory to framework version ${targetVersion}`);
  console.log('Persist card data changes manually in packages/client/src/data/cards.ts when needed.');
  console.log('Migration complete.');
}

if (process.argv[2]) {
  migrateFrameworkVersion(process.argv[2]);
} else {
  console.log('Usage: pnpm --filter @mugen/server exec tsx ../../scripts/migrate-framework-version.ts <target-version>');
}
