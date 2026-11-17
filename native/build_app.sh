#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
# Local source layout and the committed GitHub native/ layout are both supported.
BOOK="$PWD/book"
if [ ! -f "$BOOK/flipbook.js" ]; then BOOK="$PWD/../book"; fi
[ -f "$BOOK/flipbook.js" ] || { echo 'Missing final book resources'; exit 1; }
VOLUME=/Volumes/codex_Extender
INFO=$(diskutil info "$VOLUME")
[[ "$INFO" == *67158BC2-8049-47D6-AF79-BC96D9E6CC9E* && "$INFO" == *'Device Location:           External'* ]] || { echo 'Reconnect the Samsung T7'; exit 1; }
APP="$PWD/Durga Saptashati.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -swift-version 5 -framework Cocoa -framework WebKit main.swift PageTurn.swift -module-cache-path "$VOLUME/Caches" -o "$APP/Contents/MacOS/DurgaSaptashati"
cp Info.plist "$APP/Contents/Info.plist"
# Existing icon assets are reused. Generate an icns from the committed PNG if needed.
if [ ! -f AppIcon.icns ]; then
  ICONSET="$VOLUME/Work/DurgaSaptashati.iconset"
  mkdir -p "$ICONSET"
  for s in 16 32 128 256 512; do
    sips -z "$s" "$s" icon1024.png --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
    sips -z "$((s*2))" "$((s*2))" icon1024.png --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
  done
  iconutil -c icns "$ICONSET" -o AppIcon.icns
fi
cp AppIcon.icns "$APP/Contents/Resources/AppIcon.icns"
mkdir -p "$APP/Contents/Resources/book"
while IFS= read -r f; do
 [ -z "$f" ] || cp "$BOOK/$f" "$APP/Contents/Resources/book/$f"
done < <(tail -n +2 "$BOOK/manifest.txt")
cp "$BOOK/manifest.txt" "$APP/Contents/Resources/book/manifest.txt"
codesign --force --deep -s - "$APP"
codesign --verify --deep --strict "$APP"
echo "Built and verified: $APP"
