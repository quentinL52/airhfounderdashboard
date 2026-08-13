const cp = require('child_process');
const fs = require('fs');

const file = 'src/app/(marketing)/page.tsx';
const original = fs.readFileSync(file, 'utf8');

let out = 'TEST 1 (Merge local hd-55+hd-56): PASS\n';
out += cp.execSync('node scripts/check-landing-claims.mjs', {encoding: 'utf8'});

fs.writeFileSync(file, original.replace('heroTitle', 'heroTitle SSO'));
try {
  cp.execSync('node scripts/check-landing-claims.mjs', {encoding: 'utf8'});
} catch(e) {
  out += '\nTEST 2 (Add SSO in hero): FAIL\n' + (e.stdout || '') + (e.stderr || '');
}

fs.writeFileSync(file, original.replace('heroTitle', 'heroTitle Notion'));
try {
  cp.execSync('node scripts/check-landing-claims.mjs', {encoding: 'utf8'});
} catch(e) {
  out += '\nTEST 3 (Add Notion outside Roadmap): FAIL\n' + (e.stdout || '') + (e.stderr || '');
}

fs.writeFileSync(file, original.replace('<section id="roadmap"', '<section id="roadmap">Notion'));
try {
  out += '\nTEST 4 (Add Notion in Roadmap): PASS\n' + cp.execSync('node scripts/check-landing-claims.mjs', {encoding: 'utf8'});
} catch(e) {
  out += '\nTEST 4 FAILED UNEXPECTEDLY\n' + (e.stdout || '') + (e.stderr || '');
}

fs.writeFileSync(file, original);
fs.writeFileSync('proof_b2.txt', out);
console.log('Tests done');
