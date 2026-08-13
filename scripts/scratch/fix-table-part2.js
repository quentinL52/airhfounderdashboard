const fs = require('fs');
const file = 'src/components/finances/finance-table.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/type: 'expense' \| 'revenue'/g, "type: 'expense' | 'income'");

fs.writeFileSync(file, content);
console.log('Fixed deleteId type in finance-table');
