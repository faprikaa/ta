import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Function to copy manifest.json to dist
function copyManifest() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      fs.copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );
    }
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background.js';
          }
          return '[name].js';
        }
      }
    },
    outDir: 'dist'
  },
  plugins: [copyManifest()]
});