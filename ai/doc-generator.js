// AI Documentation Generator
// Automatically generates documentation for AI-created components

import fs from 'fs/promises';

class AIDocGenerator {
  constructor(contextManager) {
    this.context = contextManager;
    this.readmePath = 'README.md';
    this.startMarker = '<!-- AI_DOCS_START -->';
    this.endMarker = '<!-- AI_DOCS_END -->';
  }

  async generateProjectDocs() {
    const analytics = this.context.getAnalytics();
    const components = this.context.getAllComponents();

    const aiSection = `${this.startMarker}
## AI Snapshot

Last generated: ${new Date().toISOString()}

- Components: ${analytics.summary.components}
- Pages: ${analytics.summary.pages}
- Pattern groups: ${analytics.summary.patterns}

### Component Types
${Object.entries(analytics.componentTypes)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n') || '- belum ada'}

### Registered Components
${Object.keys(components)
  .map((name) => `- ${name}`)
  .join('\n') || '- belum ada'}
${this.endMarker}`;

    const currentReadme = await fs.readFile(this.readmePath, 'utf8');
    const startIndex = currentReadme.indexOf(this.startMarker);
    const endIndex = currentReadme.indexOf(this.endMarker);

    let nextReadme = `${currentReadme}\n\n${aiSection}\n`;
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const before = currentReadme.slice(0, startIndex).trimEnd();
      const after = currentReadme.slice(endIndex + this.endMarker.length).trimStart();
      nextReadme = `${before}\n\n${aiSection}\n\n${after}`.trim() + '\n';
    }

    await fs.writeFile(this.readmePath, nextReadme, 'utf8');
    return this.readmePath;
  }

  async generateAllDocs() {
    const readme = await this.generateProjectDocs();
    return [readme];
  }
}

export default AIDocGenerator;
