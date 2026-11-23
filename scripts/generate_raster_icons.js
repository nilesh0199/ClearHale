const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateRasterIcons() {
  const brandDir = path.join(__dirname, '..', 'public', 'brand');
  const publicDir = path.join(__dirname, '..', 'public');

  // Read SVG files
  const iconSvg = fs.readFileSync(path.join(brandDir, 'icon-512.svg'));
  const maskableSvg = fs.readFileSync(path.join(brandDir, 'icon-maskable-512.svg'));
  const faviconSvg = fs.readFileSync(path.join(brandDir, 'favicon.svg'));

  // Generate 192x192 PNG
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated public/icon-192.png');

  // Copy to brand/icon-192.png
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(brandDir, 'icon-192.png'));
  console.log('Generated public/brand/icon-192.png');

  // Generate 512x512 PNG
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated public/icon-512.png');

  // Copy to brand/icon-512.png
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(brandDir, 'icon-512.png'));
  console.log('Generated public/brand/icon-512.png');

  // Generate maskable 512x512 PNG
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Generated public/icon-maskable-512.png');

  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(brandDir, 'icon-maskable-512.png'));
  console.log('Generated public/brand/icon-maskable-512.png');

  // Generate favicon 32x32 PNG
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Generated public/favicon-32x32.png');

  // Generate favicon.ico (Sharp can write png which browsers accept as icon, or we can copy/provide it)
  await sharp(faviconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated public/favicon.ico');
}

generateRasterIcons().catch(err => {
  console.error(err);
  process.exit(1);
});
