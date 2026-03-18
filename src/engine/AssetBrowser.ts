/**
 * Asset Browser System
 * Panel asset (primitives, prefabs, decals, audio) + drag-drop ke viewport
 */

interface AssetItem {
  id: string;
  name: string;
  type: "primitive" | "prefab" | "texture" | "audio" | "script" | "material";
  category: string;
  thumbnail: string;
  description: string;
  tags: string[];
  size: number;
  author?: string;
  rating?: number;
  downloadCount?: number;
  createdAt: number;
  metadata: any;
}

interface AssetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: AssetItem[];
}

interface DragData {
  assetId: string;
  assetType: string;
  position: { x: number; y: number };
  metadata: any;
}

import DOMPurify from "dompurify";

export class AssetBrowser {
  private categories = new Map<string, AssetCategory>();
  private filteredItems: AssetItem[] = [];
  private searchQuery = "";
  private selectedCategory = "all";
  private sortBy: "name" | "date" | "rating" | "downloads" = "name";
  private sortOrder: "asc" | "desc" = "asc";

  private onAssetSelected?: (asset: AssetItem) => void;
  private onAssetDragStart?: (asset: AssetItem, event: DragEvent) => void;
  private onAssetDrop?: (
    asset: AssetItem,
    position: { x: number; y: number; z: number },
  ) => void;

  constructor() {
    this.initializeDefaultCategories();
    this.initializeDefaultAssets();
  }

  /**
   * Initialize default asset categories
   */
  private initializeDefaultCategories(): void {
    const defaultCategories: AssetCategory[] = [
      {
        id: "primitives",
        name: "Primitives",
        icon: "🔷",
        color: "#3498db",
        items: [],
      },
      {
        id: "prefabs",
        name: "Prefabs",
        icon: "🏗️",
        color: "#e74c3c",
        items: [],
      },
      {
        id: "textures",
        name: "Textures",
        icon: "🎨",
        color: "#9b59b6",
        items: [],
      },
      {
        id: "materials",
        name: "Materials",
        icon: "✨",
        color: "#f39c12",
        items: [],
      },
      {
        id: "audio",
        name: "Audio",
        icon: "🔊",
        color: "#2ecc71",
        items: [],
      },
      {
        id: "scripts",
        name: "Scripts",
        icon: "📜",
        color: "#34495e",
        items: [],
      },
    ];

    defaultCategories.forEach((category) => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Initialize default assets
   */
  private initializeDefaultAssets(): void {
    const primitives: AssetItem[] = [
      {
        id: "cube",
        name: "Cube",
        type: "primitive",
        category: "primitives",
        thumbnail:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMTYiIHk9IjE2IiB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiMzNDk4ZGIiLz4KPC9zdmc+",
        description: "Basic cube primitive",
        tags: ["basic", "geometry", "3d"],
        size: 1024,
        createdAt: Date.now(),
        metadata: { geometry: "box", size: [1, 1, 1] },
      },
      {
        id: "sphere",
        name: "Sphere",
        type: "primitive",
        category: "primitives",
        thumbnail:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMTYiIGZpbGw9IiMzNDk4ZGIiLz4KPC9zdmc+",
        description: "Basic sphere primitive",
        tags: ["basic", "geometry", "3d", "round"],
        size: 2048,
        createdAt: Date.now(),
        metadata: { geometry: "sphere", radius: 0.5, segments: 32 },
      },
      {
        id: "cylinder",
        name: "Cylinder",
        type: "primitive",
        category: "primitives",
        thumbnail:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjAiIHk9IjEyIiB3aWR0aD0iMjQiIGhlaWdodD0iNDAiIHJ4PSIxMiIgZmlsbD0iIzM0OThkYiIvPgo8L3N2Zz4=",
        description: "Basic cylinder primitive",
        tags: ["basic", "geometry", "3d", "round"],
        size: 1536,
        createdAt: Date.now(),
        metadata: {
          geometry: "cylinder",
          radiusTop: 0.5,
          radiusBottom: 0.5,
          height: 1,
        },
      },
      {
        id: "plane",
        name: "Plane",
        type: "primitive",
        category: "primitives",
        thumbnail:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMTIiIHk9IjI4IiB3aWR0aD0iNDAiIGhlaWdodD0iOCIgZmlsbD0iIzM0OThkYiIvPgo8L3N2Zz4=",
        description: "Basic plane primitive",
        tags: ["basic", "geometry", "2d", "flat"],
        size: 512,
        createdAt: Date.now(),
        metadata: { geometry: "plane", width: 1, height: 1 },
      },
    ];

    const prefabs: AssetItem[] = [
      {
        id: "player-spawn",
        name: "Player Spawn",
        type: "prefab",
        category: "prefabs",
        thumbnail:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMTYiIGZpbGw9IiMyZWNjNzEiLz4KPHBhdGggZD0iTTMyIDIwVjQ0TTIwIDMySDQ0IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjMiLz4KPC9zdmc+",
        description: "Player spawn point",
        tags: ["spawn", "player", "game"],
        size: 4096,
        createdAt: Date.now(),
        metadata: { type: "spawn", playerType: "default" },
      },
      {
        id: "checkpoint",
        name: "Checkpoint",
        type: "prefab",
        category: "prefabs",
        thumbnail:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMjgiIHk9IjEyIiB3aWR0aD0iOCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2Y5OWMxMiIvPgo8cG9seWdvbiBwb2ludHM9IjI4LDEyIDQ0LDIwIDI4LDI4IiBmaWxsPSIjZTc0YzNjIi8+Cjwvc3ZnPg==",
        description: "Game checkpoint flag",
        tags: ["checkpoint", "flag", "game"],
        size: 3072,
        createdAt: Date.now(),
        metadata: { type: "checkpoint", autoSave: true },
      },
    ];

    // Add assets to categories
    this.addAssetsToCategory("primitives", primitives);
    this.addAssetsToCategory("prefabs", prefabs);

    this.updateFilteredItems();
  }

  /**
   * Add assets to category
   */
  private addAssetsToCategory(categoryId: string, assets: AssetItem[]): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.items.push(...assets);
    }
  }

