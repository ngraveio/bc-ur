
import {defineConfig} from 'tsup';
// import {fileURLToPath} from 'node:url';
// import fs from 'node:fs/promises';
// import path from 'node:path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const files = await fs.readdir(path.join(__dirname, 'src'));
// const entry = files
//   .filter(f => f.endsWith('.ts'))
//   .map(f => path.join('src', f));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
});