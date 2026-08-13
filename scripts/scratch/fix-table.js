const fs = require('fs');
const file = 'src/components/finances/finance-table.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\|\|\s*\(e\.isRecurring && !e\.frequency\)/g, '');
content = content.replace(/\|\|\s*\(i\.isRecurring && !i\.frequency\)/g, '');
content = content.replace(/\|\|\s*\(entry\.isRecurring && !entry\.frequency\)/g, '');
content = content.replace(/\|\|\s*entry\.isRecurring/g, '');
content = content.replace(/\(editingEntry\.isRecurring \? 'monthly' : 'one-time'\)/g, '\'one-time\'');

content = content.replace(/type: 'expense' \| 'revenue';/g, "type: 'expense' | 'income';");
content = content.replace(/=== 'revenue'/g, "=== 'income'");

fs.writeFileSync(file, content);
console.log('Fixed finance-table type and isRecurring');
