import os
from PIL import Image

src_path = "assets/icons/app_logo_1024.png"
if not os.path.exists(src_path):
    print("Source image not found:", src_path)
    exit(1)

img = Image.open(src_path).convert("RGBA")
print(f"Loaded source image: {src_path} ({img.size})")

targets = [
    # Android mipmaps
    ("android/app/src/main/res/mipmap-mdpi/ic_launcher.png", (48, 48)),
    ("android/app/src/main/res/mipmap-hdpi/ic_launcher.png", (72, 72)),
    ("android/app/src/main/res/mipmap-xhdpi/ic_launcher.png", (96, 96)),
    ("android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", (144, 144)),
    ("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", (192, 192)),
    # Web PWA & Apple icons
    ("web-admin/public/apple-touch-icon.png", (180, 180)),
    ("web-admin/public/Icon-192.png", (192, 192)),
    ("web-admin/public/Icon-512.png", (512, 512)),
    ("web-admin/public/Icon-maskable-192.png", (192, 192)),
    ("web-admin/public/Icon-maskable-512.png", (512, 512)),
]

for dest, size in targets:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    resized = img.resize(size, Image.Resampling.LANCZOS)
    resized.save(dest, format="PNG", optimize=True)
    print(f"Generated: {dest} ({size[0]}x{size[1]})")

print("All Android and Web icons generated successfully!")
