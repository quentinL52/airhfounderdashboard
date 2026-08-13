const fs = require('fs');

const frFile = 'messages/fr.json';
const enFile = 'messages/en.json';

const frData = JSON.parse(fs.readFileSync(frFile, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

const frLanding = frData.landing || {};
const enLanding = enData.landing || {};

frLanding.login = "Se connecter";
frLanding.cohort = "Cohorte {name}";
frLanding.perMonth = "/ mois";
frLanding.billedSemiannually = "Facturé {amount} € tous les 6 mois";
frLanding.footerCopyright = "© 2026 Helmdash · Fait par un solo founder.";
frLanding.privacy = "Confidentialité";
frLanding.terms = "CGU";

enLanding.login = "Log in";
enLanding.cohort = "Cohort {name}";
enLanding.perMonth = "/ month";
enLanding.billedSemiannually = "Billed {amount} € every 6 months";
enLanding.footerCopyright = "© 2026 Helmdash · Built by a solo founder.";
enLanding.privacy = "Privacy";
enLanding.terms = "Terms";

frData.landing = frLanding;
enData.landing = enLanding;

fs.writeFileSync(frFile, JSON.stringify(frData, null, 2));
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
console.log('Translations added.');
