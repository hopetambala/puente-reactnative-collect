#!/bin/bash

# Setup Git pre-commit hooks for animation linter validation
# Run this once to enable automatic animation checks before commits

set -e

HOOKS_DIR=".git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Create pre-commit hook
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/bash

# Pre-commit hook: Check animation system + i18n

echo "🎬 Validating Motion Design System..."
node scripts/lint-animations.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Animation lint violations detected!"
  echo "Fix violations with: yarn lint:animations"
  exit 1
fi

echo "✅ Animation system is clean"

echo "🌐 Validating i18n translations..."
node scripts/lint-i18n.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ i18n violations detected!"
  echo "Fix violations with: yarn lint:i18n"
  exit 1
fi

echo "✅ i18n is clean"

echo "🔄 Checking locale file sync..."
node scripts/check-locale-sync.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Locale files are out of sync with en.json!"
  echo "Fix with: yarn lint:locale-sync"
  exit 1
fi

echo "✅ Locale files are in sync"

echo "🔤 Checking for untranslated (verbatim-English) values..."
node scripts/check-locale-sync.js --verbatim

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Verbatim-English values found in locale files!"
  echo "Fix with: yarn lint:locale-sync:verbatim"
  exit 1
fi

echo "✅ No verbatim-English values found"
EOF

# Make hook executable
chmod +x "$PRE_COMMIT_HOOK"

echo "✅ Git pre-commit hook installed!"
echo "   Animation linter will run before every commit."
echo ""
echo "To skip the hook in case of emergency, use:"
echo "   git commit --no-verify"
