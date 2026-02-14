import { test, expect } from '@playwright/test';

test.describe('理想スケジュール管理', () => {
  test('理想スケジュールページが表示される', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.getByText(/理想の1日/)).toBeVisible();
  });

  test('新しい時間ブロックを追加できる', async ({ page }) => {
    await page.goto('/schedule');
    await page.getByRole('button', { name: /ブロック追加/ }).click();
    await page.getByLabel(/タイトル/).fill('朝の運動');
    await page.getByLabel(/開始/).fill('06:00');
    await page.getByLabel(/終了/).fill('07:00');
    await page.getByRole('button', { name: /保存/ }).click();
    await expect(page.getByText('朝の運動')).toBeVisible();
  });

  test('時間ブロックを編集できる', async ({ page }) => {
    await page.goto('/schedule');
    await page.getByText('朝の運動').click();
    await page.getByLabel(/タイトル/).clear();
    await page.getByLabel(/タイトル/).fill('モーニングジョギング');
    await page.getByRole('button', { name: /保存/ }).click();
    await expect(page.getByText('モーニングジョギング')).toBeVisible();
  });

  test('時間ブロックを削除できる', async ({ page }) => {
    await page.goto('/schedule');
    const block = page.getByText('モーニングジョギング');
    await block.hover();
    await page.getByRole('button', { name: /削除/ }).first().click();
    await expect(block).not.toBeVisible();
  });
});
