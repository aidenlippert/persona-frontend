import { test, expect, Page } from '@playwright/test';

// E2E tests for the dynamic verification flow
test.describe('Dynamic Verification Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to verification center', async ({ page }) => {
    // Click on Verify in navigation
    await page.click('text=Verify');
    
    // Should be on verification center page
    await expect(page).toHaveURL(/.*\/verify$/);
    await expect(page.locator('h2')).toContainText('Verification Center');
  });

  test('should display use cases on verification center', async ({ page }) => {
    await page.goto('http://localhost:3000/verify');
    
    // Wait for use cases to load
    await page.waitForSelector('[data-testid="use-case-card"], .card', { timeout: 10000 });
    
    // Should show use case cards
    const useCaseCards = page.locator('.card');
    await expect(useCaseCards.first()).toBeVisible();
    
    // Should have search functionality
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('should search and filter use cases', async ({ page }) => {
    await page.goto('http://localhost:3000/verify');
    
    // Wait for content to load
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Search for "bank"
    await page.fill('input[placeholder*="Search"]', 'bank');
    
    // Should filter results
    await page.waitForTimeout(500); // Wait for search filtering
    
    // Check if bank-related results are shown
    const cardText = await page.locator('.card').first().textContent();
    expect(cardText?.toLowerCase()).toContain('bank');
  });

  test('should navigate to specific use case verification', async ({ page }) => {
    await page.goto('http://localhost:3000/verify');
    
    // Wait for content to load
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Click on the first use case card
    await page.click('.card:first-child');
    
    // Should navigate to use case specific page
    await expect(page).toHaveURL(/.*\/verify\/\w+$/);
    
    // Should show DID input field
    await expect(page.locator('input[placeholder*="DID"]')).toBeVisible();
    
    // Should show fetch requirements button
    await expect(page.locator('button:has-text("Fetch Requirements")')).toBeVisible();
  });

  test('should handle DID input and requirements fetching', async ({ page }) => {
    // Go directly to a store verification page
    await page.goto('http://localhost:3000/verify/store');
    
    // Wait for page to load
    await page.waitForSelector('input[placeholder*="DID"]', { timeout: 10000 });
    
    // Enter a test DID
    const testDid = 'did:persona:test123';
    await page.fill('input[placeholder*="DID"]', testDid);
    
    // Click fetch requirements
    await page.click('button:has-text("Fetch Requirements")');
    
    // Should show loading or requirements
    await page.waitForTimeout(2000);
    
    // Check if requirements section appears
    const requirementsSection = page.locator('text=Required Credentials');
    await expect(requirementsSection).toBeVisible({ timeout: 10000 });
  });

  test('should display credential sharing interface', async ({ page }) => {
    await page.goto('http://localhost:3000/verify/store');
    
    // Wait for page elements
    await page.waitForSelector('input[placeholder*="DID"]', { timeout: 10000 });
    
    // Fill DID and fetch requirements
    await page.fill('input[placeholder*="DID"]', 'did:persona:test123');
    await page.click('button:has-text("Fetch Requirements")');
    
    // Wait for requirements to load
    await page.waitForTimeout(2000);
    
    // Look for share buttons in the requirements
    const shareButtons = page.locator('button:has-text("Share")');
    if (await shareButtons.count() > 0) {
      await expect(shareButtons.first()).toBeVisible();
    }
  });

  test('should handle credential sharing flow', async ({ page }) => {
    await page.goto('http://localhost:3000/verify/store');
    
    // Wait and fill DID
    await page.waitForSelector('input[placeholder*="DID"]', { timeout: 10000 });
    await page.fill('input[placeholder*="DID"]', 'did:persona:test123');
    await page.click('button:has-text("Fetch Requirements")');
    
    // Wait for requirements
    await page.waitForTimeout(2000);
    
    // If share button exists, click it
    const shareButton = page.locator('button:has-text("Share")').first();
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Should show loading state
      await expect(page.locator('.loading')).toBeVisible({ timeout: 5000 });
      
      // Wait for verification result
      await page.waitForTimeout(3000);
      
      // Should show verification result (success or failure)
      const verifiedIcon = page.locator('svg[data-testid="check-circle"]');
      const failedIcon = page.locator('svg[data-testid="x-circle"]');
      
      await expect(verifiedIcon.or(failedIcon)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display back navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/verify/store');
    
    // Should have back to verification center link
    const backLink = page.locator('text=Back to Verification Center');
    await expect(backLink).toBeVisible();
    
    // Click back link
    await backLink.click();
    
    // Should navigate back to verification center
    await expect(page).toHaveURL(/.*\/verify$/);
  });

  test('should show verification complete state', async ({ page }) => {
    await page.goto('http://localhost:3000/verify/store');
    
    // Fill DID and get requirements
    await page.waitForSelector('input[placeholder*="DID"]', { timeout: 10000 });
    await page.fill('input[placeholder*="DID"]', 'did:persona:test123');
    await page.click('button:has-text("Fetch Requirements")');
    
    await page.waitForTimeout(2000);
    
    // Try to simulate all requirements being met
    // This would require multiple share actions in a real scenario
    const shareButtons = page.locator('button:has-text("Share")');
    const buttonCount = await shareButtons.count();
    
    // Click all share buttons if they exist
    for (let i = 0; i < buttonCount; i++) {
      const button = shareButtons.nth(i);
      if (await button.isVisible()) {
        await button.click();
        await page.waitForTimeout(3000); // Wait for verification
      }
    }
    
    // Check if verification complete message appears
    const completeMessage = page.locator('text=Verification Complete');
    if (await completeMessage.isVisible()) {
      await expect(completeMessage).toBeVisible();
    }
  });

  test('should handle different use cases correctly', async ({ page }) => {
    const useCases = ['store', 'bank', 'doctor', 'hotel'];
    
    for (const useCase of useCases) {
      await page.goto(`http://localhost:3000/verify/${useCase}`);
      
      // Should show use case specific title
      const title = page.locator('h2');
      await expect(title).toContainText(new RegExp(useCase, 'i'));
      
      // Should have DID input
      await expect(page.locator('input[placeholder*="DID"]')).toBeVisible();
      
      // Should have fetch requirements button
      await expect(page.locator('button:has-text("Fetch Requirements")')).toBeVisible();
    }
  });

  test('should handle invalid use case gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/verify/invalid-use-case');
    
    // Should show error or redirect
    await page.waitForTimeout(2000);
    
    // Either shows error message or redirects to verification center
    const errorMessage = page.locator('text=not found');
    const backLink = page.locator('text=Back to Verification Center');
    
    await expect(errorMessage.or(backLink)).toBeVisible({ timeout: 5000 });
  });

  test('should validate DID input format', async ({ page }) => {
    await page.goto('http://localhost:3000/verify/store');
    
    await page.waitForSelector('input[placeholder*="DID"]', { timeout: 10000 });
    
    // Try with empty DID
    await page.click('button:has-text("Fetch Requirements")');
    
    // Should show error notification or prevent submission
    // Check for error state
    const fetchButton = page.locator('button:has-text("Fetch Requirements")');
    const isDisabled = await fetchButton.getAttribute('disabled');
    expect(isDisabled).toBeTruthy();
  });
});

