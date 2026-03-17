#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const allowedMarkdown = new Set(['README.md', 'CONTRIBUTING_AI.md', '.agent-trigger.md']);
const ignoredDirs = new Set(['node_modules', '.git', 'dist', '.ai-versions']);

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function isPascalCase(fileName) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(fileName);
}

async function main() {
  const files = await walk(rootDir);
  const issues = [];

  for (const filePath of files) {
    const relative = path.relative(rootDir, filePath).replace(/\\/g, '/');
    if (relative.endsWith('.md') && !allowedMarkdown.has(path.basename(relative))) {
      issues.push(`Markdown tidak diizinkan: ${relative}`);
    }

    if (relative.startsWith('src/components/') && relative.endsWith('.js')) {
      const baseName = path.basename(relative, '.js');
      if (baseName !== '.gitkeep' && !isPascalCase(baseName)) {
        issues.push(`Nama komponen harus PascalCase: ${relative}`);
      }
    }
  }

  if (issues.length > 0) {
    issues.forEach((issue) => console.error(issue));
    process.exit(1);
  }

  console.log('Lint passed');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
