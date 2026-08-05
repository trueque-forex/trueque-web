const fs = require('fs');
let code = fs.readFileSync('src/pages/api/offers/create.ts', 'utf8');

const importRegex = /import { TruequeSession } from '\.\.\/\.\.\/\.\.\/types\/auth';/;
if (!code.includes('import { TruequeSession }')) {
  // It's there.
}

code = code.replace(
  '    fee_details,\n  } = req.body;',
  '    fee_details,\n    is_recurring,\n    cadence,\n  } = req.body;'
);

code = code.replace(
  '  const symmetriSwapFee = parseFloat((parseFloat(amount) * SYMMETRI_SWAP_FEE_PCT).toFixed(4));',
  `  const symmetriSwapFee = parseFloat((parseFloat(amount) * SYMMETRI_SWAP_FEE_PCT).toFixed(4));

  // Determine next_execution_date if recurring
  let nextExecutionDate = null;
  if (is_recurring && cadence) {
    const now = new Date();
    if (cadence === 'WEEKLY') {
      now.setDate(now.getDate() + 7);
    } else if (cadence === 'BI-WEEKLY') {
      now.setDate(now.getDate() + 14);
    } else if (cadence === 'MONTHLY') {
      now.setMonth(now.getMonth() + 1);
    }
    nextExecutionDate = now.toISOString();
  }`
);

code = code.replace(
  '      fee_total, fee_details, updated_at, status',
  '      fee_total, fee_details, updated_at, status, is_recurring, cadence, next_execution_date'
);
code = code.replace(
  '    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), \'DRAFT\')',
  '    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), \'DRAFT\', $10, $11, $12)'
);

code = code.replace(
  '      fee_details || { symmetri_swap_fee: symmetriSwapFee },',
  '      fee_details || { symmetri_swap_fee: symmetriSwapFee },\n      is_recurring ? true : false,\n      is_recurring ? cadence : null,\n      nextExecutionDate'
);

fs.writeFileSync('src/pages/api/offers/create.ts', code);
console.log('patched create.ts');
