#!/bin/sh
# Pre-commit hook to run Prettier formatting check
# Exit on any error
set -e

echo "Running pre-commit checks..."

# Check if Prettier formatting is needed
if ! bun run format:check; then
  echo "❌ Code formatting issues found."
  echo "Please run 'bun run format' to fix formatting issues before committing."
  exit 1
fi

echo "✅ Code formatting is correct."
exit 0