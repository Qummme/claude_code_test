import { test, expect } from '@playwright/test';

test.describe('認証機能', () => {
  test('未認証ユーザーはログインページにリダイレクトされる', async ({ page }) => {
    await page.goto('/dashboard/2026-02-14');
    await expect(page).toHaveURL('/login');
  });

  test('ログインページにGoogleログインボタンが表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
  });

  test('ログインページにアプリ名が表示される', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('自己管理アプリ')).toBeVisible();
  });
});
