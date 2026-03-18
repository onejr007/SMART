// 5. World streaming berbasis cell/chunk
export interface Cell {
  x: number;
  z: number;
  entities: Set<string>;
  loaded: boolean;
}

export class WorldStreaming {
  private cells: Map<string, Cell> = new Map();
  private readonly cellSize: number;
  private activeRadius: number;

  constructor(cellSize = 100, activeRadius = 3) {
    this.cellSize = cellSize;
    this.activeRadius = activeRadius;
  }

  private getCellKey(x: number, z: number): string {
    return `${x},${z}`;
  }

  private worldToCell(x: number, z: number): [number, number] {
    return [
      Math.floor(x / this.cellSize),
      Math.floor(z / this.cellSize)
    ];
  }

  updatePlayerPosition(x: number, z: number): { load: Cell[]; unload: Cell[] } {
    const [centerX, centerZ] = this.worldToCell(x, z);
    const toLoad: Cell[] = [];
    const toUnload: Cell[] = [];

    // Mark cells to load
    for (let dx = -this.activeRadius; dx <= this.activeRadius; dx++) {
      for (let dz = -this.activeRadius; dz <= this.activeRadius; dz++) {
        const cellX = centerX + dx;
        const cellZ = centerZ + dz;
        const key = this.getCellKey(cellX, cellZ);
        
        if (!this.cells.has(key)) {
          const cell: Cell = { x: cellX, z: cellZ, entities: new Set(), loaded: false };
          this.cells.set(key, cell);
          toLoad.push(cell);
        }
      }
    }

    // Mark cells to unload
    for (const [key, cell] of this.cells) {
      const dx = Math.abs(cell.x - centerX);
      const dz = Math.abs(cell.z - centerZ);
      if (dx > this.activeRadius || dz > this.activeRadius) {
        if (cell.loaded) {
          toUnload.push(cell);
        }
        this.cells.delete(key);
      }
    }

    return { load: toLoad, unload: toUnload };
  }

  markCellLoaded(x: number, z: number): void {
    const key = this.getCellKey(x, z);
    const cell = this.cells.get(key);
    if (cell) cell.loaded = true;
  }
}
