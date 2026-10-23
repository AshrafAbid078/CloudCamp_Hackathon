import { chromium } from 'playwright-core';

async function main() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await page.goto(`${baseUrl}/dashboard`);
    await page.waitForURL('**/login');
    console.log('Anonymous dashboard access redirects to login: PASS');

    const inputs = page.locator('form input');
    await inputs.nth(0).fill('review_invalid_user');
    await inputs.nth(1).fill('wrong_password');
    await page.getByRole('button', { name: 'Sign in ->' }).click();
    await page.getByText('Sign in failed.', { exact: false }).waitFor();
    if (!page.url().endsWith('/login')) throw new Error('Invalid login left the login page');
    console.log('Invalid login remains unauthenticated: PASS');

    await page.goto(`${baseUrl}/dispatch`);
    await page.waitForURL('**/login');
    console.log('Anonymous dispatch access redirects to login: PASS');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
