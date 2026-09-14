import { test, expect } from '@playwright/test';

test.describe('Portfolio Camille Allard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section with profile picture and heading', async ({ page }) => {
    await expect(page).toHaveTitle(/Allard Camille/i);

    // Verify main heading and profile picture presence
    const heroSection = page.locator('section#about');
    await expect(heroSection).toBeVisible();
    await expect(heroSection.locator('h1')).toContainText('Développeuse Full-stack');
    await expect(heroSection.locator('#profile-picture')).toBeVisible();

    // Verify contact CTA button link
    const contactCta = heroSection.locator('a[href="#contact"]');
    await expect(contactCta).toBeVisible();
  });

  test('should fill out and validate the contact form fields', async ({ page }) => {
    const contactSection = page.locator('section#contact');
    await expect(contactSection).toBeVisible();

    // Targeted selectors using exact HTML IDs
    const nameInput = contactSection.locator('#user_name');
    const emailInput = contactSection.locator('#user_email');
    const messageInput = contactSection.locator('#message');
    const submitButton = contactSection.locator('button[type="submit"]');

    // Fill form fields
    await nameInput.fill('Jean Dupont');
    await emailInput.fill('jean.dupont@exemple.com');
    await messageInput.fill('Bonjour, je souhaite vous contacter pour un projet.');

    // Assert input values
    await expect(nameInput).toHaveValue('Jean Dupont');
    await expect(emailInput).toHaveValue('jean.dupont@exemple.com');
    await expect(messageInput).toHaveValue('Bonjour, je souhaite vous contacter pour un projet.');
    await expect(submitButton).toBeEnabled();
  });

  test('should handle responsive sidebar visibility', async ({ page }) => {
    // Desktop viewport: sidebars are visible
    await page.setViewportSize({ width: 1280, height: 900 });
    const sidebars = page.locator('app-sidebars');
    await expect(sidebars).toBeVisible();

    // Tablet/Mobile viewport (<= 1024px): sidebars should be hidden by media query
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(sidebars).toBeHidden();
  });

});