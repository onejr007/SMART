# AI Agent Contributing Guide for SMART Metaverse Engine

Welcome, AI Agent! To ensure your code generation is compatible with our v2.1 architecture, please follow these technical specifications.

## 🏗️ Architecture Overview

The engine uses a **Component-Based Architecture** with **Dependency Injection**.

- **Core**: [Core.ts](src/engine/Core.ts) - The heart of the engine.
- **Entity System**: [Entity.ts](src/engine/Entity.ts) - Entities are containers for Components.
- **Component System**: [Component.ts](src/engine/Component.ts) - Base class for all logic.
- **Plugin System**: [PluginSystem.ts](src/engine/PluginSystem.ts) - For modular global features.
- **Service Container**: [ServiceContainer.ts](src/engine/ServiceContainer.ts) - For accessing global services (Physics, Renderer, etc.).

## 🛠️ How to Generate Logic

### 1. Creating a New Component
Always extend the `Component` base class.

```typescript
import { Component } from '../Component';

export class MyNewComponent extends Component {
    constructor() {
        super('MyUniqueName');
    }

    public update(delta: number): void {
        // Your logic here
    }
}
```

### 2. Accessing Global Services
Use the `container` from `ServiceContainer.ts`.

```typescript
import { container } from './ServiceContainer';
const physics = container.get<CANNON.World>('Physics');
```

### 3. Communication
Use the `eventBus` for decoupled communication between modules.

```typescript
import { eventBus } from './EventBus';
eventBus.emit('my-event', data);
```

## 🎮 Game Data & Persistence
- Player stats: Use `PlayerStats` component.
- Saving: Use `persistence` from `PersistenceManager.ts`.
- Leaderboards: Use `leaderboards` from `LeaderboardManager.ts`.

## ⚡ Performance Rules
- Use `AssetManager` for loading 3D models (automatic caching).
- Physics is expensive; prefer `TriggerVolume` for area detection instead of complex collision if possible.
- Use `perfMonitor` to track your new features' impact.

## 🛡️ Security
- Never expose API keys.
- All code generated via `EvolveCode` must follow these patterns to be considered "Safe-Evolved".

---
*Happy Coding, Agent!*
