#!/bin/bash

# Firebase Project Switcher Helper
# Usage: ./scripts/firebase-switch.sh [database|hosting]

case "$1" in
  database)
    echo "🔄 Switching to jbakun-62239 (Database)..."
    firebase use jbakun-62239
    echo "✅ Now using jbakun-62239"
    ;;
  hosting)
    echo "🔄 Switching to smart-34bcc (Hosting & Auth)..."
    firebase use smart-34bcc
    echo "✅ Now using smart-34bcc"
    ;;
  *)
    echo "Usage: $0 [database|hosting]"
    echo ""
    echo "Examples:"
    echo "  $0 database  # Switch to jbakun-62239 (Database)"
    echo "  $0 hosting   # Switch to smart-34bcc (Hosting & Auth)"
    exit 1
    ;;
esac
