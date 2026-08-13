const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const baselinePath = path.join(__dirname, 'type-baseline.json');

let baselineCount = null;
if (fs.existsSync(baselinePath)) {
  try {
    const data = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    baselineCount = data.errorCount;
  } catch (e) {
    console.warn("Could not read baseline, starting fresh.");
  }
}

console.log("Running tsc --noEmit...");

let output = '';
try {
  output = execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
} catch (error) {
  output = error.stdout || '';
}

const lines = output.split('\n');
let relevantErrors = 0;
for (const line of lines) {
  if (line.includes('error TS')) {
    if (line.startsWith('.next/')) {
      continue; // Ignore Next.js auto-generated types errors
    }
    relevantErrors++;
  }
}

const currentErrors = relevantErrors;
console.log(`Current type errors (excluding .next/): ${currentErrors}`);

if (baselineCount === null) {
  console.log(`No baseline found. Setting initial baseline to ${currentErrors}.`);
  fs.writeFileSync(baselinePath, JSON.stringify({ errorCount: currentErrors }, null, 2));
  process.exit(0);
} else {
  console.log(`Baseline type errors: ${baselineCount}`);
  if (currentErrors > baselineCount) {
    console.error(`\n❌ TYPE RATCHET FAILED: Errors increased from ${baselineCount} to ${currentErrors}. Fix your type errors!`);
    process.exit(1);
  } else if (currentErrors < baselineCount) {
    console.log(`\n✅ TYPE RATCHET IMPROVED: Errors decreased from ${baselineCount} to ${currentErrors}. Updating baseline!`);
    fs.writeFileSync(baselinePath, JSON.stringify({ errorCount: currentErrors }, null, 2));
    process.exit(0);
  } else {
    console.log(`\n✅ TYPE RATCHET PASSED: Errors maintained at ${baselineCount}.`);
    process.exit(0);
  }
}
