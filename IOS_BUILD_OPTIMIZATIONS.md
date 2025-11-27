# iOS Build Optimierungen

## 🚀 Schnellere Builds

### 1. Build-Cache aktiviert
- **ccache** ist jetzt im Podfile aktiviert (Zeile 54)
- Beschleunigt wiederholte Builds erheblich
- Cached kompilierte Objekte zwischen Builds

### 2. Build-Scripts

#### Einfacher Build (nur Archive erstellen)
```bash
./ios-build.sh
```
- Erhöht automatisch die Build-Nummer
- Erstellt ein Archive
- Schneller, ohne Upload

#### Build + Upload
```bash
./ios-build-and-upload.sh
```
- Erhöht automatisch die Build-Nummer
- Erstellt ein Archive
- Lädt direkt zu App Store Connect hoch (wenn konfiguriert)

### 3. Weitere Optimierungen

#### Xcode Build Settings (empfohlen)
In Xcode → Build Settings:
- **Build Active Architecture Only**: `Yes` (für Debug)
- **Compilation Mode**: `Incremental`
- **Optimization Level**: `Fastest, Smallest [-Os]` (für Release)

#### Xcode Preferences
- **Locations → Derived Data**: Auf schnelle SSD setzen
- **Locations → Archives**: Auf schnelle SSD setzen

#### System-Optimierungen
```bash
# Xcode DerivedData aufräumen (wenn nötig)
rm -rf ~/Library/Developer/Xcode/DerivedData

# Build Cache leeren (nur wenn Probleme auftreten)
rm -rf ~/Library/Caches/com.apple.dt.Xcode
```

### 4. Upload-Optimierungen

#### Automatischer Upload mit Apple ID
```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
./ios-build-and-upload.sh
```

**App-spezifisches Passwort erstellen:**
1. https://appleid.apple.com → Sign-In and Security
2. App-Specific Passwords → Generate
3. Passwort kopieren und als Environment Variable setzen

#### Manueller Upload (empfohlen für erste Tests)
1. Script ausführen: `./ios-build.sh`
2. Xcode öffnen → Window → Organizer
3. Archive auswählen → "Distribute App"
4. "App Store Connect" wählen
5. Upload-Optionen auswählen

### 5. Build-Zeit sparen

#### Nur notwendige Architekturen bauen
Für Test-Builds können Sie in Xcode nur arm64 bauen:
- Build Settings → Architectures → `arm64` (nur für Tests!)

#### Incremental Builds
- Xcode cached bereits kompilierte Dateien
- Nur geänderte Dateien werden neu kompiliert
- **Nicht** `Clean Build Folder` verwenden, außer bei Problemen

### 6. Troubleshooting

#### Build zu langsam?
```bash
# Prüfe, ob ccache installiert ist
brew install ccache

# Prüfe Xcode Version (neueste ist meist schneller)
xcodebuild -version
```

#### Upload-Probleme?
- Prüfe Apple ID Credentials
- Prüfe App-spezifisches Passwort
- Prüfe Internet-Verbindung
- Verwende manuellen Upload über Xcode Organizer

## 📊 Erwartete Build-Zeiten

- **Erster Build**: 10-20 Minuten (alle Dependencies)
- **Incremental Build**: 2-5 Minuten (nur Änderungen)
- **Clean Build**: 8-15 Minuten (ohne Cache)
- **Archive**: +2-5 Minuten zusätzlich

Mit ccache und optimierten Settings sollten Builds deutlich schneller sein!

