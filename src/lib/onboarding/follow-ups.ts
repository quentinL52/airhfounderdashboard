export type FollowUpTrigger = {
  questionId: number;
  condition: (answer: string) => boolean;
  followUpQuestion: string;
};

export const followUpRules: FollowUpTrigger[] = [
  {
    questionId: 1, // L'idée
    condition: (answer: string) => answer.length < 20 && !/(app|plateforme|service|outil|logiciel|saas|dashboard|site)/i.test(answer),
    followUpQuestion: "C'est un peu vague. Est-ce que tu construis une application web, une app mobile, un service physique, ou autre chose ?"
  },
  {
    questionId: 3, // Cible
    condition: (answer: string) => /(tout le monde|tous les gens|les gens|everyone|n'importe qui|tous ceux)/i.test(answer),
    followUpQuestion: "'Tout le monde', c'est souvent personne au début. Si tu devais choisir une niche ultra-spécifique de 10 personnes pour commencer, qui seraient-elles ?"
  },
  {
    questionId: 3, // Cible
    condition: (answer: string) => answer.length < 15,
    followUpQuestion: "Sois plus précis. Quel est leur poste exact, leur industrie, ou le moment précis où ils ressentent ce problème ?"
  },
  {
    questionId: 4, // Risque
    condition: (answer: string) => /(aucun|rien|je ne sais pas|pas de risque|none|nothing)/i.test(answer),
    followUpQuestion: "Il y a toujours un risque (concurrence, technique, distribution, marché). Quel est le scénario le plus probable qui ferait que ce projet échoue dans 6 mois ?"
  },
  {
    questionId: 6, // Revenus
    condition: (answer: string) => /(gratuit|free|publicité|pubs|ads|plus tard)/i.test(answer),
    followUpQuestion: "La gratuité ou la pub est difficile à monétiser au début. As-tu envisagé de faire payer directement le service principal ? Si oui, à quel prix ?"
  }
];

export function getFollowUp(step: number, answer: string, currentSessionFollowUpsCount: number): string | null {
  // Limiter à 2 relances maximum par session d'onboarding
  if (currentSessionFollowUpsCount >= 2) return null;

  const rules = followUpRules.filter(r => r.questionId === step);
  
  for (const rule of rules) {
    if (rule.condition(answer)) {
      return rule.followUpQuestion;
    }
  }

  return null;
}
