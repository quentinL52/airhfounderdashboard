import fs from 'fs';
import path from 'path';

const BASELINE_PATH = path.resolve(process.cwd(), 'scripts/any-baseline.json');
const SRC_DIR = path.resolve(process.cwd(), 'src');

function countAnyOccurrences(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countAnyOccurrences(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(/:\s*any\b/g);
      if (matches) {
        count += matches.length;
      }
    }
  }

  return count;
}

const currentCount = countAnyOccurrences(SRC_DIR);
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
const maxAllowed = baseline.maxAnyOccurrences;

console.log(`[Any Ratchet] Current ': any' count: ${currentCount} (Max allowed: ${maxAllowed})`);

if (currentCount > maxAllowed) {
  console.error(`❌ REGRESSION DETECTED: ': any' count (${currentCount}) exceeds baseline (${maxAllowed}).`);
  process.exit(1);
} else {
  console.log(`✅ ': any' count is within baseline limits.`);
}
