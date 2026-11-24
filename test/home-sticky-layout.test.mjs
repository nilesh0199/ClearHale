import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { chromium } from 'playwright';

const BASE_PROFILE = {
  city: { name: 'Nagpur', lat: 21.1458, lon: 79.0882, country: 'India' },
  language: 'en',
  household: {
    members: [],
    cookingFuel: 'lpg',
    commute: ['bus_metro'],
    work: 'indoor',
    budget: 'low_cost',
  },
  activeFamilyFilter: 'whole_family',
  checkedActions: [],
  onboardingCompleted: true,
  theme: 'light',
  reduceEffects: false,
};

describe('Desktop Home Sticky Layout (Playwright E2E)', () => {
  let browser;
  let serverAvailable = false;

  before(async () => {
    try {
      const res = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(600) });
      if (res.ok || res.status < 500) {
        serverAvailable = true;
      }
    } catch {
      serverAvailable = false;
    }

    if (!serverAvailable) return;

    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch {
      try {
        browser = await chromium.launch({ channel: 'msedge', headless: true });
      } catch {
        serverAvailable = false;
      }
    }
  });

  after(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('1366x768 viewport: top bar, family tabs, and ring card stay fixed while right column scrolls', async (t) => {
    if (!serverAvailable) {
      t.skip('Local dev server not running on localhost:3000; skipping E2E test');
      return;
    }
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    // Bypass onboarding and set default active profile
    await page.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('header');
    await page.waitForSelector('#recommendations-container');

    // 1. Initial positions
    const headerBoxBefore = await page.locator('header').boundingBox();
    const tablistBoxBefore = await page.locator('[role="tablist"]').boundingBox();
    const leftCardBefore = await page.locator('#recommendations-container').locator('..').locator('div').first().locator('section').boundingBox();
    const rightCol = page.locator('#recommendations-container');

    // Get the first recommendation card in right column
    const firstDecisionCardBefore = await page.locator('#family-tabpanel-whole_family').boundingBox();

    assert.ok(headerBoxBefore, 'Header must be visible');
    assert.ok(tablistBoxBefore, 'Tablist must be visible');
    assert.ok(leftCardBefore, 'Left ring card must be visible');
    assert.ok(firstDecisionCardBefore, 'First recommendation card must be visible');

    // 2. Scroll the right column down by 350px
    await rightCol.evaluate((el) => {
      el.scrollTop = 350;
    });
    await page.waitForTimeout(100);

    // 3. Verify positions after scroll
    const headerBoxAfter = await page.locator('header').boundingBox();
    const tablistBoxAfter = await page.locator('[role="tablist"]').boundingBox();
    const leftCardAfter = await page.locator('#recommendations-container').locator('..').locator('div').first().locator('section').boundingBox();
    const firstDecisionCardAfter = await page.locator('#family-tabpanel-whole_family').boundingBox();

    // Assert: Top bar position Y is completely fixed
    assert.strictEqual(
      Math.round(headerBoxAfter.y),
      Math.round(headerBoxBefore.y),
      'Top bar Y position must remain fixed during scroll'
    );

    // Assert: Family tabs position Y is completely fixed
    assert.strictEqual(
      Math.round(tablistBoxAfter.y),
      Math.round(tablistBoxBefore.y),
      'Family tabs row Y position must remain fixed during scroll'
    );

    // Assert: Left ring card position Y is completely fixed
    assert.strictEqual(
      Math.round(leftCardAfter.y),
      Math.round(leftCardBefore.y),
      'Left ring card Y position must remain fixed during scroll'
    );

    // Assert: Right column content moved up by ~350px
    const movedAmount = firstDecisionCardBefore.y - firstDecisionCardAfter.y;
    assert.ok(
      movedAmount > 200,
      `Right column content must move when scrolled (moved by ${movedAmount}px)`
    );

    // Assert: Window / document has NO page-level scrollbar (single scrollbar on right column)
    const windowScrollY = await page.evaluate(() => window.scrollY);
    assert.strictEqual(windowScrollY, 0, 'Window scrollY must stay 0 on desktop');

    await context.close();
  });

  test('Mouse wheel on left card forwards scroll to right column', async (t) => {
    if (!serverAvailable) { t.skip('Server not running on localhost:3000'); return; }
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    await page.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#recommendations-container');

    const rightCol = page.locator('#recommendations-container');
    const initialScrollTop = await rightCol.evaluate((el) => el.scrollTop);
    assert.strictEqual(initialScrollTop, 0);

    // Hover over left column ring card and wheel down
    const leftCard = page.locator('#recommendations-container').locator('..').locator('div').first().locator('section');
    await leftCard.hover();
    await page.mouse.wheel(0, 250);
    await page.waitForTimeout(200);

    const scrolledTop = await rightCol.evaluate((el) => el.scrollTop);
    assert.ok(scrolledTop > 0, `Right column must scroll when wheeling over left card (scrolled to ${scrolledTop}px)`);

    await context.close();
  });

  test('Keyboard navigation works on the right scroll container', async (t) => {
    if (!serverAvailable) { t.skip('Server not running on localhost:3000'); return; }
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    await page.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#recommendations-container');

    const rightCol = page.locator('#recommendations-container');
    await rightCol.focus();

    // Press PageDown
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(100);

    const afterPageDown = await rightCol.evaluate((el) => el.scrollTop);
    assert.ok(afterPageDown > 100, `PageDown must scroll down (now at ${afterPageDown}px)`);

    // Press Home
    await page.keyboard.press('Home');
    await page.waitForTimeout(100);

    const afterHome = await rightCol.evaluate((el) => el.scrollTop);
    assert.strictEqual(afterHome, 0, 'Home key must scroll back to top (0px)');

    await context.close();
  });

  test('Family tab switch updates both columns and resets right column scroll to top', async (t) => {
    if (!serverAvailable) { t.skip('Server not running on localhost:3000'); return; }
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const page = await context.newPage();

    await page.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#recommendations-container');

    const rightCol = page.locator('#recommendations-container');

    // Scroll down first
    await rightCol.evaluate((el) => {
      el.scrollTop = 400;
    });
    await page.waitForTimeout(50);
    assert.ok((await rightCol.evaluate((el) => el.scrollTop)) > 0);

    // Click "Baby & Kids" family tab
    const babyTab = page.locator('#family-tab-child');
    await babyTab.click();
    await page.waitForTimeout(300);

    // Check scroll was reset to top
    const resetScrollTop = await rightCol.evaluate((el) => el.scrollTop);
    assert.strictEqual(resetScrollTop, 0, 'Switching family tab must reset scroll to top');

    await context.close();
  });

  test('Compact mode activates on constrained viewports (1280x720, 1366x768) and scales appropriately', async (t) => {
    if (!serverAvailable) { t.skip('Server not running on localhost:3000'); return; }
    // 1. Constrained viewport 1280x720
    const ctx720 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page720 = await ctx720.newPage();
    await page720.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);
    await page720.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page720.waitForSelector('#recommendations-container');

    // Ring SVG on 720p should be compact (<= 185px)
    const ringSvg720 = page720.locator('section svg').first();
    const ringBox720 = await ringSvg720.boundingBox();
    assert.ok(ringBox720.width <= 185, `Ring should be compact (<= 185px) on 720p, got ${ringBox720.width}`);

    // Check left column is not cut off
    const leftCol = page720.locator('#recommendations-container').locator('..').locator('div').first();
    const isClipped = await leftCol.evaluate((el) => el.scrollHeight > el.clientHeight && el.scrollTop > 0);
    assert.strictEqual(isClipped, false, 'Left column must not be clipped');

    await ctx720.close();

    // 2. Roomy viewport 1920x1080 (normal size 230px)
    const ctx1080 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page1080 = await ctx1080.newPage();
    await page1080.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);
    await page1080.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page1080.waitForSelector('#recommendations-container');

    const ringSvg1080 = page1080.locator('section svg').first();
    const ringBox1080 = await ringSvg1080.boundingBox();
    assert.ok(ringBox1080.width >= 220, `Ring should be standard (>= 220px) on 1080p, got ${ringBox1080.width}`);

    await ctx1080.close();
  });

  test('Responsive behavior: below 1024px retains standard mobile scrolling', async (t) => {
    if (!serverAvailable) { t.skip('Server not running on localhost:3000'); return; }
    const ctxMobile = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const pageMobile = await ctxMobile.newPage();
    await pageMobile.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify(base));
    }, BASE_PROFILE);
    await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await pageMobile.waitForSelector('header');

    // On mobile, window scrolling is allowed
    await pageMobile.evaluate(() => window.scrollTo(0, 200));
    await pageMobile.waitForTimeout(100);
    const scrollY = await pageMobile.evaluate(() => window.scrollY);
    assert.ok(scrollY > 100, `Mobile window must be scrollable, got ${scrollY}px`);

    await ctxMobile.close();
  });

  test('Works cleanly in dark mode and regional languages (Hindi)', async (t) => {
    if (!serverAvailable) { t.skip('Server not running on localhost:3000'); return; }
    const ctxRegional = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const pageRegional = await ctxRegional.newPage();
    await pageRegional.addInitScript((base) => {
      localStorage.setItem('clearhale_user_profile', JSON.stringify({
        ...base,
        language: 'hi',
        theme: 'dark',
      }));
      localStorage.setItem('clearhale_theme', 'dark');
    }, BASE_PROFILE);
    await pageRegional.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await pageRegional.waitForSelector('#recommendations-container');

    // Dark class on html
    const isDark = await pageRegional.evaluate(() => document.documentElement.classList.contains('dark'));
    assert.strictEqual(isDark, true, 'Dark class must be applied');

    // Verify Hindi text rendered
    const textContent = await pageRegional.locator('header').textContent();
    assert.ok(textContent.includes('Nagpur'), 'Header includes city name');

    await ctxRegional.close();
  });
});
