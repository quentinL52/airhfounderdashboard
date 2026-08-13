const cp = require('child_process');
try {
  const result = cp.execSync('grep -rnw "src/app/(marketing)" -e "15 sept."', { encoding: 'utf8' });
  console.log('Result:', result);
} catch (e) {
  console.log('Exit code:', e.status);
}
