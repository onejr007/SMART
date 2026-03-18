/**
 * SceneExporter.ts
 * Export/Import Scene as JSON (Quick Win #5 & #6)
 * Download/Upload scene data untuk backup
 */

export class SceneExporter {
  public static exportScene(sceneData: any, filename: string = 'scene.json'): void {
    const json = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log(`✅ Scene exported: ${filename}`);
  }

  public static importScene(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const json = e.target?.result as string;
          const sceneData = JSON.parse(json);
          console.log(`✅ Scene imported: ${file.name}`);
          resolve(sceneData);
        } catch (error) {
          console.error('Failed to parse scene file:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  public static createImportButton(onImport: (sceneData: any) => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const sceneData = await SceneExporter.importScene(file);
          onImport(sceneData);
        } catch (error) {
          alert('Failed to import scene');
        }
      }
    });
    
    document.body.appendChild(input);
    return input;
  }
}
