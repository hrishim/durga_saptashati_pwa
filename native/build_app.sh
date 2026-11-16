#!/bin/bash
# Builds "Durga Saptashati.app" into ~/Applications. Run from this folder:  bash build_app.sh
set -e
cd "$(dirname "$0")"
command -v swiftc >/dev/null 2>&1 || { echo "swiftc not found (install Xcode or Command Line Tools)"; exit 1; }
B=https://hrishim.github.io/durga_saptashati_pwa/book
rm -rf book && mkdir book
curl -sfL "$B/manifest.txt" -o book/manifest.txt
tail -n +2 book/manifest.txt | while read f; do [ -n "$f" ] && curl -sfL "$B/$f" -o "book/$f"; done
rm -rf AppIcon.iconset && mkdir AppIcon.iconset
for s in 16 32 128 256 512; do
  sips -z $s $s icon1024.png --out AppIcon.iconset/icon_${s}x${s}.png >/dev/null
  sips -z $((s*2)) $((s*2)) icon1024.png --out AppIcon.iconset/icon_${s}x${s}@2x.png >/dev/null
done
iconutil -c icns AppIcon.iconset -o AppIcon.icns
APP="$HOME/Applications/Durga Saptashati.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -swift-version 5 -framework Cocoa -framework WebKit main.swift -o "$APP/Contents/MacOS/DurgaSaptashati"
cp Info.plist "$APP/Contents/Info.plist"
cp AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"
cp -R book "$APP/Contents/Resources/book"
codesign --force --deep -s - "$APP" 2>/dev/null || true
echo "Built: $APP"
open "$APP"
