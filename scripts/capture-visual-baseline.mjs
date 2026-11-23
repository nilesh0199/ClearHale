import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const baselineDir = path.join(rootDir, '.baseline');

if (!fs.existsSync(baselineDir)) {
  fs.mkdirSync(baselineDir, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 }
];

const THEMES = ['dark', 'light'];
const ACCENTS = ['teal', 'mono'];
const LANGUAGES = ['en', 'mr'];

async function captureState(page, filename) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(baselineDir, filename) });
}

async function run() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const accent of ACCENTS) {
        for (const lang of LANGUAGES) {
          const cfgPrefix = `${vp.name}_${theme}_${accent}_${lang}`;
          console.log(`Capturing ${cfgPrefix}...`);

          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            reducedMotion: 'reduce'
          });
          const page = await context.newPage();

          // 1. Onboarding flow
          await page.addInitScript(({ theme, accent, lang }) => {
            localStorage.clear();
            localStorage.setItem('clearhale_theme', theme);
            localStorage.setItem('clearhale_accent', accent);
            localStorage.setItem('clearhale_language', lang);
          }, { theme, accent, lang });

          await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(1000);

          // Welcome screen
          await captureState(page, `${cfgPrefix}_01_welcome.png`);

          // Dismiss welcome -> Theme step
          const welcome = page.locator('div[role="region"][aria-label="Welcome screen"]');
          if (await welcome.count() > 0) {
            await welcome.first().click({ force: true });
            await page.waitForTimeout(600);
          }
          await captureState(page, `${cfgPrefix}_02_onboarding_theme.png`);

          // Continue -> Language step
          const continueBtn = page.locator('button:has-text("Continue"), button:has-text("पुढे चालू ठेवा")');
          if (await continueBtn.count() > 0) {
            await continueBtn.first().click();
            await page.waitForTimeout(600);
          }
          await captureState(page, `${cfgPrefix}_03_onboarding_language.png`);

          // 2. Main App (Completed Onboarding)
          const appPage = await context.newPage();
          await appPage.addInitScript(({ theme, accent, lang }) => {
            localStorage.setItem('clearhale_theme', theme);
            localStorage.setItem('clearhale_accent', accent);
            localStorage.setItem('clearhale_language', lang);
            localStorage.setItem('clearhale_onboarding_completed', 'true');
            const prof = {
              city: { name: 'Nagpur, India', lat: 21.1458, lon: 79.0882, admin: 'Maharashtra', country: 'India' },
              language: lang,
              theme,
              accentMode: accent,
              household: {
                members: ['child', 'elderly'],
                cookingFuel: 'lpg',
                commute: ['two_wheeler', 'bus_metro'],
                work: 'indoor',
                budget: 'low_cost'
              },
              homeTabFamilyFilter: 'family',
              activeFamilyFilter: 'whole_family',
              checkedActions: [],
              onboardingCompleted: true
            };
            localStorage.setItem('clearhale_user_profile', JSON.stringify(prof));
          }, { theme, accent, lang });

          await appPage.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
          await appPage.waitForTimeout(1500);

          // Home
          await captureState(appPage, `${cfgPrefix}_04_home.png`);

          // Plan
          const planBtn = appPage.locator('button[data-tab="plan"]:visible');
          if (await planBtn.count() > 0) {
            await planBtn.first().click();
            await appPage.waitForTimeout(800);
            await captureState(appPage, `${cfgPrefix}_05_plan.png`);
          }

          // Ask
          const askBtn = appPage.locator('button[data-tab="ask"]:visible');
          if (await askBtn.count() > 0) {
            await askBtn.first().click();
            await appPage.waitForTimeout(800);
            await captureState(appPage, `${cfgPrefix}_06_ask.png`);
          }

          // Care
          const careBtn = appPage.locator('button[data-tab="care"]:visible');
          if (await careBtn.count() > 0) {
            await careBtn.first().click();
            await appPage.waitForTimeout(800);
            await captureState(appPage, `${cfgPrefix}_07_care_breathe.png`);

            // Care learn tab
            const learnTab = appPage.locator('#tab-learn:visible');
            if (await learnTab.count() > 0) {
              await learnTab.first().click();
              await appPage.waitForTimeout(600);
              await captureState(appPage, `${cfgPrefix}_08_care_learn.png`);
            }
          }

          // Profile
          const profileBtn = appPage.locator('button[data-tab="profile"]:visible');
          if (await profileBtn.count() > 0) {
            await profileBtn.first().click();
            await appPage.waitForTimeout(800);
            await captureState(appPage, `${cfgPrefix}_09_profile.png`);
          }

          // Share Modal (back on home)
          const homeBtn = appPage.locator('button[data-tab="home"]:visible');
          if (await homeBtn.count() > 0) {
            await homeBtn.first().click();
            await appPage.waitForTimeout(600);
          }
          const shareBtn = appPage.locator('button:has-text("Share"), button:has-text("शेअर करा")');
          if (await shareBtn.count() > 0) {
            await shareBtn.first().click();
            await appPage.waitForTimeout(1000);
            await captureState(appPage, `${cfgPrefix}_10_share_modal.png`);
          }

          await context.close();
        }
      }
    }
  }

  await browser.close();
  console.log('Visual baseline successfully captured into .baseline/');
}

run().catch(console.error);
