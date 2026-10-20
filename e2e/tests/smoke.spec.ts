import { expect, type Locator, type Page, test } from '@playwright/test';

const GAME_URL = 'http://localhost:5173/';
const DASHBOARD_URL = 'http://localhost:5174/';

test('walk the floor, play every game, use an item, auto-play and watch the dashboard', async ({
  page,
  context,
}) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
    console.log(`[game page error] ${error.stack ?? error.message}`);
  });
  await page.goto(GAME_URL);
  await expect(page.getByTestId('connection-status')).toHaveText('online');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByTestId('chip-count')).toHaveText('1,000');

  // Walk with the arrow keys.
  const position = page.getByTestId('player-pos');
  await expect(position).not.toHaveText('-');
  const start = (await position.textContent()) ?? '';
  await page.keyboard.down('ArrowUp');
  await expect(position).not.toHaveText(start);
  await page.keyboard.up('ArrowUp');

  // Buy an item at the shop counter.
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await page
    .getByTestId('shop-panel')
    .getByRole('button', { name: /Buy Four-Leaf Clover/ })
    .click();
  const inventory = page.getByTestId('inventory-panel');
  await expect(inventory).toContainText('Four-Leaf Clover');
  await expect(inventory).toContainText('8 uses left');

  // Roulette, with the clover spending one use.
  const table = page.getByTestId('table-panel');
  await walkToTable(page, 'Roulette');
  await table.getByRole('button', { name: 'Place bet' }).click();
  await expect(table.getByTestId('round-result')).toBeVisible();
  await expect(inventory).toContainText('7 uses left');
  await table.getByRole('button', { name: 'Leave table' }).click();

  // Slots.
  await walkToTable(page, 'Slots');
  await table.getByRole('button', { name: 'Spin', exact: true }).click();
  await expect(table.getByTestId('round-result')).toBeVisible();
  await table.getByRole('button', { name: 'Leave table' }).click();

  // Blackjack: stand whenever the hand waits for a decision.
  await walkToTable(page, 'Blackjack');
  await table.getByRole('button', { name: 'Deal' }).click();
  const stand = table.getByRole('button', { name: 'Stand' });
  const result = table.getByTestId('round-result');
  await expect(stand.or(result)).toBeVisible();
  if (await stand.isVisible()) await stand.click();
  await expect(result).toBeVisible();

  // Hand the character to the bots' brain at 4x.
  await page.getByRole('button', { name: 'Start auto-play' }).click();
  await page.getByRole('button', { name: '4x' }).click();
  await expect(page.getByTestId('sim-speed')).toHaveText('4x');
  await expect(page.getByRole('button', { name: 'Stop auto-play' })).toBeVisible();

  // The dashboard follows the floor live.
  const dashboard = await context.newPage();
  await dashboard.goto(DASHBOARD_URL);
  await expect(dashboard.getByTestId('humans-online')).not.toHaveText('0');
  const rounds = dashboard.getByTestId('total-rounds');
  await expect(rounds).not.toHaveText('0');
  const before = await readCount(rounds);
  await expect.poll(() => readCount(rounds)).toBeGreaterThan(before);
  await expect(dashboard.getByTestId('leaderboard')).toContainText('Guest');
  expect(pageErrors).toEqual([]);
});

async function walkToTable(page: Page, game: string): Promise<void> {
  await page.getByRole('button', { name: game, exact: true }).click();
  await expect(page.getByTestId('table-panel')).toContainText(`${game} table`);
}

async function readCount(locator: Locator): Promise<number> {
  return Number(((await locator.textContent()) ?? '0').replace(/[^\d]/g, ''));
}
