import os
import base64
from PIL import Image

src_path = r'C:\Users\levono\.gemini\antigravity\brain\7fd4bfd6-9f40-451c-ba1a-c521bd6058ef\.user_uploaded\media_1795160606570_08cb076b.png'
img = Image.open(src_path).convert('RGBA')

os.makedirs('public/brand', exist_ok=True)

# 1. Base logo files
img.save('public/brand/logo.png', 'PNG')
img.save('public/brand/mark-full.png', 'PNG')
img.save('public/brand/mark-full-light.png', 'PNG')
img.save('public/brand/mark-full-dark.png', 'PNG')

# 2. PWA light & dark icons
def make_pwa_icon(size, padding_ratio=0.12, bg_color=(250, 252, 251, 255)):
    canvas = Image.new('RGBA', (size, size), bg_color)
    content_size = int(size * (1 - padding_ratio * 2))
    resized = img.resize((content_size, content_size), Image.Resampling.LANCZOS)
    offset = (size - content_size) // 2
    canvas.paste(resized, (offset, offset), resized)
    return canvas

# Light icons
icon_512 = make_pwa_icon(512, padding_ratio=0.12, bg_color=(250, 252, 251, 255))
icon_512.save('public/icon-512.png', 'PNG')
icon_512.save('public/brand/icon-512.png', 'PNG')

icon_192 = make_pwa_icon(192, padding_ratio=0.12, bg_color=(250, 252, 251, 255))
icon_192.save('public/icon-192.png', 'PNG')
icon_192.save('public/brand/icon-192.png', 'PNG')

# Maskable icon (safe zone circle margin)
icon_maskable = make_pwa_icon(512, padding_ratio=0.20, bg_color=(250, 252, 251, 255))
icon_maskable.save('public/icon-maskable-512.png', 'PNG')
icon_maskable.save('public/brand/icon-maskable-512.png', 'PNG')

# Dark icons
icon_dark_512 = make_pwa_icon(512, padding_ratio=0.12, bg_color=(11, 26, 24, 255))
icon_dark_512.save('public/brand/icon-dark-512.png', 'PNG')
icon_dark_192 = make_pwa_icon(192, padding_ratio=0.12, bg_color=(11, 26, 24, 255))
icon_dark_192.save('public/brand/icon-dark-192.png', 'PNG')

# Favicon
fav_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
fav_32.save('public/favicon-32x32.png', 'PNG')
fav_32.save('public/brand/favicon-32x32.png', 'PNG')

fav_48 = img.resize((48, 48), Image.Resampling.LANCZOS)
fav_48.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

# 3. High quality SVGs with embedded image
with open('public/brand/logo.png', 'rb') as f:
    b64_data = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_data}" x="0" y="0" width="1024" height="1024" />
</svg>'''

svg_targets = [
    'public/favicon.svg',
    'public/icon.svg',
    'public/brand/favicon.svg',
    'public/brand/mark-full-light.svg',
    'public/brand/mark-full-dark.svg',
    'public/brand/icon-192.svg',
    'public/brand/icon-512.svg',
    'public/brand/icon-maskable-512.svg'
]

for p in svg_targets:
    with open(p, 'w', encoding='utf-8') as f:
        f.write(svg_content)

# 4. Lockup SVGs (mark + "clearhale" text)
lockup_light = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_data}" x="10" y="10" width="100" height="100" />
  <text x="125" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="600" fill="#0B4F45" letter-spacing="-0.03em">clearhale</text>
</svg>'''

lockup_dark = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 120" width="100%" height="100%">
  <image href="data:image/png;base64,{b64_data}" x="10" y="10" width="100" height="100" />
  <text x="125" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="600" fill="#E6F4F1" letter-spacing="-0.03em">clearhale</text>
</svg>'''

with open('public/brand/lockup-light.svg', 'w', encoding='utf-8') as f:
    f.write(lockup_light)

with open('public/brand/lockup-dark.svg', 'w', encoding='utf-8') as f:
    f.write(lockup_dark)

print("All user brand assets processed and generated successfully!")
