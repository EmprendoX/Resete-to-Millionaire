#!/usr/bin/env node
/**
 * Build script for the mobile PWA.
 * Produces a self-contained, deployable folder at docs/mobile/ that can be
 * served directly by Netlify (which publishes docs/) or any static host.
 *
 * It copies mobile/ + its JS/audio dependencies and rewrites the
 * "../src/" and "../assets/" relative paths into local "./src/" / "./assets/"
 * paths so the bundle works from any mount point.
 */

import { mkdir, rm, readFile, writeFile, cp, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const OUT = join(ROOT, 'docs', 'mobile');

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function run() {
  console.log(`[mobile/build] Output: ${OUT}`);
  if (await exists(OUT)) await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // 1) Copy mobile/ verbatim (except this build script)
  const mobileSrc = join(ROOT, 'mobile');
  await cp(mobileSrc, OUT, {
    recursive: true,
    filter: (src) => !src.endsWith('build.mjs')
  });

  // 2) Copy binaural engine + programs next to mobile (was ../src/)
  const srcOut = join(OUT, 'src');
  await mkdir(srcOut, { recursive: true });
  await cp(join(ROOT, 'src', 'binauralPrograms.js'), join(srcOut, 'binauralPrograms.js'));
  await cp(join(ROOT, 'src', 'binauralAudioEngine.js'), join(srcOut, 'binauralAudioEngine.js'));

  // 3) Copy assets (logo + MP3s) (was ../assets/)
  const assetsOut = join(OUT, 'assets');
  await mkdir(join(assetsOut, 'audio'), { recursive: true });
  await cp(join(ROOT, 'assets', 'audio'), join(assetsOut, 'audio'), {
    recursive: true
  });

  // 4) Rewrite relative paths (../src/ -> ./src/, ../assets/ -> ./assets/)
  const rewriteTargets = [
    'index.html',
    'app.js',
    'sw.js',
    'audio-manifest.json',
    'manifest.webmanifest'
  ];

  for (const rel of rewriteTargets) {
    const file = join(OUT, rel);
    if (!(await exists(file))) continue;
    let text = await readFile(file, 'utf8');
    const before = text;
    text = text
      .replaceAll('../src/', './src/')
      .replaceAll('../assets/', './assets/');
    if (text !== before) {
      await writeFile(file, text, 'utf8');
      console.log(`[mobile/build] rewrote paths in ${rel}`);
    }
  }

  console.log('[mobile/build] Done. Deploy docs/mobile/ via Netlify (publish = "docs").');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
