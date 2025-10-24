import { build } from 'esbuild';

await build({
  entryPoints: ['src/mcp.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: ['node18'],
  outfile: 'dist/mcp.js',
  sourcemap: true,
  logLevel: 'info',
  banner: { js: '#!/usr/bin/env node' },
});
