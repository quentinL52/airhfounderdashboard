const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const dirs = [
    './src/app/(app)/finances',
    './src/components/finances',
    './src/components/dashboard'
];

let files = [];
dirs.forEach(d => files = files.concat(walk(d)));

let modified = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('finance.monthlyEntries') || content.includes('finances?.monthlyEntries') || content.includes('monthlyEntries')) {
        let originalContent = content;
        // Add import if not exists
        if (!content.includes('getMonthlyEntries') && (content.includes('finance.monthlyEntries') || content.includes('finances?.monthlyEntries') || content.includes('addMonthlyEntry') || content.includes('deleteFinancialEntry'))) {
            content = "import { getMonthlyEntries } from '@/lib/finance-utils';\n" + content;
        }
        
        // Replace usages
        content = content.replace(/finance\.monthlyEntries/g, 'getMonthlyEntries(finance.entries)');
        content = content.replace(/finances\?\.monthlyEntries/g, 'getMonthlyEntries(finances?.entries || [])');
        
        // also replace old actions with new actions?
        content = content.replace(/addMonthlyEntry/g, 'addEntry');
        content = content.replace(/updateMonthlyEntry/g, 'updateEntry');
        content = content.replace(/deleteFinancialEntry/g, 'deleteEntry');
        content = content.replace(/updateFinancialEntry/g, 'updateEntry');

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            modified++;
        }
    }
});
console.log('Modified ' + modified + ' files.');
