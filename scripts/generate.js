#!/usr/bin/env node
/**
 * @file scripts/generate.js
 * @description CLI tool for AI Component Generation. Uses the shared AI Template Engine.
 * @usage node scripts/generate.js <type> <name> [options]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import AITemplateEngine from '../ai/template-engine.js';
import AIContextManager from '../ai/context-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Initialize AI Core
const aiContext = new AIContextManager();
const templateEngine = new AITemplateEngine(aiContext);

async function main() {
  await aiContext.ensureReady();
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: node scripts/generate.js <type> <name> [options]');
    console.error('   Types: component, page');
    process.exit(1);
  }
  
  const [type, name, ...rest] = args;
  
  // Parse options from rest args (e.g. --theme=dark)
  const options = rest.reduce((acc, arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    acc[key] = value || true;
    return acc;
  }, {});
  
  // Add metadata for AI tracking
  options.aiMetadata = {
    prompt: `CLI Generation: ${type} ${name}`,
    generatedBy: 'CLI Tool',
    timestamp: new Date().toISOString()
  };

  console.log(`🤖 AI Agent: Generating ${type} "${name}"...`);
  
  try {
    let content = '';
    let outputPath = '';
    
    if (type === 'component') {
      const componentType = options.subType || 'ui';
      content = templateEngine.generateComponent(name, componentType, options);
      outputPath = path.join(rootDir, 'src', 'components', `${name}.js`);
      
      aiContext.addComponent(name, {
        type: componentType,
        path: outputPath,
        ...options.aiMetadata
      });
      
    } else if (type === 'page') {
      content = templateEngine.generatePage(name, options.layout || 'default', options);
      outputPath = path.join(rootDir, 'src', 'pages', `${name}.html`);
      
      aiContext.addPage(name, {
        type: 'page',
        layout: options.layout || 'default',
        path: outputPath,
        ...options.aiMetadata
      });
    } else {
      throw new Error(`Unknown type: ${type}`);
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    
    // Write file
    await fs.writeFile(outputPath, content);
    
    console.log(`✅ Success! Generated at: ${outputPath}`);
    console.log(`📝 AI Context updated.`);
    
  } catch (error) {
    console.error(`❌ Generation Failed: ${error.message}`);
    process.exit(1);
  }
}

main();
