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

# Pre-commit hook: Check animation system

echo "🎬 Validating Motion Design System..."
node scripts/lint-animations.js

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Animation lint violations detected!"
  echo "Fix violations with: yarn lint:animations"
  exit 1
fi

echo "✅ Animation system is clean"
EOF

# Make hook executable
chmod +x "$PRE_COMMIT_HOOK"

echo "✅ Git pre-commit hook installed!"
echo "   Animation linter will run before every commit."
echo ""
echo "To skip the hook in case of emergency, use:"
echo "   git commit --no-verify"
