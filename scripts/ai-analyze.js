#!/usr/bin/env node
// AI Analysis Script
// Analyzes project patterns and provides insights

import AIContextManager from '../ai/context-manager.js';
import fs from 'fs/promises';

async function analyzeProject() {
  console.log('🤖 Analyzing AI Web Framework Project...\n');
  
  const aiContext = new AIContextManager();
  const analytics = aiContext.getAnalytics();
  const context = aiContext.exportForAI();
  
  // Project Summary
  console.log('📊 PROJECT SUMMARY');
  console.log('==================');
  console.log(`Components: ${analytics.summary.components}`);
  console.log(`Pages: ${analytics.summary.pages}`);
  console.log(`Patterns Learned: ${analytics.summary.patterns}`);
  console.log(`History Items: ${analytics.summary.historyItems}\n`);
  
  // Component Analysis
  if (analytics.summary.components > 0) {
    console.log('🧩 COMPONENT ANALYSIS');
    console.log('=====================');
    
    Object.entries(analytics.componentTypes).forEach(([type, count]) => {
      const percentage = ((count / analytics.summary.components) * 100).toFixed(1);
      console.log(`${type.padEnd(12)} : ${count} (${percentage}%)`);
    });
    console.log();
  }
  
  // Pattern Analysis
  console.log('🔍 PATTERN ANALYSIS');
  console.log('===================');
  
  const patterns = context.patterns;
  if (Object.keys(patterns).length > 0) {
    Object.entries(patterns).forEach(([type, patternList]) => {
      const successful = patternList.filter(p => p.success).length;
      const total = patternList.length;
      const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : 0;
      
      console.log(`${type.padEnd(20)} : ${successful}/${total} (${successRate}% success)`);
    });
  } else {
    console.log('No patterns learned yet.');
  }
  console.log();
  
  // Recent Activity
  console.log('📈 RECENT ACTIVITY');
  console.log('==================');
  
  const recentActivity = analytics.recentActivity.slice(0, 10);
  if (recentActivity.length > 0) {
    recentActivity.forEach(activity => {
      const time = new Date(activity.timestamp).toLocaleTimeString();
      console.log(`${time} - ${activity.action}: ${JSON.stringify(activity.data).substring(0, 50)}...`);
    });
  } else {
    console.log('No recent activity.');
  }
  console.log();
  
  // AI Recommendations
  console.log('💡 AI RECOMMENDATIONS');
  console.log('=====================');
  
  const recommendations = generateRecommendations(analytics, context);
  recommendations.forEach(rec => {
    console.log(`• ${rec}`);
  });
  
  // Save analysis report
  const report = {
    timestamp: new Date().toISOString(),
    analytics,
    context: context,
    recommendations
  };
  
  await fs.mkdir('reports', { recursive: true });
  await fs.writeFile(
    `reports/ai-analysis-${new Date().toISOString().split('T')[0]}.json`,
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n✅ Analysis complete! Report saved to reports/ directory.');
}

function generateRecommendations(analytics, context) {
  const recommendations = [];
  
  // Component recommendations
  if (analytics.summary.components === 0) {
    recommendations.push('Start by creating your first component using the dashboard or API');
  } else if (analytics.summary.components < 5) {
    recommendations.push('Consider creating more components to build a comprehensive library');
  }
  
  // Pattern recommendations
  const patternTypes = Object.keys(context.patterns);
  if (patternTypes.length === 0) {
    recommendations.push('No patterns learned yet - create more components to start learning');
  }
  
  // Type diversity recommendations
  const componentTypes = Object.keys(analytics.componentTypes);
  if (componentTypes.length === 1) {
    recommendations.push('Consider creating components of different types (ui, data, form, etc.)');
  }
  
  // Usage recommendations
  if (analytics.summary.historyItems < 10) {
    recommendations.push('Use the framework more to improve AI pattern learning');
  }
  
  // Performance recommendations
  if (analytics.summary.components > 20) {
    recommendations.push('Consider organizing components into categories or modules');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Great job! Your AI framework is well-utilized and learning effectively');
  }
  
  return recommendations;
}

// Run analysis
analyzeProject().catch(console.error);