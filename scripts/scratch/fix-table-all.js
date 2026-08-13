const fs = require('fs');
const file = 'src/components/finances/finance-table.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix interface and type references
content = content.replace(/type: 'expense' \| 'revenue';/g, "type: 'expense' | 'income';");
content = content.replace(/=== 'revenue'/g, "=== 'income'");
content = content.replace(/type: 'revenue'/g, "type: 'income'");

// 2. Strip isRecurring references
content = content.replace(/\|\|\s*\(e\.isRecurring && !e\.frequency\)/g, '');
content = content.replace(/\|\|\s*\(i\.isRecurring && !i\.frequency\)/g, '');
content = content.replace(/\|\|\s*\(entry\.isRecurring && !entry\.frequency\)/g, '');
content = content.replace(/\|\|\s*entry\.isRecurring/g, '');
content = content.replace(/\(editingEntry\.isRecurring \? 'monthly' : 'one-time'\)/g, '\'one-time\'');
content = content.replace(/isRecurring: false,/g, 'frequency: \'one-time\',');

// 3. Store method rename and signature fix
content = content.replace(/deleteFinancialEntry = useFounderStore\(s => s\.deleteFinancialEntry\)/g, 'deleteEntry = useFounderStore(s => s.deleteEntry)');
content = content.replace(/updateFinancialEntry = useFounderStore\(s => s\.updateFinancialEntry\)/g, 'updateEntry = useFounderStore(s => s.updateEntry)');
content = content.replace(/deleteFinancialEntry\(deleteId\.monthId, deleteId\.entryId, deleteId\.type\)/g, 'deleteEntry(deleteId.entryId)');
content = content.replace(/updateFinancialEntry\(editingEntry\.monthId, editingEntry\.id, editingEntry\.type,/g, 'updateEntry(editingEntry.id,');

// 4. monthlyEntries flatMap -> entries.map
const mapRegex = /const allEntries = finance\.monthlyEntries\.flatMap[\s\S]*?\}\)\.sort\(\(a, b\) => new Date\(b\.date!\)\.getTime\(\) - new Date\(a\.date!\)\.getTime\(\)\);/;
const mapReplacement = `const allEntries: FlatEntry[] = finance.entries.map(e => ({
            ...e,
            monthId: e.id,
            monthLabel: e.date.substring(0, 7),
            type: e.type,
            date: e.date
        })).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());`;
content = content.replace(mapRegex, mapReplacement);

// 5. Add date field to header logic
content = content.replace(/isHeader: true,\s*headerLabel\s*}\);/g, 'isHeader: true,\n                    headerLabel,\n                    date: \'\'\n                });');

fs.writeFileSync(file, content);
console.log('Fixed finance-table completely');
