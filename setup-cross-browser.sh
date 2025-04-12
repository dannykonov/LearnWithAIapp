#!/bin/bash

# Script to install cross-browser and responsive design dependencies

echo "Installing cross-browser compatibility dependencies..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm could not be found. Please install Node.js first."
    exit 1
fi

# Install PostCSS plugins
echo "Installing PostCSS plugins for cross-browser compatibility..."
npm install postcss-preset-env postcss-flexbugs-fixes cssnano --save-dev || {
  echo "Error installing PostCSS plugins"
  exit 1
}

# Install polyfills
echo "Installing polyfills for better browser support..."
npm install core-js regenerator-runtime focus-visible || {
  echo "Error installing polyfills"
  exit 1
}

echo "Dependencies installed successfully!"

# Run development server to apply changes
echo "Would you like to run the development server to test the changes? (y/n)"
read -r answer
if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
  npm run dev
else
  echo "You can run 'npm run dev' to test the changes."
fi

echo "Your app has been improved with:"
echo "✅ Enhanced responsive design with proper breakpoints"
echo "✅ Fluid typography support"
echo "✅ Cross-browser compatibility fixes"
echo "✅ Better touch device support"
echo "✅ Improved accessibility"
echo "✅ Mobile media optimizations" 