const fs = require('fs');
const path = require('path');

const frFile = path.join(process.cwd(), 'messages/fr.json');
const enFile = path.join(process.cwd(), 'messages/en.json');

const frData = JSON.parse(fs.readFileSync(frFile, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

const newLandingFr = {
  heroTitle: "Six outils ouverts.\\nZéro vue d'ensemble.\\nUne seule barre à tenir.",
  heroSubtitle: "Helmdash réunit tes finances, tes hypothèses, ta roadmap et ta veille dans un seul poste de pilotage — piloté par un agent qui lit et écrit directement dans tes données. Fini le copier-coller.",
  heroBadge: "Cohorte #{cohort} · {seats} places restantes · démarrage {date}",
  ctaPrimary: "Prendre la barre →",
  ctaSecondary: "Voir le produit",
  noCreditCard: "Pas de carte bancaire · Import Notion & CSV en 2 min",
  socialProof: "Ils ont arrêté de jongler",
  problemSurtitle: "01 / LE PROBLÈME",
  problemTitle: "Tu ne diriges pas ton business. Tu cours après lui.",
  problemSubtitle: "Coder seul à minuit, c'est déjà assez dur. Le vrai coût, c'est le temps perdu à recoller les morceaux éparpillés.",
  pains: [
    { tag: "01", title: "Le contexte s'évapore", body: "Ta décision d'hier est dans un doc Notion, le chiffre qui la justifie dans un tableur. Reconstituer prend 20 min." },
    { tag: "02", title: "Tu décides à l'aveugle", body: "« Est-ce qu'on peut se le permettre ? » demande d'ouvrir trois fichiers. Alors souvent, tu tranches au feeling." },
    { tag: "03", title: "Personne ne suit", body: "La veille, le suivi des hypothèses, le CRM : tout ça n'avance que quand tu t'en occupes." },
    { tag: "04", title: "L'IA est hors sol", body: "ChatGPT te répond bien — mais à froid. Il n'a ni tes chiffres, ni ton historique." }
  ],
  productSurtitle: "02 / LA SOLUTION",
  productTitle: "Un poste de pilotage. Un agent qui a les mains dans le cambouis.",
  productSubtitle: "L'agent central lit tes chiffres, met à jour tes hypothèses, délègue — et te rend une décision, pas un pavé de texte.",
  productFeatures: [
    { title: "Il écrit, pas seulement lit", body: "L'agent met à jour directement dans tes données, avec ton accord." },
    { title: "Des sous-agents spécialisés", body: "Recherche, finance, growth : l'agent central orchestre et te rend une synthèse." },
    { title: "La mémoire de ton bateau", body: "Chaque décision garde son contexte. Tu ne repars jamais de zéro." }
  ],
  transparencySurtitle: "03 / TRANSPARENCE",
  transparencyTitle: "Ce que Helmdash N'EST PAS.",
  transparencySubtitle: "On ne promet pas la lune. Voici nos limites actuelles.",
  transparencyItems: [
    { title: "Pas d'export de compte (pour l'instant)", body: "Le RGPD arrive. On bosse sur l'export/suppression en un clic (P0)." },
    { title: "Pas une IA magique", body: "Les sous-agents ont besoin de données claires pour bien travailler." },
    { title: "Uniquement pour Solo Founders", body: "Pas pensé pour les grandes équipes." }
  ],
  pricingSurtitle: "04 / PRICING",
  pricingTitle: "Un prix. Écrit noir sur blanc.",
  pricingSubtitle: "Rejoins la cohorte. Prix fixe à vie.",
  pricingMonth: "Mensuel",
  pricingYear: "Annuel −20%",
  pricingCtaPrimary: "Rejoindre la cohorte",
  pricingCtaSecondary: "Nous contacter",
  roadmapSurtitle: "05 / ROADMAP",
  roadmapTitle: "Les 5 prochains chantiers",
  roadmapSubtitle: "On s'y tient. Rien de plus.",
  roadmapItems: [
    { title: "Export et suppression de compte RGPD", status: "En cours" },
    { title: "Intégration Stripe approfondie", status: "Prévu" },
    { title: "Sous-agent Marketing & SEO", status: "Prévu" },
    { title: "Webhook personnalisés (Zapier/Make)", status: "Prévu" },
    { title: "Génération de pitch deck automatisé", status: "Prévu" }
  ],
  makerSurtitle: "06 / MAKER NOTE",
  makerTitle: "Fait par un Solo Founder.",
  makerBody: "J'ai construit Helmdash parce que je devenais fou à ouvrir 15 onglets pour savoir si ma startup allait dans le mur.",
  faqSurtitle: "07 / FAQ",
  faqTitle: "Questions fréquentes",
  faqItems: [
    { q: "Qu'est-ce qu'une cohorte ?", a: "Un groupe d'early-adopters avec un prix bloqué à vie." },
    { q: "Où vont mes données ?", a: "Elles sont chiffrées et ne servent pas à entraîner les modèles globaux." }
  ]
};

const newLandingEn = {
  heroTitle: "Six open tools.\\nZero overview.\\nOne helm to steer.",
  heroSubtitle: "Helmdash gathers your finances, hypotheses, roadmap and watch in a single cockpit — steered by an agent that reads and writes directly to your data. No more copy-pasting.",
  heroBadge: "Cohort #{cohort} · {seats} spots left · starts {date}",
  ctaPrimary: "Take the Helm →",
  ctaSecondary: "View product",
  noCreditCard: "No credit card · Notion & CSV import in 2 mins",
  socialProof: "They stopped juggling",
  problemSurtitle: "01 / THE PROBLEM",
  problemTitle: "You're not running your business. You're chasing it.",
  problemSubtitle: "Coding alone at midnight is hard enough. The real cost is the time lost piecing together scattered info.",
  pains: [
    { tag: "01", title: "Context evaporates", body: "Yesterday's decision is in Notion, the justifying metric in a sheet. Reconstructing takes 20 mins." },
    { tag: "02", title: "Flying blind", body: "« Can we afford this? » means opening three files. So you just guess." },
    { tag: "03", title: "No one follows up", body: "Competitive watch, hypothesis tracking, CRM: nothing moves unless you do it." },
    { tag: "04", title: "AI is disconnected", body: "ChatGPT answers well — but cold. It has no data, no history." }
  ],
  productSurtitle: "02 / THE SOLUTION",
  productTitle: "A cockpit. An agent with its hands dirty.",
  productSubtitle: "The central agent reads metrics, updates hypotheses, delegates — and gives you a decision, not a wall of text.",
  productFeatures: [
    { title: "It writes, doesn't just read", body: "The agent updates directly in your data, with your approval." },
    { title: "Specialized sub-agents", body: "Research, finance, growth: the central agent orchestrates and synthesizes." },
    { title: "The memory of your ship", body: "Every decision keeps its context. You never start from scratch." }
  ],
  transparencySurtitle: "03 / TRANSPARENCY",
  transparencyTitle: "What Helmdash IS NOT.",
  transparencySubtitle: "We don't promise the moon. Here are our current limits.",
  transparencyItems: [
    { title: "No account export (yet)", body: "GDPR is coming. We're working on 1-click export/deletion (P0)." },
    { title: "Not magic AI", body: "Sub-agents need clear data to work well." },
    { title: "Solo Founders Only", body: "Not designed for large teams." }
  ],
  pricingSurtitle: "04 / PRICING",
  pricingTitle: "One price. In black and white.",
  pricingSubtitle: "Join the cohort. Lifetime fixed price.",
  pricingMonth: "Monthly",
  pricingYear: "Yearly −20%",
  pricingCtaPrimary: "Join the cohort",
  pricingCtaSecondary: "Contact us",
  roadmapSurtitle: "05 / ROADMAP",
  roadmapTitle: "The next 5 milestones",
  roadmapSubtitle: "We stick to this. Nothing more.",
  roadmapItems: [
    { title: "GDPR export and deletion", status: "In progress" },
    { title: "Deep Stripe integration", status: "Planned" },
    { title: "Marketing & SEO sub-agent", status: "Planned" },
    { title: "Custom webhooks (Zapier/Make)", status: "Planned" },
    { title: "Automated pitch deck generation", status: "Planned" }
  ],
  makerSurtitle: "06 / MAKER NOTE",
  makerTitle: "Built by a Solo Founder.",
  makerBody: "I built Helmdash because I was going crazy opening 15 tabs just to know if my startup was hitting a wall.",
  faqSurtitle: "07 / FAQ",
  faqTitle: "Frequently Asked Questions",
  faqItems: [
    { q: "What is a cohort?", a: "A group of early-adopters with a lifetime locked price." },
    { q: "Where does my data go?", a: "It's encrypted and not used to train global models." }
  ]
};

frData.landing = newLandingFr;
enData.landing = newLandingEn;

fs.writeFileSync(frFile, JSON.stringify(frData, null, 2));
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2));
