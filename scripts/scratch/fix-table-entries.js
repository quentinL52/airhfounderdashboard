const fs = require('fs');
const file = 'src/components/finances/finance-table.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const allEntries = finance\.monthlyEntries\.flatMap[\s\S]*?\}\)\.sort\(\(a, b\) => new Date\(b\.date!\)\.getTime\(\) - new Date\(a\.date!\)\.getTime\(\)\);/;
const replacement = `const allEntries: FlatEntry[] = finance.entries.map(e => ({
            ...e,
            monthId: e.id,
            monthLabel: e.date.substring(0, 7),
            type: e.type,
            date: e.date
        })).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log('Fixed entries mapping');
