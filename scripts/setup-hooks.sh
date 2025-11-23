#!/bin/sh
# Setup script to configure git hooks for the project
# Exit on any error
set -e

echo "Setting up git hooks for the project..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create symbolic link to our pre-commit hook
ln -sf "../../scripts/pre-commit.sh" .git/hooks/pre-commit

echo "✅ Git hooks have been set up successfully!"
echo "The pre-commit hook will now check code formatting before each commit."