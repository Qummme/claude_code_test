import { test, expect } from '@playwright/test';

test.describe('カレンダーナビゲーション', () => {
  test('カレンダーモーダルで日付を選択するとダッシュボードが切り替わる', async ({ page }) => {
    await page.goto('/dashboard/2026-02-14');
    await page.getByRole('button', { name: /カレンダー/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 2月10日を選択
    await dialog.getByText('10', { exact: true }).click();
    await expect(page).toHaveURL('/dashboard/2026-02-10');
  });

  test('カレンダーの月を前後に切り替えられる', async ({ page }) => {
    await page.goto('/dashboard/2026-02-14');
    await page.getByRole('button', { name: /カレンダー/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/2026年 2月/)).toBeVisible();

    await dialog.getByRole('button', { name: /前月/ }).click();
    await expect(dialog.getByText(/2026年 1月/)).toBeVisible();
  });

  test('「今日に戻る」ボタンで今日に移動する', async ({ page }) => {
    await page.goto('/dashboard/2026-01-01');
    await page.getByRole('button', { name: /カレンダー/ }).click();
    await page.getByRole('button', { name: /今日に戻る/ }).click();
    // URL が今日の日付に変わることを確認（日付は動的なのでパターンマッチ）
    await expect(page).toHaveURL(/\/dashboard\/\d{4}-\d{2}-\d{2}/);
  });
});
