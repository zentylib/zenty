import { expect, test, type Page } from '@playwright/test';

const text = (page: Page, id: string) => page.getByTestId(id);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('users: custom idKey with string ids', () => {
  test('add, reject duplicates, update, report missing ids, deleteMany', async ({ page }) => {
    await expect(text(page, 'users-loaded')).toHaveText('loaded: false');

    await page.getByTestId('user-add-id').fill('milo');
    await page.getByTestId('user-add-name').fill('Milo');
    await page.getByTestId('user-add-submit').click();
    await expect(text(page, 'user-milo-text')).toHaveText('milo: Milo (member)');
    await expect(text(page, 'users-loaded')).toHaveText('loaded: true');

    await page.getByTestId('user-add-submit').click();
    await expect(text(page, 'users-error')).toHaveText('error: Item with userId=milo already exists.');

    await page.getByTestId('user-add-team').click();
    await expect(text(page, 'user-ana-text')).toHaveText('ana: Ana (member)');
    await page.getByTestId('user-add-team').click();
    await expect(text(page, 'users-error')).toHaveText('error: Items with userId=ana, ben already exist.');

    await page.getByTestId('user-update-missing').click();
    await expect(text(page, 'users-error')).toHaveText('error: Item with userId=ghost was not found.');

    await page.getByTestId('user-milo-promote').click();
    await expect(text(page, 'user-milo-text')).toHaveText('milo: Milo (admin)');
    await expect(text(page, 'users-error')).toHaveText('error: none');

    await page.getByTestId('user-remove-team').click();
    await expect(page.getByTestId('user-ana')).toHaveCount(0);
    await expect(page.getByTestId('user-ben')).toHaveCount(0);
  });

  test('reusable typed middleware persists users to sessionStorage', async ({ page }) => {
    await page.getByTestId('user-add-id').fill('zoe');
    await page.getByTestId('user-add-name').fill('Zoe');
    await page.getByTestId('user-add-role').selectOption('admin');
    await page.getByTestId('user-add-submit').click();
    await page.reload();
    await expect(text(page, 'user-zoe-text')).toHaveText('zoe: Zoe (admin)');
  });
});

test.describe('todos: action overrides', () => {
  test('normalise, validate and guard through overrides', async ({ page }) => {
    await page.getByTestId('todo-title').fill('   Buy milk   ');
    await page.getByTestId('todo-add').click();
    await expect(text(page, 'todo-Buy milk-text')).toHaveText('Buy milk');
    await expect(text(page, 'todos-loaded')).toHaveText('loaded: true');

    await page.getByTestId('todo-add').click(); // empty title
    await expect(text(page, 'todos-error')).toHaveText('error: A todo needs a title.');

    await page.getByTestId('todo-title').fill('BUY MILK');
    await page.getByTestId('todo-add').click();
    await expect(text(page, 'todos-error')).toHaveText('error: "BUY MILK" is already on the list.');

    await page.getByTestId('todo-Buy milk-pin').click();
    await expect(text(page, 'todo-Buy milk-text')).toHaveText('📌 Buy milk');
    await page.getByTestId('todo-Buy milk-delete').click();
    await expect(text(page, 'todos-error')).toHaveText('error: Unpin it before deleting.');
    await expect(page.getByTestId('todo-Buy milk')).toBeVisible();

    await page.getByTestId('todo-Buy milk-pin').click();
    await page.getByTestId('todo-Buy milk-delete').click();
    await expect(page.getByTestId('todo-Buy milk')).toHaveCount(0);
    await expect(text(page, 'todos-error')).toHaveText('error: none');
  });
});

test.describe('settings: deepMerge', () => {
  test('nested updates keep siblings, Dates survive, arrays are replaced', async ({ page }) => {
    await page.getByTestId('settings-toggle-theme').click();
    await page.getByTestId('settings-german').click();
    await expect(text(page, 'settings-theme')).toHaveText('dark');
    await expect(text(page, 'settings-language')).toHaveText('de');

    await page.getByTestId('settings-toggle-push').click();
    await expect(text(page, 'settings-push')).toHaveText('true');
    await expect(text(page, 'settings-email')).toHaveText('true');

    await expect(text(page, 'settings-saved-at')).toHaveText('Date 2025-01-01T00:00:00.000Z');
    await page.getByTestId('settings-save').click();
    await expect(text(page, 'settings-saved-at')).toHaveText('Date 2026-06-15T12:00:00.000Z');
    await expect(text(page, 'settings-saves')).toHaveText('1');

    await page.getByTestId('settings-replace-recent').click();
    await expect(text(page, 'settings-recent')).toHaveText('settings');

    // A nested selector drives the whole app's theme.
    await expect(page.getByTestId('app')).toHaveAttribute('data-theme', 'dark');
  });

  test('update on a cleared store reports an error, set recovers', async ({ page }) => {
    await page.getByTestId('settings-clear').click();
    await expect(text(page, 'settings-empty')).toBeVisible();
    await expect(text(page, 'settings-loaded')).toHaveText('loaded: false');

    await page.getByTestId('settings-update-empty').click();
    await expect(text(page, 'settings-error')).toHaveText(
      'error: Cannot update: no entity is set. Call set() first.',
    );

    await page.getByTestId('settings-reset').click();
    await expect(text(page, 'settings-error')).toHaveText('error: none');
    await expect(text(page, 'settings-loaded')).toHaveText('loaded: true');
    await expect(text(page, 'settings-theme')).toHaveText('light');
  });
});

test.describe('profile: shallow updates, starts empty', () => {
  test('update before set, async set, shallow replace, error, clear', async ({ page }) => {
    await expect(text(page, 'profile-value')).toHaveText('no profile');
    await expect(text(page, 'profile-loaded')).toHaveText('loaded: false');

    await page.getByTestId('profile-update').click();
    await expect(text(page, 'profile-error')).toHaveText(
      'error: Cannot update: no entity is set. Call set() first.',
    );

    await page.getByTestId('profile-load').click();
    await expect(text(page, 'profile-loading')).toHaveText('loading: true');
    await expect(text(page, 'profile-loading')).toHaveText('loading: false');
    await expect(text(page, 'profile-value')).toHaveText(
      '{"name":"Alice","address":{"city":"Berlin","zip":"10115"}}',
    );
    await expect(text(page, 'profile-error')).toHaveText('error: none');

    await page.getByTestId('profile-update').click();
    await page.getByTestId('profile-move').click();
    // Without deepMerge, `address` is replaced as a whole: `zip` is gone.
    await expect(text(page, 'profile-value')).toHaveText('{"name":"Bob","address":{"city":"Munich"}}');

    await page.getByTestId('profile-fail').click();
    await expect(text(page, 'profile-error')).toHaveText('error: Profile service down');

    await page.getByTestId('profile-clear').click();
    await expect(text(page, 'profile-value')).toHaveText('no profile');
    await expect(text(page, 'profile-loaded')).toHaveText('loaded: false');
    await expect(text(page, 'profile-error')).toHaveText('error: none');
  });
});

test('no console errors or warnings while using the app', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(err.message));

  await page.goto('/');
  await page.getByTestId('add-many').click();
  await page.getByTestId('reload').click();
  await expect(text(page, 'products-count')).toHaveText('count: 3');
  await page.getByTestId('settings-save').click();
  await page.getByTestId('profile-load').click();
  await expect(text(page, 'profile-loaded')).toHaveText('loaded: true');

  expect(problems).toEqual([]);
});
