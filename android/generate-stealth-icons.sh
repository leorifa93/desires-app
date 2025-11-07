#!/bin/bash
set -euo pipefail

SRC_DIR="/Users/leonardorifa/Downloads/Stealth/Google"
RES_DIR="/Users/leonardorifa/Documents/Programming/Desires/react-native-desires/android/app/src/main/res"

# Mapping: source filename -> target launcher name used in manifest
# ic_launcher_<target>.png
declare -A MAP=(
  ["Stealth_G01_Taxi.png"]="taxi"
  ["Stealth_G02_Health_Care.png"]="health_care"
  ["Stealth_G03_Gym_Tips.png"]="gym"
  ["Stealth_G04_Flight_Radar.png"]="flight"
  ["Stealth_G05_Navigator.png"]="navigator"
  ["Stealth_G06_Free_WiFi.png"]="wifi"
  ["Stealth_G07_Champions_League.png"]="cl"
  ["Stealth_G08_MLS_News.png"]="mls_news"
  ["Stealth_G09_NFL_News.png"]="nfl_news"
  # NHL_News nicht im Code genutzt; wir haben "nfl" als separates Icon
)

# Optional: wenn es eine NHL-Variante geben soll, kann man sie hier auf "nfl" mappen oder auslassen
if [[ -f "$SRC_DIR/Stealth_G10_NHL_News.png" ]]; then
  MAP["Stealth_G10_NHL_News.png"]="nfl"
fi

# Densities and sizes
pairs=(
  mdpi:48
  hdpi:72
  xhdpi:96
  xxhdpi:144
  xxxhdpi:192
)

echo "🎨 Generating Android stealth icons from $SRC_DIR"
for src in "${!MAP[@]}"; do
  in="$SRC_DIR/$src"
  outname="${MAP[$src]}"
  if [[ ! -f "$in" ]]; then
    echo "⚠️  Missing: $in (skipping)"; continue
  fi
  echo "📦 $src → ic_launcher_${outname}.png"
  for p in "${pairs[@]}"; do
    dens="${p%%:*}"; size="${p##*:}"
    outdir="$RES_DIR/mipmap-$dens"
    mkdir -p "$outdir"
    sips -z "$size" "$size" "$in" --out "$outdir/ic_launcher_${outname}.png" >/dev/null
    echo "  ✅ $dens $size"
  done
done

echo "✅ Done"
