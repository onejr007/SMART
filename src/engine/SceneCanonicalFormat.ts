// 45. Format scene kanonik
export interface CanonicalScene {
  version: string;
  checksum: string;
  metadata: {
    created: number;
    modified: number;
    author: string;
  };
  entities: CanonicalEntity[];
}

export interface CanonicalEntity {
  id: string;
  type: string;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  };
  components: Record<string, any>;
}

export class SceneCanonicalFormat {
  private version = '1.0.0';

  serialize(scene: any): CanonicalScene {
    const entities = this.sortEntities(scene.entities);
    
    const canonical: Omit<CanonicalScene, 'checksum'> & { checksum: string } = {
      version: this.version,
      checksum: '',
      metadata: {
        created: scene.created || Date.now(),
        modified: Date.now(),
        author: scene.author || 'unknown'
      },
      entities
    };

    canonical.checksum = this.calculateChecksum(canonical as CanonicalScene);
    return canonical as CanonicalScene;
  }

  deserialize(canonical: CanonicalScene): any {
    if (canonical.version !== this.version) {
      throw new Error(`Unsupported version: ${canonical.version}`);
    }

    const tempCanonical: Omit<CanonicalScene, 'checksum'> & { checksum: string } = { ...canonical, checksum: '' };
    const checksum = this.calculateChecksum(tempCanonical as CanonicalScene);
    if (checksum !== canonical.checksum) {
      throw new Error('Checksum mismatch');
    }

    return {
      ...canonical.metadata,
      entities: canonical.entities
    };
  }

  private sortEntities(entities: any[]): CanonicalEntity[] {
    return entities
      .map(e => this.normalizeEntity(e))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  private normalizeEntity(entity: any): CanonicalEntity {
    const components = { ...entity.components };
    const sortedComponents: Record<string, any> = {};
    
    Object.keys(components).sort().forEach(key => {
      sortedComponents[key] = components[key];
    });

    return {
      id: entity.id,
      type: entity.type,
      transform: entity.transform,
      components: sortedComponents
    };
  }

  private calculateChecksum(scene: Omit<CanonicalScene, 'checksum'>): string {
    const json = JSON.stringify(scene);
    let hash = 0;
    
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return hash.toString(16);
  }

  verify(canonical: CanonicalScene): boolean {
    const tempCanonical: Omit<CanonicalScene, 'checksum'> & { checksum: string } = { ...canonical, checksum: '' };
    const checksum = this.calculateChecksum(tempCanonical as CanonicalScene);
    return checksum === canonical.checksum;
  }
}
