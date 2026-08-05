const fs = require('fs');
let code = fs.readFileSync('src/app/(secure-app)/offers/create/page.tsx', 'utf8');

// 1. Add state
code = code.replace(
  'const [targetCurrency, setTargetCurrency] = useState(\'MXN\');',
  `const [targetCurrency, setTargetCurrency] = useState('MXN');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cadence, setCadence] = useState('MONTHLY');`
);

// 2. Add to API call
code = code.replace(
  'target_currency: targetCurrency,\n          exchange_rate: exchangeRate',
  `target_currency: targetCurrency,
          exchange_rate: exchangeRate,
          is_recurring: isRecurring,
          cadence: isRecurring ? cadence : null`
);

// 3. Add UI toggle inside Step 1
const uiInsertionPoint = '<div className="bg-blue-50/50 rounded-xl p-4 flex justify-between items-center border border-blue-100">';
const uiAdd = `
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">Recurring Swap</label>
                    <p className="text-xs text-gray-500">Automatically post this offer again</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {isRecurring && (
                      <select
                        value={cadence}
                        onChange={(e) => setCadence(e.target.value)}
                        className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="BI-WEEKLY">Bi-Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={\`\${isRecurring ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none\`}
                    >
                      <span className={\`\${isRecurring ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out\`} />
                    </button>
                  </div>
                </div>

                `;
code = code.replace(uiInsertionPoint, uiAdd + uiInsertionPoint);

fs.writeFileSync('src/app/(secure-app)/offers/create/page.tsx', code);
console.log('patched page.tsx');
