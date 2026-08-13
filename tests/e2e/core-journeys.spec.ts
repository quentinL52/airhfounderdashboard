import { test, expect } from '@playwright/test';

test.describe('Helmdash Core Journeys (12 Parcours)', () => {
  
  // 1. Visiteur : Landing Page & Waitlist
  test("Parcours 1 : Landing Page s'affiche correctement", async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=poste de pilotage').first()).toBeVisible();
    await expect(page.locator('button:has-text("Join the waitlist")').first()).toBeVisible();
  });

  // 2. Authentification
  test("Parcours 2 : Page de connexion s'affiche", async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('text=Se connecter')).toBeVisible();
  });

  // 3. Onboarding (protégé)
  test('Parcours 3 : Redirection Onboarding sans auth', async ({ page }) => {
    await page.goto('/onboarding');
    // On s'attend à être redirigé vers /auth
    await expect(page).toHaveURL(/.*\/auth/);
  });

  // 4. Command Center
  test('Parcours 4 : Dashboard inaccessible sans auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/auth/);
  });

  // Note: Les tests 5 à 12 nécessitent un compte utilisateur mocké ou une DB locale.
  // Pour le MVP, on s'assure que les routes existent et que la sécurité est en place.
  
  const protectedRoutes = [
    { id: 5, path: '/dashboard/agent', name: 'Interactions Agent' },
    { id: 6, path: '/dashboard/hypotheses', name: 'Vue Hypothèses' },
    { id: 7, path: '/dashboard/hypotheses/new', name: 'Nouvelle Hypothèse' },
    { id: 8, path: '/dashboard/finances', name: 'Vue Finances' },
    { id: 9, path: '/dashboard/crm', name: 'Vue CRM' },
    { id: 10, path: '/dashboard/roadmap', name: 'Vue Roadmap' },
    { id: 11, path: '/dashboard/decisions', name: 'Vue Décisions' },
    { id: 12, path: '/dashboard/decisions/new', name: 'Nouvelle Décision' },
  ];

  for (const route of protectedRoutes) {
    test(`Parcours ${route.id} : ${route.name} redirige vers Auth`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(/.*\/auth/);
    });
  }
});
