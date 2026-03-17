#!/usr/bin/env node
// Documentation Generation Script

import AIContextManager from '../ai/context-manager.js';
import AIDocGenerator from '../ai/doc-generator.js';

async function generateDocs() {
  console.log('📚 Updating README.md from AI context...\n');
  
  try {
    const aiContext = new AIContextManager();
    await aiContext.ensureReady();
    const docGenerator = new AIDocGenerator(aiContext);
    
    const generatedDocs = await docGenerator.generateAllDocs();
    
    console.log('✅ Documentation generated successfully!\n');
    console.log('Generated files:');
    generatedDocs.forEach(doc => {
      console.log(`  📄 ${doc}`);
    });
    
    console.log('\n💡 Tip: Open README.md to view the latest snapshot');
    
  } catch (error) {
    console.error('❌ Documentation generation failed:', error.message);
    process.exit(1);
  }
}

generateDocs();
