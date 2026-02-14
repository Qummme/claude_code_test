import { test, expect } from '@playwright/test';

// NOTE: These tests assume authenticated state.
// In a real setup, use Firebase Auth emulator + Playwright storageState for auth.
// For now, these serve as test specifications.

test.describe('ダッシュボード', () => {
  test.describe('ヘッダー・ナビゲーション', () => {
    test('選択中の日付が表示される', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await expect(page.getByText(/2026年2月14日/)).toBeVisible();
    });

    test('前日・翌日ボタンで日付を切り替えられる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('button', { name: /前日/ }).click();
      await expect(page).toHaveURL('/dashboard/2026-02-13');
    });

    test('カレンダーボタンでカレンダーモーダルが開く', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('button', { name: /カレンダー/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('下部ナビゲーションが表示される', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('link', { name: /ダッシュボード/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /目標/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /スケジュール/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /設定/ })).toBeVisible();
    });
  });

  test.describe('タスクタブ', () => {
    test('タスクタブが選択できる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /タスク/ }).click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    });

    test('新しいタスクを追加できる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /タスク/ }).click();
      await page.getByPlaceholder(/タスクを追加/).fill('テストタスク');
      await page.keyboard.press('Enter');
      await expect(page.getByText('テストタスク')).toBeVisible();
    });

    test('タスクを完了に切り替えられる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /タスク/ }).click();
      // タスクが存在する前提
      const checkbox = page.getByRole('checkbox').first();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    });

    test('タスクを削除できる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /タスク/ }).click();
      const taskText = page.getByText('テストタスク');
      await taskText.hover();
      await page.getByRole('button', { name: /削除/ }).first().click();
      await expect(taskText).not.toBeVisible();
    });
  });

  test.describe('習慣タブ', () => {
    test('習慣一覧が表示される', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /習慣/ }).click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    });

    test('習慣のチェックを切り替えられる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /習慣/ }).click();
      const checkbox = page.getByRole('checkbox').first();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    });
  });

  test.describe('振り返りタブ', () => {
    test('振り返りタブで箇条書き項目を追加できる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /振り返り/ }).click();
      await page.getByPlaceholder(/項目を追加/).fill('今日は集中できた');
      await page.keyboard.press('Enter');
      await expect(page.getByText('今日は集中できた')).toBeVisible();
    });

    test('気分を選択できる', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /振り返り/ }).click();
      await page.getByRole('button', { name: /😊/ }).click();
      await expect(page.getByRole('button', { name: /😊/ })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('スケジュールタブ', () => {
    test('スケジュールタブが表示される', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /スケジュール/ }).click();
      await expect(page.getByRole('tabpanel')).toBeVisible();
    });

    test('テンプレートからコピーボタンが表示される', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await page.getByRole('tab', { name: /スケジュール/ }).click();
      await expect(page.getByRole('button', { name: /テンプレートからコピー/ })).toBeVisible();
    });
  });

  test.describe('マイルストーンサマリー', () => {
    test('進行中のマイルストーンが表示される', async ({ page }) => {
      await page.goto('/dashboard/2026-02-14');
      await expect(page.getByText(/進行中のマイルストーン/)).toBeVisible();
    });
  });
});