  /**
   * Search assets
   */
  search(query: string): void {
    this.searchQuery = query.toLowerCase();
    this.updateFilteredItems();
  }

  /**
   * Filter by category
   */
  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.updateFilteredItems();
  }

  /**
   * Sort assets
   */
  sort(
    by: "name" | "date" | "rating" | "downloads",
    order: "asc" | "desc" = "asc",
  ): void {
    this.sortBy = by;
    this.sortOrder = order;
    this.updateFilteredItems();
  }

  /**
   * Update filtered items
   */
  private updateFilteredItems(): void {
    let items: AssetItem[] = [];

    // Collect items from selected category
    if (this.selectedCategory === "all") {
      for (const category of this.categories.values()) {
        items.push(...category.items);
      }
    } else {
      const category = this.categories.get(this.selectedCategory);
      if (category) {
        items = [...category.items];
      }
    }

    // Apply search filter
    if (this.searchQuery) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(this.searchQuery) ||
          item.description.toLowerCase().includes(this.searchQuery) ||
          item.tags.some((tag) => tag.toLowerCase().includes(this.searchQuery)),
      );
    }

    // Apply sorting
    items.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (this.sortBy) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "date":
          aVal = a.createdAt;
          bVal = b.createdAt;
          break;
        case "rating":
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case "downloads":
          aVal = a.downloadCount || 0;
          bVal = b.downloadCount || 0;
          break;
        default:
          return 0;
      }

      const order = this.sortOrder === "desc" ? -1 : 1;

      if (typeof aVal === "string") {
        return aVal.localeCompare(bVal) * order;
      }

      return (aVal - bVal) * order;
    });

    this.filteredItems = items;
  }

  /**
   * Get filtered items
   */
  getFilteredItems(): AssetItem[] {
    return this.filteredItems;
  }

  /**
   * Get categories
   */
  getCategories(): AssetCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get asset by ID
   */
  getAsset(id: string): AssetItem | null {
    for (const category of this.categories.values()) {
      const asset = category.items.find((item) => item.id === id);
      if (asset) return asset;
    }
    return null;
  }

  /**
   * Add custom asset
   */
  addAsset(asset: AssetItem): void {
    const category = this.categories.get(asset.category);
    if (category) {
      category.items.push(asset);
      this.updateFilteredItems();
    }
  }

  /**
   * Remove asset
   */
  removeAsset(id: string): boolean {
    for (const category of this.categories.values()) {
      const index = category.items.findIndex((item) => item.id === id);
      if (index !== -1) {
        category.items.splice(index, 1);
        this.updateFilteredItems();
        return true;
      }
    }
    return false;
  }

  /**
   * Setup drag and drop
   */
  setupDragAndDrop(container: HTMLElement, viewport: HTMLElement): void {
    // Make asset items draggable
    container.addEventListener("dragstart", (event) => {
      const target = event.target as HTMLElement;
      const assetId = target.dataset.assetId;

      if (assetId) {
        const asset = this.getAsset(assetId);
        if (asset) {
          const dragData: DragData = {
            assetId: asset.id,
            assetType: asset.type,
            position: { x: event.clientX, y: event.clientY },
            metadata: asset.metadata,
          };

          event.dataTransfer?.setData(
            "application/json",
            JSON.stringify(dragData),
          );
          this.onAssetDragStart?.(asset, event);
        }
      }
    });

    // Handle drop on viewport
    viewport.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    viewport.addEventListener("drop", (event) => {
      event.preventDefault();

      const data = event.dataTransfer?.getData("application/json");
      if (data) {
        const dragData: DragData = JSON.parse(data);
        const asset = this.getAsset(dragData.assetId);

        if (asset) {
          // Convert screen coordinates to world position
          const rect = viewport.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          this.onAssetDrop?.(asset, { x, y, z: 0 });
        }
      }
    });
  }

  /**
   * Create asset thumbnail
   */
  createThumbnail(asset: AssetItem): HTMLElement {
    const thumbnail = document.createElement("div");
    thumbnail.className = "asset-thumbnail";
    thumbnail.draggable = true;
    thumbnail.dataset.assetId = asset.id;

    const safeThumbnail = DOMPurify.sanitize(asset.thumbnail, {
      ALLOWED_TAGS: [],
    }).replace(/"/g, "&quot;");
    const safeName = DOMPurify.sanitize(asset.name, {
      ALLOWED_TAGS: [],
    }).replace(/"/g, "&quot;");
    const safeType = DOMPurify.sanitize(asset.type, {
      ALLOWED_TAGS: [],
    }).replace(/"/g, "&quot;");

    thumbnail.innerHTML = `
      <img src="${safeThumbnail}" alt="${safeName}" />
      <div class="asset-info">
        <div class="asset-name">${safeName}</div>
        <div class="asset-type">${safeType}</div>
      </div>
    `;

    thumbnail.addEventListener("click", () => {
      this.onAssetSelected?.(asset);
    });

    return thumbnail;
  }

  /**
   * Set event handlers
   */
  setOnAssetSelected(handler: (asset: AssetItem) => void): void {
    this.onAssetSelected = handler;
  }

  setOnAssetDragStart(
    handler: (asset: AssetItem, event: DragEvent) => void,
  ): void {
    this.onAssetDragStart = handler;
  }

  setOnAssetDrop(
    handler: (
      asset: AssetItem,
      position: { x: number; y: number; z: number },
    ) => void,
  ): void {
    this.onAssetDrop = handler;
  }

  /**
   * Get current filter state
   */
  getFilterState() {
    return {
      searchQuery: this.searchQuery,
      selectedCategory: this.selectedCategory,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      resultCount: this.filteredItems.length,
    };
  }
}
