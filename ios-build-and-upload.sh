#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 iOS Build & Upload Script${NC}"
echo ""

# Apple ID configuration (can be set via environment variable)
APPLE_ID="${APPLE_ID:-l.rifa@gmx.de}"
echo -e "${YELLOW}📧 Using Apple ID: ${APPLE_ID}${NC}"

# Check for old credentials in keychain
OLD_USER="s.kaprot@gmx.de"
if security find-generic-password -a "$OLD_USER" -s "Xcode-Token" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Old credentials found for ${OLD_USER}${NC}"
    echo -e "${YELLOW}💡 To remove old credentials, run:${NC}"
    echo -e "${YELLOW}   security delete-generic-password -a '${OLD_USER}' -s 'Xcode-Token'${NC}"
    echo ""
    read -p "Do you want to remove old credentials now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        security delete-generic-password -a "$OLD_USER" -s "Xcode-Token" 2>/dev/null || true
        echo -e "${GREEN}✅ Old credentials removed${NC}"
    fi
    echo ""
fi
echo ""

# Navigate to iOS directory
cd "$(dirname "$0")/ios" || exit 1

# Check if workspace exists
if [ ! -f "Desires.xcworkspace/contents.xcworkspacedata" ]; then
    echo -e "${RED}❌ Error: Desires.xcworkspace not found!${NC}"
    echo "Run 'pod install' first."
    exit 1
fi

# Get current build number
CURRENT_BUILD=$(xcodebuild -project Desires.xcodeproj -showBuildSettings -configuration Release | grep "CURRENT_PROJECT_VERSION" | head -1 | awk '{print $3}')
CURRENT_VERSION=$(xcodebuild -project Desires.xcodeproj -showBuildSettings -configuration Release | grep "MARKETING_VERSION" | head -1 | awk '{print $3}')

echo -e "${YELLOW}📱 Current Version: ${CURRENT_VERSION}${NC}"
echo -e "${YELLOW}🔢 Current Build: ${CURRENT_BUILD}${NC}"

# Increment build number
NEW_BUILD=$((CURRENT_BUILD + 1))
echo -e "${GREEN}⬆️  Incrementing build number to: ${NEW_BUILD}${NC}"

# Update build number in project.pbxproj
sed -i '' "s/CURRENT_PROJECT_VERSION = ${CURRENT_BUILD};/CURRENT_PROJECT_VERSION = ${NEW_BUILD};/g" Desires.xcodeproj/project.pbxproj

echo ""
echo -e "${GREEN}🔨 Building Archive...${NC}"

# Clean build folder for faster builds (optional, comment out if not needed)
# xcodebuild clean -workspace Desires.xcworkspace -scheme Desires -configuration Release

# Build archive
ARCHIVE_PATH="${HOME}/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/Desires-$(date +%Y-%m-%d-%H%M%S).xcarchive"

# Build archive (xcpretty is optional)
# Use automatic signing - Xcode will select the correct identity based on configuration
if command -v xcpretty &> /dev/null; then
    xcodebuild archive \
        -workspace Desires.xcworkspace \
        -scheme Desires \
        -configuration Release \
        -archivePath "$ARCHIVE_PATH" \
        -destination "generic/platform=iOS" \
        DEVELOPMENT_TEAM="8UHA237L32" \
        2>&1 | grep -v "DVTDeveloperAccountManager" | xcpretty || exit 1
else
    echo -e "${YELLOW}⚠️  xcpretty not found, building without it...${NC}"
    xcodebuild archive \
        -workspace Desires.xcworkspace \
        -scheme Desires \
        -configuration Release \
        -archivePath "$ARCHIVE_PATH" \
        -destination "generic/platform=iOS" \
        DEVELOPMENT_TEAM="8UHA237L32" \
        -quiet 2>&1 | grep -v "DVTDeveloperAccountManager" || exit 1
fi

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo -e "${RED}❌ Archive creation failed!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Archive created successfully!${NC}"
echo -e "${YELLOW}📦 Archive path: ${ARCHIVE_PATH}${NC}"
echo ""

# Ask if user wants to upload
read -p "Do you want to upload to App Store Connect? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}📤 Uploading to App Store Connect...${NC}"
    
    # Check if exportOptions.plist exists, create if not
    if [ ! -f "exportOptions.plist" ]; then
        echo -e "${YELLOW}⚠️  Creating exportOptions.plist...${NC}"
        cat > exportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF
    fi
    
    # Export IPA
    echo -e "${GREEN}📦 Exporting IPA...${NC}"
    if command -v xcpretty &> /dev/null; then
        xcodebuild -exportArchive \
            -archivePath "$ARCHIVE_PATH" \
            -exportOptionsPlist exportOptions.plist \
            -exportPath ./build 2>&1 | xcpretty || exit 1
    else
        xcodebuild -exportArchive \
            -archivePath "$ARCHIVE_PATH" \
            -exportOptionsPlist exportOptions.plist \
            -exportPath ./build -quiet || exit 1
    fi
    
    # Upload using altool (deprecated) or notarytool (recommended)
    # Find the IPA file
    IPA_FILE=$(find ./build -name "*.ipa" | head -1)
    
    if [ -z "$IPA_FILE" ]; then
        echo -e "${RED}❌ IPA file not found!${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📦 IPA: ${IPA_FILE}${NC}"
    echo ""
    echo -e "${YELLOW}💡 Recommended: Upload manually via Xcode Organizer${NC}"
    echo -e "${YELLOW}   1. Open Xcode → Window → Organizer${NC}"
    echo -e "${YELLOW}   2. Select the archive${NC}"
    echo -e "${YELLOW}   3. Click 'Distribute App' → 'App Store Connect'${NC}"
    echo ""
    echo -e "${GREEN}✅ Archive ready for upload!${NC}"
    echo ""
    echo -e "${YELLOW}📧 Using Apple ID: ${APPLE_ID}${NC}"
    echo -e "${YELLOW}💡 To use a different Apple ID, set: export APPLE_ID='your@email.com'${NC}"
else
    echo -e "${GREEN}✅ Build complete! Archive saved.${NC}"
    echo -e "${YELLOW}📦 Archive path: ${ARCHIVE_PATH}${NC}"
    echo -e "${YELLOW}💡 You can upload it later via Xcode → Window → Organizer${NC}"
fi

echo ""
echo -e "${GREEN}✨ Done!${NC}"
echo -e "${YELLOW}📱 Version: ${CURRENT_VERSION}${NC}"
echo -e "${YELLOW}🔢 Build: ${NEW_BUILD}${NC}"

