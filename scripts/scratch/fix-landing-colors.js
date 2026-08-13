const fs = require('fs');

const file = 'src/app/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace colors
const replacements = [
  { p: /bg-\[#E9E4D8\]/g, r: 'bg-background' },
  { p: /text-\[#0E1B2E\]/g, r: 'text-foreground' },
  { p: /selection:bg-\[#F0522E\]/g, r: 'selection:bg-primary' },
  { p: /selection:text-\[#F5F1E8\]/g, r: 'selection:text-primary-foreground' },
  { p: /border-\[#0E1B2E\]\/10/g, r: 'border-border' },
  { p: /border-\[#0E1B2E\]\/12/g, r: 'border-border' },
  { p: /border-\[#0E1B2E\]\/20/g, r: 'border-border' },
  { p: /border-\[#0E1B2E\]\/5/g, r: 'border-border' },
  { p: /border-\[#EAE6DC\]\/8/g, r: 'border-border' },
  { p: /bg-\[#0E1B2E\]\/12/g, r: 'bg-muted' },
  { p: /bg-\[#0E1B2E\]\/5/g, r: 'bg-muted' },
  { p: /bg-\[#0E1B2E\]\/8/g, r: 'bg-muted' },
  { p: /bg-\[#0E1B2E\]/g, r: 'bg-primary text-primary-foreground' },
  { p: /text-\[#4a5666\]/g, r: 'text-muted-foreground' },
  { p: /text-\[#3a4656\]/g, r: 'text-foreground' },
  { p: /bg-\[#F0522E\]/g, r: 'bg-primary' },
  { p: /text-\[#F0522E\]/g, r: 'text-primary' },
  { p: /text-\[#F5F1E8\]/g, r: 'text-primary-foreground' },
  { p: /text-\[#EAE6DC\]/g, r: 'text-primary-foreground' },
  { p: /bg-\[#F5F1E8\]/g, r: 'bg-muted' },
  { p: /bg-\[#FBF8F1\]/g, r: 'bg-muted/80' },
  { p: /text-\[#8a8474\]/g, r: 'text-muted-foreground' },
  { p: /text-\[#a9b2c0\]/g, r: 'text-primary-foreground/80' },
  { p: /text-\[#9aa4b3\]/g, r: 'text-primary-foreground/70' },
  { p: /text-\[#8a95a6\]/g, r: 'text-muted-foreground' },
  { p: /text-\[#6e7b90\]/g, r: 'text-muted-foreground' },
  { p: /text-\[#5a6678\]/g, r: 'text-muted-foreground' },
  { p: /bg-\[#0B1524\]/g, r: 'bg-card' },
  { p: /shadow-\[#F0522E\]\/30/g, r: 'shadow-primary/30' },
  { p: /border-\[#F0522E\]/g, r: 'border-primary' },
  { p: /color="#0E1B2E"/g, r: 'color="currentColor"' },
  { p: /color="#EAE6DC"/g, r: 'color="currentColor"' },
  { p: /bg-primary text-primary-foreground\/80 backdrop-blur-md/g, r: 'bg-background/80 backdrop-blur-md' },
  { p: /bg-primary text-primary-foreground\/10/g, r: 'border-border' }
];

replacements.forEach(({p, r}) => {
  content = content.replace(p, r);
});

// Externalize FR texts
content = content.replace(/>Se connecter</g, ">{t('login')}<");
content = content.replace(/Cohorte {currentCohort.toUpperCase\(\)}/g, "{t('cohort', { name: currentCohort.toUpperCase() })}");
content = content.replace(/\s*\/ mois/g, " {t('perMonth')}");
content = content.replace(/Facturé {.*} € tous les 6 mois/g, "{t('billedSemiannually', { amount: COHORT_CONFIG[currentCohort].prices.semi_annual?.amount ? (COHORT_CONFIG[currentCohort].prices.semi_annual.amount / 100).toFixed(0) : 0 })}");
content = content.replace(/© 2026 Helmdash · Fait par un solo founder./g, "{t('footerCopyright')}");
content = content.replace(/>Confidentialité</g, ">{t('privacy')}<");
content = content.replace(/>CGU</g, ">{t('terms')}<");

fs.writeFileSync(file, content);
console.log('Replaced colors and strings.');