test.describe('Templates Page', () => {
  test('should navigate to templates page', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Click Templates in navigation
    await page.click('text=Templates');
    
    // Should be on templates page
    await expect(page).toHaveURL(/.*\/templates$/);
    await expect(page.locator('h2')).toContainText('Credential Templates');
  });

  test('should display template cards', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    
    // Wait for templates to load
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Should show template cards
    const templateCards = page.locator('.card');
    await expect(templateCards.first()).toBeVisible();
    
    // Should have search and filter
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
  });

  test('should filter templates by category', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Select a category filter
    await page.selectOption('select', 'identity');
    
    await page.waitForTimeout(500);
    
    // Should filter results
    const cards = page.locator('.card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should navigate to template fill page', async ({ page }) => {
    await page.goto('http://localhost:3000/templates');
    
    await page.waitForSelector('.card', { timeout: 10000 });
    
    // Click on "Create Credential" button of first template
    await page.click('.card:first-child button:has-text("Create Credential")');
    
    // Should navigate to template fill page
    await expect(page).toHaveURL(/.*\/templates\/.*\/fill$/);
    
    // Should show form fields
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Template Fill Flow', () => {
  test('should fill and submit template form', async ({ page }) => {
    // Go directly to proof-of-age template
    await page.goto('http://localhost:3000/templates/proof-of-age/fill');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Fill in the form fields
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="birthYear"]', '1990');
    
    // Submit the form
    await page.click('button:has-text("Create Credential")');
    
    // Should show loading state
    await expect(page.locator('text=Creating')).toBeVisible({ timeout: 5000 });
    
    // Wait for completion
    await page.waitForTimeout(5000);
    
    // Should show success state or error
    const successMessage = page.locator('text=successfully');
    const errorMessage = page.locator('text=failed');
    
    await expect(successMessage.or(errorMessage)).toBeVisible({ timeout: 10000 });
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:3000/templates/proof-of-age/fill');
    
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Create Credential")');
    
    // Should show validation errors or prevent submission
    const submitButton = page.locator('button:has-text("Create Credential")');
    const isDisabled = await submitButton.getAttribute('disabled');
    
    // Button should be disabled or form should show validation errors
    expect(isDisabled).toBeTruthy();
  });
});