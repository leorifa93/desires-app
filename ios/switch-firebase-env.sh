#!/bin/bash

# Switch GoogleService-Info.plist based on build configuration
# This script automatically selects the correct Firebase environment

PLIST_DESTINATION="${PROJECT_DIR}/Desires/GoogleService-Info.plist"

if [ "${CONFIGURATION}" == "Debug" ]; then
    echo "🔄 Switching to STAGE Firebase environment"
    cp "${PROJECT_DIR}/Desires/GoogleService-Info-Stage.plist" "${PLIST_DESTINATION}"
    echo "✅ Using Stage Database (dexxire-stage)"
elif [ "${CONFIGURATION}" == "Release" ]; then
    echo "🔄 Switching to PRODUCTION Firebase environment"
    cp "${PROJECT_DIR}/Desires/GoogleService-Info-Production.plist" "${PLIST_DESTINATION}"
    echo "✅ Using Production Database (dexxire-dfcba)"
else
    echo "⚠️  Unknown configuration: ${CONFIGURATION}"
    echo "Using Production by default"
    cp "${PROJECT_DIR}/Desires/GoogleService-Info-Production.plist" "${PLIST_DESTINATION}"
fi

