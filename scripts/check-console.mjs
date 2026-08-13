import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_DIR = path.join(__dirname, '../src/app/api');

let violationCount = 0;
let fileCount = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js') || entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
      fileCount++;
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);

  let inBlockComment = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Track multi-line comments
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
      inBlockComment = true;
      return;
    }

    // Skip single line comments
    if (trimmed.startsWith('//')) {
      return;
    }

    // Strip inline single line comments for checking
    const commentIdx = line.indexOf('//');
    const codePart = commentIdx !== -1 ? line.substring(0, commentIdx) : line;

    // Check for console.<method>
    const consoleRegex = /\bconsole\.(log|error|warn|info|debug|trace|dir|table|time|timeEnd|group|groupEnd)\b/;
    if (consoleRegex.test(codePart)) {
      console.error(`❌ [CONSOLE PROHIBITED] ${relativePath}:${index + 1}`);
      console.error(`   > ${trimmed}`);
      violationCount++;
    }
  });
}

console.log(`🔍 Checking for direct console calls in ${API_DIR}...`);
scanDirectory(API_DIR);

if (violationCount > 0) {
  console.error(`\n❌ Found ${violationCount} console call(s) in src/app/api/ across ${fileCount} file(s).`);
  console.error(`👉 Replace raw console statements with 'logger' from '@/lib/logging/logger'.`);
  process.exit(1);
} else {
  console.log(`\n✅ Console check passed! Zero console calls in src/app/api/ (${fileCount} files scanned).`);
  process.exit(0);
}
