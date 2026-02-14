import { test, expect } from '@playwright/test';

test.describe('目標・マイルストーン管理', () => {
  test('目標一覧ページが表示される', async ({ page }) => {
    await page.goto('/goals');
    await expect(page.getByText(/年間目標/)).toBeVisible();
  });

  test('新しい目標を追加できる', async ({ page }) => {
    await page.goto('/goals');
    await page.getByRole('button', { name: /追加/ }).click();
    await page.getByLabel(/タイトル/).fill('JLPT N1 合格');
    await page.getByLabel(/カテゴリ/).fill('学習');
    await page.getByRole('button', { name: /保存/ }).click();
    await expect(page.getByText('JLPT N1 合格')).toBeVisible();
  });

  test('目標にマイルストーンを追加できる', async ({ page }) => {
    await page.goto('/goals');
    await page.getByText('JLPT N1 合格').click();
    await page.getByRole('button', { name: /マイルストーン追加/ }).click();
    await page.getByLabel(/タイトル/).fill('テキスト1-5章完了');
    await page.getByLabel(/期限/).fill('2026-03-31');
    await page.getByRole('button', { name: /保存/ }).click();
    await expect(page.getByText('テキスト1-5章完了')).toBeVisible();
  });

  test('マイルストーンのステータスを変更できる', async ({ page }) => {
    await page.goto('/goals');
    await page.getByText('JLPT N1 合格').click();
    const milestone = page.getByText('テキスト1-5章完了');
    await milestone.locator('..').getByRole('checkbox').check();
    await expect(milestone.locator('..').getByRole('checkbox')).toBeChecked();
  });

  test('目標の進捗率が表示される', async ({ page }) => {
    await page.goto('/goals');
    // プログレスバーが存在する
    await expect(page.getByRole('progressbar').first()).toBeVisible();
  });
});
