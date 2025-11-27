#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔨 iOS Build Script (Fast)${NC}"
echo ""

# Navigate to iOS directory
cd "$(dirname "$0")/ios" || exit 1

# Check if workspace exists
if [ ! -f "Desires.xcworkspace/contents.xcworkspacedata" ]; then
    echo -e "${YELLOW}⚠️  Desires.xcworkspace not found! Running pod install...${NC}"
    pod install
fi

# Get current build number
CURRENT_BUILD=$(xcodebuild -project Desires.xcodeproj -showBuildSettings -configuration Release 2>/dev/null | grep "CURRENT_PROJECT_VERSION" | head -1 | awk '{print $3}' || echo "1")
CURRENT_VERSION=$(xcodebuild -project Desires.xcodeproj -showBuildSettings -configuration Release 2>/dev/null | grep "MARKETING_VERSION" | head -1 | awk '{print $3}' || echo "1.0")

echo -e "${YELLOW}📱 Version: ${CURRENT_VERSION} | Build: ${CURRENT_BUILD}${NC}"

# Increment build number
NEW_BUILD=$((CURRENT_BUILD + 1))
echo -e "${GREEN}⬆️  Incrementing build to: ${NEW_BUILD}${NC}"

# Update build number in project.pbxproj (both Debug and Release)
sed -i '' "s/CURRENT_PROJECT_VERSION = ${CURRENT_BUILD};/CURRENT_PROJECT_VERSION = ${NEW_BUILD};/g" Desires.xcodeproj/project.pbxproj

echo ""
echo -e "${GREEN}🔨 Building Archive (this may take a while)...${NC}"

# Build archive with optimizations
ARCHIVE_PATH="${HOME}/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/Desires-$(date +%Y-%m-%d-%H%M%S).xcarchive"

xcodebuild archive \
    -workspace Desires.xcworkspace \
    -scheme Desires \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    CODE_SIGN_IDENTITY="Apple Distribution" \
    CODE_SIGN_STYLE="Automatic" \
    -derivedDataPath ./build/DerivedData \
    -quiet || {
    echo "Build failed. Trying without quiet mode..."
    xcodebuild archive \
        -workspace Desires.xcworkspace \
        -scheme Desires \
        -configuration Release \
        -archivePath "$ARCHIVE_PATH" \
        -destination "generic/platform=iOS" \
        CODE_SIGN_IDENTITY="Apple Distribution" \
        CODE_SIGN_STYLE="Automatic" \
        -derivedDataPath ./build/DerivedData
}

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ Archive creation failed!"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Archive created successfully!${NC}"
echo -e "${YELLOW}📦 Archive: ${ARCHIVE_PATH}${NC}"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   1. Open Xcode → Window → Organizer"
echo -e "   2. Select the archive"
echo -e "   3. Click 'Distribute App' → 'App Store Connect'"
echo ""
echo -e "${GREEN}✨ Build complete!${NC}"

