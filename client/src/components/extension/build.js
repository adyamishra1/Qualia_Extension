// Build script for Chrome extension
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionDir = path.join(__dirname);
const buildDir = path.join(__dirname, 'build');

// Create build directory
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Copy extension files to build directory
const filesToCopy = [
  'manifest.json',
  'background.js',
  'content.js',
  'popup.html',
  'popup.js',
  'styles.css'
];

console.log('Building Chrome extension...');

filesToCopy.forEach(file => {
  const srcPath = path.join(extensionDir, file);
  const destPath = path.join(buildDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copied ${file}`);
  } else {
    console.log(`⚠ Missing ${file}`);
  }
});

// Update manifest with Google Client ID if available
const manifestPath = path.join(buildDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Replace placeholder with actual Google Client ID from environment
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId) {
    manifest.oauth2.client_id = clientId;
    console.log('✓ Updated Google Client ID in manifest');
    console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
  } else {
    console.log('⚠ GOOGLE_CLIENT_ID not found in environment variables');
    console.log('   Using placeholder value - extension will not work without real Client ID');
  }
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// Create icons directory and placeholder icons
const iconsDir = path.join(buildDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Create simple SVG icons
const createIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#gradient)"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.5}">D</text>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4285f4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#34a853;stop-opacity:1" />
    </linearGradient>
  </defs>
</svg>`;

[16, 48, 128].forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(iconPath, createIcon(size));
  console.log(`✓ Created icon${size}.svg`);
});

console.log('\n🎉 Chrome extension build complete!');
console.log(`📁 Extension files are in: ${buildDir}`);
console.log('\n📝 Next steps:');
console.log('1. Add your Google Client ID to the manifest.json');
console.log('2. Load the extension in Chrome from chrome://extensions/');
console.log('3. Enable Developer mode and click "Load unpacked"');
console.log('4. Select the build folder');