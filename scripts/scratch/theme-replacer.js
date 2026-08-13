const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const colorMappings = {
    // Fixes from the 3rd pass
    'text-[#282c3a]': 'text-muted-foreground',
    'bg-[#2b2d36]': 'bg-muted',
    'hover:bg-[#2b2d36]': 'hover:bg-muted',
    'bg-[#12141c]': 'bg-background',
    'hover:bg-[#12141c]': 'hover:bg-background',
    'text-[#3a3f52]': 'text-muted-foreground',
    'text-[#00cec9]': 'text-teal-400',
    'text-[#fdcb6e]': 'text-yellow-400',
    'bg-[#00b894]': 'bg-emerald-500',
    'text-[#00b894]': 'text-emerald-500',
    'hover:text-[#ffeaa7]': 'hover:text-yellow-200',
    'hover:bg-[#fdcb6e]': 'hover:bg-yellow-400',
    'bg-[#00cec9]': 'bg-teal-400',
    'border-[#00cec9]': 'border-teal-400',
    'focus:ring-[#6c5ce7]': 'focus:ring-primary',
};

function replaceColorsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Replace exact string matches first
    for (const [hex, variable] of Object.entries(colorMappings)) {
        const regex = new RegExp(hex.replace('[', '\\[').replace(']', '\\]'), 'g');
        content = content.replace(regex, variable);
    }

    // Double check and ensure we catch weird formats
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated: ' + filePath);
        return true;
    }
    return false;
}

function traverseDir(dir) {
    let filesUpdated = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            filesUpdated += traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            if (replaceColorsInFile(fullPath)) {
                filesUpdated++;
            }
        }
    }
    return filesUpdated;
}

const totalUpdated = traverseDir(srcDir);
console.log('Total files updated: ' + totalUpdated);
