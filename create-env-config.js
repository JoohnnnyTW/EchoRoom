
// create-env-config.js
// This script runs during Netlify's build process.
const fs = require('fs');
const path = require('path');

// Determine the output directory. In Netlify, the build command runs from the repo root.
// If your publish directory is '.', env-config.js should be at the root.
// If your publish directory is different (e.g., 'dist'), adjust the path.
const outputPath = path.join(process.cwd(), 'env-config.js'); // Assumes publish dir is root

const envConfigContent = `
window.process = window.process || {};
window.process.env = window.process.env || {};
Object.assign(window.process.env, {
  API_KEY: '${process.env.APP_GEMINI_API_KEY || ""}',
  BFL_API_KEY: '${process.env.APP_BFL_API_KEY || ""}'
});
console.log('env-config.js created by Netlify build: API keys configured. Gemini key found: ${!!process.env.APP_GEMINI_API_KEY}, BFL.ai key found: ${!!process.env.APP_BFL_API_KEY}');
`;

try {
  fs.writeFileSync(outputPath, envConfigContent.trim());
  console.log(`Successfully created env-config.js at ${outputPath}`);
} catch (error) {
  console.error(`Error creating env-config.js: ${error.message}`);
  process.exit(1); // Exit with error code if file creation fails
}
