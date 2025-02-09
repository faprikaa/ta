import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../dist');

// Ensure dist directory exists
try {
  mkdirSync(outDir, { recursive: true });
} catch (err) {
  // Directory already exists
}

// Import manifest
import('../src/manifest.js').then(({ default: manifest }) => {
  // Write manifest.json
  writeFileSync(
    resolve(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}).catch(err => {
  console.error('Error generating manifest:', err);
  process.exit(1);
});