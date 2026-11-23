import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'docs', 'screenshots-neutral');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function waitUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log('Starting preview server on port 3001...');
  const server = spawn('npm.cmd', ['run', 'start', '--', '-p', '3001'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: true,
  });

  const killServer = () => {
    try {
      server.kill();
    } catch (_) {}
  };

  process.on('exit', killServer);
  process.on('SIGINT', killServer);

  try {
    await waitUrl('http://localhost:3001', 30000);
    console.log('Server is live at http://localhost:3001');

    const browser = await chromium.launch({ headless: true, channel: 'chrome' });

    // Configurations to capture
    const configs = [
      { name: 'light-teal', theme: 'light', accent: 'teal', dark: false },
      { name: 'light-mono', theme: 'light', accent: 'mono', dark: false },
      { name: 'dark-teal', theme: 'dark', accent: 'teal', dark: true },
      { name: 'dark-mono', theme: 'dark', accent: 'mono', dark: true },
    ];

    for (const cfg of configs) {
      console.log(`\nCapturing screenshot set: ${cfg.name}...`);
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        colorScheme: cfg.dark ? 'dark' : 'light',
      });
      const page = await context.newPage();

      // Set initial localStorage for theme & accent
      await page.addInitScript(({ theme, accent }) => {
        localStorage.setItem('clearhale_theme', theme);
        localStorage.setItem('clearhale_accent', accent);
        localStorage.setItem('clearhale_onboarding_completed', 'true');
        const prof = {
          city: { name: 'Nagpur, India', lat: 21.1458, lon: 79.0882 },
          language: 'en',
          theme,
          accentMode: accent,
          household: {
            members: ['child'],
            cookingFuel: 'lpg',
            commute: ['bus_metro'],
            work: 'indoor',
            budget: 'low_cost',
          },
          activeFamilyFilter: 'child',
          checkedActions: [],
          onboardingCompleted: true,
        };
        localStorage.setItem('clearhale_user_profile', JSON.stringify(prof));
      }, cfg);

      await page.goto('http://localhost:3001');
      await page.waitForTimeout(1500);

      // 1. Home Screen
      await page.screenshot({
        path: path.join(outDir, `01-home-${cfg.name}.png`),
        fullPage: false,
      });

      // 2. Plan Screen
      const planBtn = page.locator('button[data-tab="plan"]:visible');
      if (await planBtn.count() > 0) {
        await planBtn.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(outDir, `02-plan-${cfg.name}.png`),
          fullPage: false,
        });
      }

      // 3. Ask Screen
      const askBtn = page.locator('button[data-tab="ask"]:visible');
      if (await askBtn.count() > 0) {
        await askBtn.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(outDir, `03-ask-${cfg.name}.png`),
          fullPage: false,
        });
      }

      // 4. Care Screen
      const careBtn = page.locator('button[data-tab="care"]:visible');
      if (await careBtn.count() > 0) {
        await careBtn.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(outDir, `04-care-${cfg.name}.png`),
          fullPage: false,
        });
      }

      // 5. Profile Screen
      const profileBtn = page.locator('button[data-tab="profile"]:visible');
      if (await profileBtn.count() > 0) {
        await profileBtn.first().click();
        await page.waitForTimeout(800);
        await page.screenshot({
          path: path.join(outDir, `05-profile-${cfg.name}.png`),
          fullPage: false,
        });
      }

      // 6. Share Modal / Card
      const homeBtn = page.locator('button[data-tab="home"]:visible');
      if (await homeBtn.count() > 0) {
        await homeBtn.first().click();
        await page.waitForTimeout(600);
      }
      const shareBtn = page.locator('button[title*="Share"], button[aria-label*="Share"]');
      if (await shareBtn.count() > 0) {
        await shareBtn.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(outDir, `06-share-${cfg.name}.png`),
          fullPage: false,
        });
      }

      await context.close();
    }

    // 7. Intake Screen
    console.log('\nCapturing Intake Flow screenshot...');
    const intakeContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const intakePage = await intakeContext.newPage();
    await intakePage.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem('clearhale_theme', 'light');
    });
    await intakePage.goto('http://localhost:3001');
    await intakePage.waitForTimeout(1500);
    await intakePage.screenshot({
      path: path.join(outDir, `07-intake-welcome.png`),
      fullPage: false,
    });
    await intakeContext.close();

    // 8. Desktop Home (1280x800)
    console.log('\nCapturing Desktop Home screenshot...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      colorScheme: 'light',
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.addInitScript(() => {
      localStorage.setItem('clearhale_theme', 'light');
      localStorage.setItem('clearhale_accent', 'teal');
      localStorage.setItem('clearhale_lang_hint_dismissed_v2', 'true');
      const prof = {
        city: { name: 'Nagpur, India', lat: 21.1458, lon: 79.0882 },
        language: 'en',
        theme: 'light',
        accentMode: 'teal',
        household: { members: ['child'], cookingFuel: 'lpg', commute: ['bus_metro'], work: 'indoor', budget: 'low_cost' },
        activeFamilyFilter: 'child',
        checkedActions: [],
        onboardingCompleted: true,
      };
      localStorage.setItem('clearhale_user_profile', JSON.stringify(prof));
    });
    await desktopPage.goto('http://localhost:3001');
    await desktopPage.waitForTimeout(1500);
    await desktopPage.screenshot({
      path: path.join(outDir, `08-desktop-dashboard-view.png`),
      fullPage: false,
    });
    await desktopContext.close();

    await browser.close();
    console.log('All screenshots captured successfully in docs/screenshots-neutral!');
  } finally {
    killServer();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
