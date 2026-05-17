import { ALL_CARDS } from '../packages/client/src/data/cards.js';
import {
  enforceFrameworkCompliance,
  validateAllCards,
} from '../packages/shared/src/utils/card-framework-validator.js';

function runMigrationCheck(): void {
  const results = validateAllCards(ALL_CARDS);

  let compliant = 0;
  let nonCompliant = 0;

  console.log('=== Card Framework Compliance Report ===\n');

  for (const card of ALL_CARDS) {
    const result = results.get(card.id);
    if (!result) {
      continue;
    }

    console.log(`Card: ${card.name} (${card.id})`);
    console.log(`  Valid: ${result.isValid}`);

    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach((err) => console.log(`    - ${err}`));
      nonCompliant++;
    } else {
      compliant++;
    }

    if (result.warnings.length > 0) {
      console.log('  Warnings:');
      result.warnings.forEach((warn) => console.log(`    - ${warn}`));
    }

    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`Total Cards: ${ALL_CARDS.length}`);
  console.log(`Compliant: ${compliant}`);
  console.log(`Non-Compliant: ${nonCompliant}`);
  console.log(`Compliance Rate: ${((compliant / ALL_CARDS.length) * 100).toFixed(2)}%`);

  enforceFrameworkCompliance(ALL_CARDS);
  console.log('\nFramework compliance enforcement passed.');
}

runMigrationCheck();
