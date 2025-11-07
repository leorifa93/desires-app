#!/bin/bash

set -e

echo "🔧 Cleaning iOS build, Pods and DerivedData..."

cd ios || exit 1

# 1. Entferne Pods, Lock-Datei und DerivedData
rm -rf Pods Podfile.lock
pod deintegrate

echo "🧹 Removing DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData

# 2. Installiere Pods neu (Rosetta für M1/M2-Macs)
if [[ $(uname -m) == 'arm64' ]]; then
  echo "💻 M1/M2/M3 Mac erkannt – führe pod install über Rosetta aus..."
  arch -x86_64 pod install --repo-update
else
  echo "💻 Intel Mac – normale Installation..."
  pod install --repo-update
fi

# 3. Gehe zurück ins Root-Verzeichnis
cd ..

echo "✅ iOS-Projekt wurde erfolgreich bereinigt und Pods neu installiert!"
echo "📂 Öffne jetzt 'ios/Desires.xcworkspace' in Xcode und führe einen Clean Build durch (⇧+⌘+K)"
