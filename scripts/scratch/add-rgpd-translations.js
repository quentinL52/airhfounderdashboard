const fs = require('fs');
const path = require('path');

const frFile = path.join(process.cwd(), 'messages/fr.json');
const enFile = path.join(process.cwd(), 'messages/en.json');

const frData = JSON.parse(fs.readFileSync(frFile, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

frData.settings.dataPrivacy = "Données & Confidentialité";
frData.settings.dataPrivacyDesc = "Gérez vos données personnelles. L'export génère un fichier JSON avec l'ensemble de votre historique. La suppression est définitive.";
frData.settings.exportData = "Exporter mes données";
frData.settings.deleteAccount = "Supprimer mon compte";
frData.settings.deleteAccountConfirmTitle = "Êtes-vous absolument sûr ?";
frData.settings.deleteAccountConfirmDesc = "Cette action est irréversible. Elle supprimera définitivement votre compte, vos hypothèses, vos données financières et résiliera votre abonnement en cours.";
frData.settings.exportSuccess = "Vos données ont été exportées.";
frData.settings.deleteSuccess = "Votre compte a été supprimé.";

enData.settings.dataPrivacy = "Data & Privacy";
enData.settings.dataPrivacyDesc = "Manage your personal data. Exporting generates a JSON file with all your history. Deletion is permanent.";
enData.settings.exportData = "Export my data";
enData.settings.deleteAccount = "Delete my account";
enData.settings.deleteAccountConfirmTitle = "Are you absolutely sure?";
enData.settings.deleteAccountConfirmDesc = "This action cannot be undone. This will permanently delete your account, your hypotheses, your financial data and cancel your active subscription.";
enData.settings.exportSuccess = "Your data has been exported.";
enData.settings.deleteSuccess = "Your account has been deleted.";

fs.writeFileSync(frFile, JSON.stringify(frData, null, 2));
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
