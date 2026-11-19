import { expect, test, type Page } from '@playwright/test';

const text = (page: Page, id: string) => page.getByTestId(id);

async function addProduct(page: Page, id: string, name: string, price: string) {
  await page.getByTestId('add-id').fill(id);
  await page.getByTestId('add-name').fill(name);
  await page.getByTestId('add-price').fill(price);
  await page.getByTestId('add-submit').click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('starts with the seed products and counts as loaded', async ({ page }) => {
  await expect(text(page, 'products-loaded')).toHaveText('loaded: true');
  await expect(text(page, 'products-loading')).toHaveText('loading: false');
  await expect(text(page, 'products-error')).toHaveText('error: none');
  await expect(text(page, 'products-count')).toHaveText('count: 2');
  await expect(text(page, 'products-total')).toHaveText('total: 2000');
});

test('add, and reject a duplicate id', async ({ page }) => {
  await addProduct(page, '3', 'Tablet', '500');
  await expect(text(page, 'product-3-text')).toHaveText('#3 Tablet – 500');
  await expect(text(page, 'products-count')).toHaveText('count: 3');

  await page.getByTestId('add-submit').click();
  await expect(text(page, 'products-error')).toHaveText('error: Item with id=3 already exists.');
  await expect(text(page, 'products-count')).toHaveText('count: 3');

  await page.getByTestId('products-clear-error').click();
  await expect(text(page, 'products-error')).toHaveText('error: none');
});

test('addMany adds a batch, and rejects a batch with an existing id as a whole', async ({ page }) => {
  await page.getByTestId('add-many').click();
  await expect(text(page, 'product-10-text')).toHaveText('#10 Mouse – 25');
  await expect(text(page, 'product-11-text')).toHaveText('#11 Keyboard – 75');

  await page.getByTestId('add-many-duplicate').click();
  await expect(text(page, 'products-error')).toHaveText('error: Items with id=1 already exist.');
  await expect(page.getByTestId('product-12')).toHaveCount(0);
  await expect(text(page, 'products-count')).toHaveText('count: 4');
});

test('update renames, blocks an id collision, and allows a free id', async ({ page }) => {
  await page.getByTestId('edit-id').fill('2');
  await page.getByTestId('edit-name').fill('Smartphone');
  await page.getByTestId('edit-submit').click();
  await expect(text(page, 'product-2-text')).toHaveText('#2 Smartphone – 800');

  await page.getByTestId('edit-name').fill('');
  await page.getByTestId('edit-new-id').fill('1');
  await page.getByTestId('edit-submit').click();
  await expect(text(page, 'products-error')).toHaveText(
    'error: Cannot change id=2 to 1: an item with that id already exists.',
  );
  await expect(page.getByTestId('product-2')).toBeVisible();

  await page.getByTestId('edit-new-id').fill('20');
  await page.getByTestId('edit-submit').click();
  await expect(text(page, 'product-20-text')).toHaveText('#20 Smartphone – 800');
  await expect(page.getByTestId('product-2')).toHaveCount(0);
  await expect(text(page, 'products-error')).toHaveText('error: none');
});

test('update and delete report a missing id', async ({ page }) => {
  await page.getByTestId('edit-id').fill('999');
  await page.getByTestId('edit-name').fill('Ghost');
  await page.getByTestId('edit-submit').click();
  await expect(text(page, 'products-error')).toHaveText('error: Item with id=999 was not found.');

  await page.getByTestId('delete-id').fill('998');
  await page.getByTestId('delete-submit').click();
  await expect(text(page, 'products-error')).toHaveText('error: Item with id=998 was not found.');
  await expect(text(page, 'products-count')).toHaveText('count: 2');
});

test('delete by id and from the row', async ({ page }) => {
  await page.getByTestId('delete-id').fill('1');
  await page.getByTestId('delete-submit').click();
  await expect(page.getByTestId('product-1')).toHaveCount(0);

  await page.getByTestId('product-2-delete').click();
  await expect(text(page, 'products-count')).toHaveText('count: 0');
  // An emptied list was still loaded.
  await expect(text(page, 'products-loaded')).toHaveText('loaded: true');
});

test('updateMany discounts and deleteMany removes the selection', async ({ page }) => {
  await page.getByTestId('add-many').click();
  await page.getByTestId('product-1-select').check();
  await page.getByTestId('product-10-select').check();

  await page.getByTestId('discount-selected').click();
  await expect(text(page, 'product-1-text')).toHaveText('#1 Laptop – 1080');
  await expect(text(page, 'product-10-text')).toHaveText('#10 Mouse – 23');
  await expect(text(page, 'product-2-text')).toHaveText('#2 Phone – 800');

  await page.getByTestId('delete-selected').click();
  await expect(page.getByTestId('product-1')).toHaveCount(0);
  await expect(page.getByTestId('product-10')).toHaveCount(0);
  await expect(text(page, 'products-count')).toHaveText('count: 2');
});

test('find and has look up by id reactively', async ({ page }) => {
  await page.getByTestId('lookup-id').fill('2');
  await expect(text(page, 'lookup-has')).toHaveText('has: true');
  await expect(text(page, 'lookup-find')).toHaveText('find: Phone');

  await page.getByTestId('product-2-delete').click();
  await expect(text(page, 'lookup-has')).toHaveText('has: false');
  await expect(text(page, 'lookup-find')).toHaveText('find: —');
});

test('async load shows loading, then replaceAll ends it', async ({ page }) => {
  await page.getByTestId('reload').click();
  await expect(text(page, 'products-loading')).toHaveText('loading: true');
  await expect(text(page, 'products-loading')).toHaveText('loading: false');
  await expect(text(page, 'products-count')).toHaveText('count: 3');
  await expect(text(page, 'product-100-text')).toHaveText('#100 Monitor – 300');
  await expect(text(page, 'products-error')).toHaveText('error: none');
});

test('failed async load sets the error, ends loading and keeps the data', async ({ page }) => {
  await page.getByTestId('reload-fail').click();
  await expect(text(page, 'products-loading')).toHaveText('loading: true');
  await expect(text(page, 'products-error')).toHaveText('error: Server unavailable (503)');
  await expect(text(page, 'products-loading')).toHaveText('loading: false');
  await expect(text(page, 'products-count')).toHaveText('count: 2');

  // A retry clears the old error immediately while loading.
  await page.getByTestId('reload').click();
  await expect(text(page, 'products-error')).toHaveText('error: none');
  await expect(text(page, 'products-count')).toHaveText('count: 3');
});

test('clear empties the list and resets loaded', async ({ page }) => {
  await page.getByTestId('clear').click();
  await expect(text(page, 'products-count')).toHaveText('count: 0');
  await expect(text(page, 'products-loaded')).toHaveText('loaded: false');
});

test('persist middleware restores products and loaded after a reload', async ({ page }) => {
  await addProduct(page, '3', 'Tablet', '500');
  await page.reload();
  await expect(text(page, 'product-3-text')).toHaveText('#3 Tablet – 500');
  await expect(text(page, 'products-count')).toHaveText('count: 3');

  // Only the partialized fields are stored.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('zenty-demo-products') ?? '{}'));
  expect(Object.keys(saved.state).sort()).toEqual(['entities', 'loaded']);

  await page.getByTestId('clear').click();
  await page.reload();
  await expect(text(page, 'products-count')).toHaveText('count: 0');
  await expect(text(page, 'products-loaded')).toHaveText('loaded: false');
});
