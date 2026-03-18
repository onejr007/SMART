/**
 * Physics Optimizer (Rekomendasi #36, #37, #40)
 * Broadphase optimization, collision filtering, dan sleeping bodies
 */

import * as CANNON from 'cannon-es';

export interface CollisionGroup {
  name: string;
  group: number;
  mask: number;
}

export class PhysicsOptimizer {
  // Collision groups (bit flags)
  public static readonly COLLISION_GROUPS = {
    DEFAULT: 1 << 0,      // 1
    PLAYER: 1 << 1,       // 2
    ENEMY: 1 << 2,        // 4
    WORLD: 1 << 3,        // 8
    PROJECTILE: 1 << 4,   // 16
    TRIGGER: 1 << 5,      // 32
  };
  
  /**
   * Setup optimal broadphase based on scene size
   */
  public static setupBroadphase(world: CANNON.World, sceneSize: 'small' | 'medium' | 'large'): void {
    switch (sceneSize) {
      case 'small':
        world.broadphase = new CANNON.NaiveBroadphase();
        break;
      case 'medium':
        world.broadphase = new CANNON.SAPBroadphase(world);
        break;
      case 'large':
        // Grid broadphase untuk scene besar
        const gridBroadphase = new CANNON.GridBroadphase();
        world.broadphase = gridBroadphase;
        break;
    }
  }
  
  /**
   * Enable sleeping untuk body yang tidak bergerak
   */
  public static enableSleeping(world: CANNON.World): void {
    world.allowSleep = true;
    world.bodies.forEach(body => {
      body.allowSleep = true;
      body.sleepSpeedLimit = 0.1; // m/s
      body.sleepTimeLimit = 1; // seconds
    });
  }
  
  /**
   * Setup collision filter untuk body
   */
  public static setCollisionFilter(
    body: CANNON.Body,
    group: number,
    mask: number
  ): void {
    body.collisionFilterGroup = group;
    body.collisionFilterMask = mask;
  }
  
  /**
   * Preset collision filters
   */
  public static applyPresetFilter(body: CANNON.Body, preset: keyof typeof PhysicsOptimizer.COLLISION_GROUPS): void {
    const groups = PhysicsOptimizer.COLLISION_GROUPS;
    
    switch (preset) {
      case 'PLAYER':
        // Player collides with world, enemies, and triggers
        this.setCollisionFilter(
          body,
          groups.PLAYER,
          groups.WORLD | groups.ENEMY | groups.TRIGGER
        );
        break;
        
      case 'ENEMY':
        // Enemy collides with world, player, and projectiles
        this.setCollisionFilter(
          body,
          groups.ENEMY,
          groups.WORLD | groups.PLAYER | groups.PROJECTILE
        );
        break;
        
      case 'WORLD':
        // World collides with everything except triggers
        this.setCollisionFilter(
          body,
          groups.WORLD,
          groups.DEFAULT | groups.PLAYER | groups.ENEMY | groups.PROJECTILE
        );
        break;
        
      case 'PROJECTILE':
        // Projectile collides with world and enemies
        this.setCollisionFilter(
          body,
          groups.PROJECTILE,
          groups.WORLD | groups.ENEMY
        );
        break;
        
      case 'TRIGGER':
        // Trigger only collides with player
        this.setCollisionFilter(
          body,
          groups.TRIGGER,
          groups.PLAYER
        );
        break;
        
      default:
        // Default collides with everything
        this.setCollisionFilter(
          body,
          groups.DEFAULT,
          0xFFFFFFFF
        );
    }
  }
  
  /**
   * Optimize solver iterations based on quality setting
   */
  public static optimizeSolver(world: CANNON.World, quality: 'low' | 'medium' | 'high'): void {
    const solver = world.solver as CANNON.GSSolver;
    
    switch (quality) {
      case 'low':
        solver.iterations = 5;
        solver.tolerance = 0.1;
        break;
      case 'medium':
        solver.iterations = 10;
        solver.tolerance = 0.01;
        break;
      case 'high':
        solver.iterations = 20;
        solver.tolerance = 0.001;
        break;
    }
  }
  
  /**
   * Create static body (mass = 0) untuk environment
   */
  public static createStaticBody(shape: CANNON.Shape, position: CANNON.Vec3): CANNON.Body {
    const body = new CANNON.Body({
      mass: 0,
      position,
      shape,
    });
    
    this.applyPresetFilter(body, 'WORLD');
    return body;
  }
  
  /**
   * Create dynamic body dengan sleeping enabled
   */
  public static createDynamicBody(
    shape: CANNON.Shape,
    position: CANNON.Vec3,
    mass: number = 1
  ): CANNON.Body {
    const body = new CANNON.Body({
      mass,
      position,
      shape,
      allowSleep: true,
      sleepSpeedLimit: 0.1,
      sleepTimeLimit: 1,
    });
    
    return body;
  }
}
