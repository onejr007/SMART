#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const ROOT_DIR = process.cwd();
const TARGET_DIRS = ['ai', 'api', 'schemas', 'scripts', 'src', 'public/js'];
const JS_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const ignored = new Set(['node_modules', '.git', 'dist', '.ai-versions']);

async function collectFiles(dir) {
  const results = [];
  let entries = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignored.has(entry.name)) {
        continue;
      }
      const nested = await collectFiles(entryPath);
      results.push(...nested);
      continue;
    }
    if (JS_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(entryPath);
    }
  }

  return results;
}

function runSyntaxCheck(filePath) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, ['--check', filePath], {
      stdio: 'pipe'
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    proc.on('close', (code) => {
      resolve({
        ok: code === 0,
        filePath,
        error: stderr.trim()
      });
    });
  });
}

async function main() {
  const files = [];
  for (const targetDir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT_DIR, targetDir);
    const collected = await collectFiles(absoluteDir);
    files.push(...collected);
  }

  const uniqueFiles = [...new Set(files)].sort();
  if (uniqueFiles.length === 0) {
    console.log('No JavaScript files found for typecheck');
    process.exit(0);
  }

  const results = await Promise.all(uniqueFiles.map((filePath) => runSyntaxCheck(filePath)));
  const failed = results.filter((result) => !result.ok);

  if (failed.length === 0) {
    console.log(`Typecheck passed for ${uniqueFiles.length} files`);
    process.exit(0);
  }

  failed.forEach((item) => {
    console.error(`\n${path.relative(ROOT_DIR, item.filePath)}`);
    if (item.error) {
      console.error(item.error);
    }
  });

  process.exit(1);
}

main();
