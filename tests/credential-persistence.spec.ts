import { test, expect } from '@playwright/test';

test.describe('Credential Persistence', () => {
  test('should persist credentials when issuing and navigating', async ({ page }) => {
    // Start backend daemon first
    await test.step('Navigate to app', async () => {
      await page.goto('http://localhost:5174');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Connect wallet (simulate)', async () => {
      // Click connect wallet button
      await page.getByRole('button', { name: /connect wallet/i }).click();
      
      // Wait for wallet connection state
      await page.waitForSelector('[data-testid="wallet-connected"]', { timeout: 10000 });
    });

    await test.step('Create DID if needed', async () => {
      // Check if DID creation is needed
      const createDidButton = page.getByRole('button', { name: /create did/i });
      if (await createDidButton.isVisible()) {
        await createDidButton.click();
        await page.waitForSelector('[data-testid="did-created"]', { timeout: 10000 });
      }
    });

    await test.step('Navigate to Issue Credential', async () => {
      await page.getByRole('link', { name: /issue credential/i }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step('Fill credential form', async () => {
      // Fill in credential details
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="birthYear"]', '1990');
      await page.selectOption('select[name="credentialType"]', 'PersonalID');
    });

    await test.step('Issue credential', async () => {
      await page.getByRole('button', { name: /issue credential/i }).click();
      
      // Wait for success message
      await expect(page.getByText(/credential issued successfully/i)).toBeVisible({ timeout: 15000 });
    });

    await test.step('Navigate to Generate Proof', async () => {
      await page.getByRole('button', { name: /generate proof/i }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step('Verify credential appears in dropdown', async () => {
      // Check that the credential we just issued appears in the dropdown
      const credentialSelect = page.locator('select[id="credential"]');
      await expect(credentialSelect).toBeVisible();
      
      // Check that our credential is available
      const options = await credentialSelect.locator('option').allTextContents();
      const hasCredential = options.some(option => 
        option.includes('PersonalID') && option.includes('Test User')
      );
      expect(hasCredential).toBe(true);
    });

    await test.step('Verify redirect to dashboard', async () => {
      // After successful credential issue, should redirect to dashboard, not landing page
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test('should maintain credentials across page reloads', async ({ page }) => {
    // This test verifies persistence across browser sessions
    await test.step('Navigate to dashboard', async () => {
      await page.goto('http://localhost:5174/dashboard');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Check if credentials persist', async () => {
      // Look for credential count in dashboard
      const credentialCount = await page.locator('[data-testid="credential-count"]').textContent();
      console.log('Found credentials:', credentialCount);
      
      // Should not be "0" if credentials were previously issued
      expect(credentialCount).not.toBe('0');
    });
  });
});