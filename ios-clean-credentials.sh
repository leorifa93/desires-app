#!/bin/bash

# Script to clean old Xcode credentials from keychain

echo "🧹 Cleaning old Xcode credentials..."

# Remove old user credentials
OLD_USER="s.kaprot@gmx.de"
if security find-generic-password -a "$OLD_USER" -s "Xcode-Token" &>/dev/null; then
    security delete-generic-password -a "$OLD_USER" -s "Xcode-Token"
    echo "✅ Removed credentials for $OLD_USER"
else
    echo "ℹ️  No credentials found for $OLD_USER"
fi

# List remaining Xcode credentials
echo ""
echo "📋 Remaining Xcode credentials:"
security dump-keychain | grep -A 5 "Xcode-Token" || echo "No Xcode-Token credentials found"

echo ""
echo "💡 To add credentials for the correct user, sign in via:"
echo "   Xcode → Settings → Accounts → Add Account"

