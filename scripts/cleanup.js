#!/usr/bin/env node
/**
 * @file scripts/cleanup.js
 * @description Cleanup tool untuk reset framework state
 */

import fs from 'fs/promises';
import path from 'path';

async function cleanup() {
  console.log('🧹 AI Framework Cleanup Tool\n');

  const tasks = [
    {
      name: 'Clear AI Context',
      path: 'ai/context.json',
      action: async () => {
        await fs.writeFile('ai/context.json', JSON.stringify({
          project: {
            name: 'AI Web Framework',
            version: '2.0.0',
            description: 'AI-friendly web development framework'
          },
          components: {},
          pages: {},
          patterns: {},
          history: [],
          preferences: {
            naming: 'PascalCase',
            cssFramework: 'custom',
            jsFramework: 'vanilla',
            aiAssistance: 'enabled'
          }
        }, null, 2));
      }
    },
    {
      name: 'Clear Version History',
      path: '.ai-versions',
      action: async () => {
        try {
          await fs.rm('.ai-versions', { recursive: true, force: true });
        } catch {}
      }
    },
    {
      name: 'Clear Reports',
      path: 'reports',
      action: async () => {
        try {
          await fs.rm('reports', { recursive: true, force: true });
        } catch {}
      }
    },
    {
      name: 'Clear Test Components',
      path: 'src/components',
      action: async () => {
        try {
          const files = await fs.readdir('src/components');
          for (const file of files) {
            if (file !== '.gitkeep' && file !== 'Button.js') {
              await fs.unlink(path.join('src/components', file));
            }
          }
        } catch {}
      }
    },
    {
      name: 'Clear Test Pages',
      path: 'src/pages',
      action: async () => {
        try {
          const files = await fs.readdir('src/pages');
          for (const file of files) {
            if (file !== '.gitkeep') {
              await fs.unlink(path.join('src/pages', file));
            }
          }
        } catch {}
      }
    }
  ];

  for (const task of tasks) {
    try {
      console.log(`🔄 ${task.name}...`);
      await task.action();
      console.log(`✅ ${task.name} - Done`);
    } catch (error) {
      console.log(`⚠️  ${task.name} - ${error.message}`);
    }
  }

  console.log('\n✨ Cleanup complete! Framework reset to initial state.\n');
}

cleanup().catch(console.error);
