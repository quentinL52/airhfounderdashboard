const fs = require('fs');

const file = 'src/app/(marketing)/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import CohortBadge
if (!content.includes('CohortBadge')) {
  content = content.replace("import { useTranslations } from 'next-intl';", "import { useTranslations } from 'next-intl';\nimport { CohortBadge } from '@/components/marketing/cohort-badge';");
}

// Replace the badge hardcoded text with <CohortBadge />
content = content.replace(
  /\{t\('heroBadge', \{ cohort: '4', seats: '12', date: '15 sept\.' \}\)\}/g,
  '<CohortBadge />'
);

// Remove `style={{ fontFamily: '"IBM Plex Mono", monospace' }}` and add `font-mono` to className
content = content.replace(/className="(.*?)"\s*style=\{\{\s*fontFamily:\s*'"IBM Plex Mono",\s*monospace'\s*\}\}/g, 'className="$1 font-mono"');

fs.writeFileSync(file, content);
console.log('Fixed page.tsx');
