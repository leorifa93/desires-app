# Firebase Environment Switcher

Dieses Setup erlaubt es, automatisch zwischen Stage und Production Firebase-Umgebungen zu wechseln.

## 📁 Dateien

- `GoogleService-Info-Production.plist` - Production Datenbank (dexxire-dfcba)
- `GoogleService-Info-Stage.plist` - Stage Datenbank (dexxire-stage)  
- `GoogleService-Info.plist` - **Generierte Datei** (wird automatisch erstellt)
- `switch-firebase-env.sh` - Build Script

## 🔧 Xcode Setup (WICHTIG!)

Du musst das Build Script **einmalig** in Xcode hinzufügen:

### Schritt-für-Schritt:

1. **Öffne** `ios/Desires.xcworkspace` in Xcode

2. **Wähle** das Projekt "Desires" im Navigator (links)

3. **Wähle** Target "Desires"

4. **Gehe** zum Tab **"Build Phases"**

5. **Klicke** auf das **"+"** Symbol oben links

6. **Wähle** **"New Run Script Phase"**

7. **Ziehe** die neue "Run Script" Phase **ÜBER** "Copy Bundle Resources"

8. **Klappe** die "Run Script" Phase auf

9. **Füge** dieses Script ein:

```bash
"${PROJECT_DIR}/switch-firebase-env.sh"
```

10. **Optional**: Benenne die Phase um in "Switch Firebase Environment"

11. **Fertig!** ✅

## 🚀 Verwendung

### Debug Build → Stage Datenbank
```bash
# In Xcode:
Product → Scheme → Edit Scheme → Run → Build Configuration: Debug

# Oder über Terminal:
npx react-native run-ios --mode Debug
```

### Release Build → Production Datenbank  
```bash
# In Xcode:
Product → Scheme → Edit Scheme → Run → Build Configuration: Release

# Oder für Archive:
Product → Archive
```

## 📊 Welche Umgebung wird verwendet?

Schau in die Xcode Build Logs:
- `✅ Using Stage Database (dexxire-stage)` 
- `✅ Using Production Database (dexxire-dfcba)`

## ⚠️ Wichtig

- `GoogleService-Info.plist` wird **automatisch generiert** und ist in `.gitignore`
- **Committe NIEMALS** die generierte `GoogleService-Info.plist`
- **Committe IMMER** die `-Production.plist` und `-Stage.plist` Versionen
- Google Sign-In Credentials bleiben **gleich** in beiden Umgebungen

## 🔄 Zwischen Umgebungen wechseln

**Methode 1: Build Configuration ändern (empfohlen)**
- Xcode → Product → Scheme → Edit Scheme → Run → Build Configuration

**Methode 2: Clean & Rebuild**
```bash
# Clean
Product → Clean Build Folder (⇧⌘K)

# Rebuild mit gewünschter Configuration
```

## 🐛 Troubleshooting

**Problem**: "GoogleService-Info.plist not found"
**Lösung**: Führe das Build Script manuell aus:
```bash
cd ios
./switch-firebase-env.sh
```

**Problem**: Script wird nicht ausgeführt
**Lösung**: Prüfe, ob das Script ausführbar ist:
```bash
chmod +x ios/switch-firebase-env.sh
```

