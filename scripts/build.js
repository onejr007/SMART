#!/usr/bin/env node
// Build Script for AI Web Framework
// Optimizes and bundles the application

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  console.log('🚀 Building AI Web Framework (Production Mode)...');
  
  const buildDir = path.join(process.cwd(), 'dist');
  const publicDir = path.join(process.cwd(), 'public');
  const srcDir = path.join(process.cwd(), 'src');
  const componentsDir = path.join(srcDir, 'components');
  const pagesDir = path.join(srcDir, 'pages');
  
  try {
    // Clean build directory
    await fs.rm(buildDir, { recursive: true, force: true });
    await fs.mkdir(buildDir, { recursive: true });
    
    // Copy public files
    await copyDirectory(publicDir, buildDir);
    
    // Copy and obfuscate components (Optimization #39)
    try {
      const buildComponentsDir = path.join(buildDir, 'components');
      await fs.mkdir(buildComponentsDir, { recursive: true });
      const entries = await fs.readdir(componentsDir);
      
      for (const file of entries) {
        if (file.endsWith('.js')) {
          const content = await fs.readFile(path.join(componentsDir, file), 'utf8');
          const obfuscationResult = JavaScriptObfuscator.obfuscate(content, {
            compact: true,
            controlFlowFlattening: true,
            deadCodeInjection: true,
            debugProtection: true,
            disableConsoleOutput: true,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            unicodeEscapeSequence: true
          });
          await fs.writeFile(path.join(buildComponentsDir, file), obfuscationResult.getObfuscatedCode());
          console.log(`🔒 Obfuscated component: ${file}`);
        }
      }
      console.log('✅ Components processed and obfuscated');
    } catch (e) {
      console.log('ℹ️  No components found to process');
    }
    
    // Process pages
    try {
      const buildPagesDir = path.join(buildDir, 'pages');
      await fs.mkdir(buildPagesDir, { recursive: true });
      const entries = await fs.readdir(pagesDir);
      for (const file of entries) {
        await fs.copyFile(path.join(pagesDir, file), path.join(buildPagesDir, file));
      }
      console.log('✅ Pages copied');
    } catch (e) {
      console.log('ℹ️  No pages found to process');
    }
    
    // Generate build info
    const buildInfo = {
      timestamp: new Date().toISOString(),
      version: '2.1.0-hardened',
      framework: 'SMART AI Metaverse Engine',
      environment: 'production',
      features: ['obfuscated', 'compressed', 'optimized']
    };
    
    await fs.writeFile(
      path.join(buildDir, 'build-info.json'),
      JSON.stringify(buildInfo, null, 2)
    );
    
    // Create production server file
    const prodServer = `import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Optimization #7 & #39
app.use(helmet());
app.use(compression());

// Serve static files with caching
app.use(express.static(__dirname, { maxAge: '1d' }));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Hardened Production server running on port \${PORT}\`);
});`;

    await fs.writeFile(path.join(buildDir, 'server.js'), prodServer);
    
    console.log('✅ Build completed successfully!');
    console.log(`📁 Build output: ${buildDir}`);
    console.log('🚀 Run: node dist/server.js to start production server');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

build();