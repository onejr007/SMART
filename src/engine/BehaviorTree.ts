/**
 * BehaviorTree.ts
 * Behavior Tree System (#29)
 * Visual behavior tree editor
 * Reusable behavior nodes library
 */

export enum NodeStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running'
}

export interface BehaviorContext {
  entity?: any;
  blackboard: Map<string, any>;
  deltaTime: number;
}

export abstract class BehaviorNode {
  public name: string;
  protected children: BehaviorNode[] = [];

  constructor(name: string) {
    this.name = name;
  }

  public abstract tick(context: BehaviorContext): NodeStatus;

  public addChild(child: BehaviorNode): void {
    this.children.push(child);
  }

  public reset(): void {
    // Override in subclasses if needed
  }
}

// Composite Nodes
export class SequenceNode extends BehaviorNode {
  private currentIndex: number = 0;

  public tick(context: BehaviorContext): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].tick(context);
      
      if (status === NodeStatus.FAILURE) {
        this.currentIndex = 0;
        return NodeStatus.FAILURE;
      }
      
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }
      
      this.currentIndex++;
    }
    
    this.currentIndex = 0;
    return NodeStatus.SUCCESS;
  }

  public reset(): void {
    this.currentIndex = 0;
    this.children.forEach(child => child.reset());
  }
}

export class SelectorNode extends BehaviorNode {
  private currentIndex: number = 0;

  public tick(context: BehaviorContext): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex].tick(context);
      
      if (status === NodeStatus.SUCCESS) {
        this.currentIndex = 0;
        return NodeStatus.SUCCESS;
      }
      
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }
      
      this.currentIndex++;
    }
    
    this.currentIndex = 0;
    return NodeStatus.FAILURE;
  }

  public reset(): void {
    this.currentIndex = 0;
    this.children.forEach(child => child.reset());
  }
}

export class ParallelNode extends BehaviorNode {
  private successThreshold: number;

  constructor(name: string, successThreshold: number = 1) {
    super(name);
    this.successThreshold = successThreshold;
  }

  public tick(context: BehaviorContext): NodeStatus {
    let successCount = 0;
    let runningCount = 0;

    for (const child of this.children) {
      const status = child.tick(context);
      
      if (status === NodeStatus.SUCCESS) {
        successCount++;
      } else if (status === NodeStatus.RUNNING) {
        runningCount++;
      }
    }

    if (successCount >= this.successThreshold) {
      return NodeStatus.SUCCESS;
    }

    if (runningCount > 0) {
      return NodeStatus.RUNNING;
    }

    return NodeStatus.FAILURE;
  }
}

// Decorator Nodes
export class InverterNode extends BehaviorNode {
  public tick(context: BehaviorContext): NodeStatus {
    if (this.children.length === 0) return NodeStatus.FAILURE;
    
    const status = this.children[0].tick(context);
    
    if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
    if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
    return NodeStatus.RUNNING;
  }
}

export class RepeaterNode extends BehaviorNode {
  private maxRepeats: number;
  private currentRepeats: number = 0;

  constructor(name: string, maxRepeats: number = -1) {
    super(name);
    this.maxRepeats = maxRepeats;
  }

  public tick(context: BehaviorContext): NodeStatus {
    if (this.children.length === 0) return NodeStatus.FAILURE;

    while (this.maxRepeats === -1 || this.currentRepeats < this.maxRepeats) {
      const status = this.children[0].tick(context);
      
      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }
      
      if (status === NodeStatus.FAILURE) {
        this.currentRepeats = 0;
        return NodeStatus.FAILURE;
      }
      
      this.currentRepeats++;
    }

    this.currentRepeats = 0;
    return NodeStatus.SUCCESS;
  }

  public reset(): void {
    this.currentRepeats = 0;
    super.reset();
  }
}

// Leaf Nodes (Actions & Conditions)
export class ActionNode extends BehaviorNode {
  private action: (context: BehaviorContext) => NodeStatus;

  constructor(name: string, action: (context: BehaviorContext) => NodeStatus) {
    super(name);
    this.action = action;
  }

  public tick(context: BehaviorContext): NodeStatus {
    return this.action(context);
  }
}

export class ConditionNode extends BehaviorNode {
  private condition: (context: BehaviorContext) => boolean;

  constructor(name: string, condition: (context: BehaviorContext) => boolean) {
    super(name);
    this.condition = condition;
  }

  public tick(context: BehaviorContext): NodeStatus {
    return this.condition(context) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

// Behavior Tree
export class BehaviorTree {
  private root: BehaviorNode;
  private context: BehaviorContext;

  constructor(root: BehaviorNode) {
    this.root = root;
    this.context = {
      blackboard: new Map(),
      deltaTime: 0
    };
  }

  public tick(deltaTime: number, entity?: any): NodeStatus {
    this.context.deltaTime = deltaTime;
    this.context.entity = entity;
    return this.root.tick(this.context);
  }

  public setBlackboardValue(key: string, value: any): void {
    this.context.blackboard.set(key, value);
  }

  public getBlackboardValue(key: string): any {
    return this.context.blackboard.get(key);
  }

  public reset(): void {
    this.root.reset();
    this.context.blackboard.clear();
  }
}

// Common behavior patterns
export class BehaviorLibrary {
  public static createPatrolBehavior(waypoints: any[]): BehaviorNode {
    const sequence = new SequenceNode('Patrol');
    
    waypoints.forEach((waypoint, index) => {
      sequence.addChild(new ActionNode(`MoveTo_${index}`, (ctx) => {
        // Move to waypoint logic
        return NodeStatus.SUCCESS;
      }));
      
      sequence.addChild(new ActionNode(`Wait_${index}`, (ctx) => {
        // Wait at waypoint
        return NodeStatus.SUCCESS;
      }));
    });

    return new RepeaterNode('PatrolLoop', -1);
  }

  public static createChaseBehavior(targetKey: string = 'target'): BehaviorNode {
    const sequence = new SequenceNode('Chase');
    
    sequence.addChild(new ConditionNode('HasTarget', (ctx) => {
      return ctx.blackboard.has(targetKey);
    }));
    
    sequence.addChild(new ActionNode('MoveToTarget', (ctx) => {
      const target = ctx.blackboard.get(targetKey);
      // Move towards target logic
      return NodeStatus.RUNNING;
    }));

    return sequence;
  }

  public static createFleeingBehavior(threatKey: string = 'threat'): BehaviorNode {
    const sequence = new SequenceNode('Flee');
    
    sequence.addChild(new ConditionNode('HasThreat', (ctx) => {
      return ctx.blackboard.has(threatKey);
    }));
    
    sequence.addChild(new ActionNode('FleeFromThreat', (ctx) => {
      const threat = ctx.blackboard.get(threatKey);
      // Move away from threat logic
      return NodeStatus.RUNNING;
    }));

    return sequence;
  }
}
