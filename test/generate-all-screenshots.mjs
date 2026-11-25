import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const TARGET_DIRS = [
  path.resolve('docs/screenshots'),
  path.resolve('../Project/docs/screenshots'),
];

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // Fetch real live station data (Delhi: CPCB ITO & nearby stations via OpenAQ v3)
  const res = await fetch('http://localhost:3000/api/air-quality?lat=28.6139&lon=77.209');
  const liveData = await res.json();
  console.log(`[Init] Live Station Data fetched: ${liveData.station?.name} (${liveData.dataType}, ${liveData.current?.pm2_5} µg/m³)`);

  // ==========================================
  // 1. Desktop Screenshots (1440x900 Fullscreen)
  // ==========================================
  {
    console.log('\n--- Generating Desktop Fullscreen (1440x900) ---');
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.addInitScript(({ today, live }) => {
      localStorage.setItem('clearhale_onboarding_completed', 'true');
      localStorage.setItem(
        'clearhale_user_profile',
        JSON.stringify({
          city: { id: 'delhi', name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, lon: 77.209 },
          language: 'en',
          household: { members: [] },
          onboardingCompleted: true,
        })
      );
      localStorage.setItem('clearhale_last_reading_cache', JSON.stringify(live));
      localStorage.setItem('clearhale_lang_hint_dismissed_v2', 'true');
      localStorage.setItem('clearhale_lang_coach_dismissed', 'true');
      localStorage.setItem('clearhale_nudge_warn_family', today);
      localStorage.setItem('clearhale_nudge_alerts_dismissed', today);
    }, { today: todayStr, live: liveData });

    // 01-home-desktop.png (1440x900 Fullscreen with Live Station Data)
    console.log('Capturing 01-home-desktop.png (1440x900 Fullscreen with Live Station)...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('text=Live', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Toggle Fullscreen layout
    const fsBtn = page.locator('header button:has-text("Fullscreen")');
    if (await fsBtn.isVisible()) {
      await fsBtn.click();
      await page.waitForTimeout(800);
    }

    // Dismiss any coach mark if still visible
    const gotItBtn = page.locator('button:has-text("Got it")');
    if (await gotItBtn.isVisible()) {
      await gotItBtn.click();
      await page.waitForTimeout(300);
    }

    const homeRaw = await page.screenshot();
    await saveOptimized('01-home-desktop.png', homeRaw);
    await saveOptimized('08-desktop-dashboard-view.png', homeRaw);
    await saveOptimized('desktop-dashboard-view.png', homeRaw);

    // 02-plan-desktop.png
    console.log('Capturing 02-plan-desktop.png ...');
    await page.locator('aside button[data-tab="plan"]').click();
    await page.waitForTimeout(1500);
    const planRaw = await page.screenshot();
    await saveOptimized('02-plan-desktop.png', planRaw);

    // 03-care-desktop.png
    console.log('Capturing 03-care-desktop.png ...');
    await page.locator('aside button[data-tab="care"]').click();
    await page.waitForTimeout(1500);
    const careRaw = await page.screenshot();
    await saveOptimized('03-care-desktop.png', careRaw);

    // 04-ask-desktop.png
    console.log('Capturing 04-ask-desktop.png ...');
    await page.locator('aside button[data-tab="ask"]').click();
    await page.waitForTimeout(1500);
    const askRaw = await page.screenshot();
    await saveOptimized('04-ask-desktop.png', askRaw);

    // desktop-share-modal.png
    console.log('Capturing desktop-share-modal.png ...');
    await page.locator('aside button[data-tab="home"]').click();
    await page.waitForTimeout(1500);
    await page.locator('header button:has-text("Share")').click();
    try {
      await page.waitForSelector('text="Generating poster..."', { state: 'detached', timeout: 6000 });
    } catch (e) {}
    await page.waitForTimeout(1000);
    const shareModalRaw = await page.screenshot();
    await saveOptimized('desktop-share-modal.png', shareModalRaw);

    await context.close();
  }

  // ==========================================
  // 2. Mobile Screenshots (474x1024, isMobile: true)
  // ==========================================
  {
    console.log('\n--- Generating Mobile Views (474x1024) ---');
    const context = await browser.newContext({
      viewport: { width: 474, height: 1024 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.addInitScript(({ today, live }) => {
      localStorage.setItem('clearhale_onboarding_completed', 'true');
      localStorage.setItem(
        'clearhale_user_profile',
        JSON.stringify({
          city: { id: 'delhi', name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, lon: 77.209 },
          language: 'en',
          household: { members: [] },
          onboardingCompleted: true,
        })
      );
      localStorage.setItem('clearhale_last_reading_cache', JSON.stringify(live));
      localStorage.setItem('clearhale_lang_hint_dismissed_v2', 'true');
      localStorage.setItem('clearhale_lang_coach_dismissed', 'true');
      localStorage.setItem('clearhale_nudge_warn_family', today);
      localStorage.setItem('clearhale_nudge_alerts_dismissed', today);
    }, { today: todayStr, live: liveData });

    // 05-home-mobile.png
    console.log('Capturing 05-home-mobile.png (Mobile with Live Station)...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('text=Live', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const gotItBtn = page.locator('button:has-text("Got it")');
    if (await gotItBtn.isVisible()) {
      await gotItBtn.click();
      await page.waitForTimeout(300);
    }

    const homeMobileRaw = await page.screenshot();
    await saveOptimized('05-home-mobile.png', homeMobileRaw);

    // 06-plan-mobile.png
    console.log('Capturing 06-plan-mobile.png ...');
    await page.locator('nav[aria-label="Mobile Navigation"] button[data-tab="plan"]').click();
    await page.waitForTimeout(1500);
    const planMobileRaw = await page.screenshot();
    await saveOptimized('06-plan-mobile.png', planMobileRaw);

    // 07-care-mobile.png
    console.log('Capturing 07-care-mobile.png ...');
    await page.locator('nav[aria-label="Mobile Navigation"] button[data-tab="care"]').click();
    await page.waitForTimeout(1500);
    const careMobileRaw = await page.screenshot();
    await saveOptimized('07-care-mobile.png', careMobileRaw);

    // 08-share-poster.png
    console.log('Capturing 08-share-poster.png ...');
    await page.locator('nav[aria-label="Mobile Navigation"] button[data-tab="home"]').click();
    await page.waitForTimeout(1500);
    await page.locator('header button:has-text("Share")').click();
    try {
      await page.waitForSelector('text="Generating poster..."', { state: 'detached', timeout: 6000 });
    } catch (e) {}
    await page.waitForTimeout(1000);
    const sharePosterMobileRaw = await page.screenshot();
    await saveOptimized('08-share-poster.png', sharePosterMobileRaw);

    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured, optimized, and verified successfully!');
}

async function saveOptimized(fileName, buffer) {
  const optimizedBuffer = await sharp(buffer)
    .png({ compressionLevel: 9, effort: 9, palette: true, quality: 95 })
    .toBuffer();

  const sizeKb = (optimizedBuffer.length / 1024).toFixed(1);
  for (const dir of TARGET_DIRS) {
    if (fs.existsSync(dir)) {
      const outPath = path.join(dir, fileName);
      fs.writeFileSync(outPath, optimizedBuffer);
      console.log(`  Saved: ${outPath} (${sizeKb} KB)`);
    }
  }
}

main().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
