
const fs = require('fs');
const file = 'src/components/finances/finance-table.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/deleteFinancialEntry = useFounderStore\(s => s\.deleteFinancialEntry\)/g, 'deleteEntry = useFounderStore(s => s.deleteEntry)');
content = content.replace(/updateFinancialEntry = useFounderStore\(s => s\.updateFinancialEntry\)/g, 'updateEntry = useFounderStore(s => s.updateEntry)');

content = content.replace(/deleteFinancialEntry\(deleteId\.monthId, deleteId\.entryId, deleteId\.type\)/g, 'deleteEntry(deleteId.entryId)');
content = content.replace(/updateFinancialEntry\(editingEntry\.monthId, editingEntry\.id, editingEntry\.type,/g, 'updateEntry(editingEntry.id,');

fs.writeFileSync(file, content);
console.log('Fixed finance-table methods');

