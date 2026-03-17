import { Component } from '../Component';
import { eventBus } from '../EventBus';

export type NodeType = 'ON_TRIGGER_ENTER' | 'ON_CLICK' | 'MOVE_TO' | 'CHANGE_COLOR' | 'PLAY_SOUND' | 'UPDATE_STAT';

export interface ScriptNode {
    id: string;
    type: NodeType;
    params: Record<string, any>;
    next?: string[];
}

export class VisualScripting extends Component {
    private nodes: Map<string, ScriptNode> = new Map();
    private startNodes: string[] = [];

    constructor() {
        super('VisualScripting');
    }

    public addNode(node: ScriptNode, isStart: boolean = false) {
        this.nodes.set(node.id, node);
        if (isStart) this.startNodes.push(node.id);
    }

    public execute(nodeId: string) {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        this.processNode(node);
    }

    private processNode(node: ScriptNode) {
        switch (node.type) {
            case 'MOVE_TO':
                if (this.entity.body) {
                    const { x, y, z } = node.params;
                    this.entity.body.position.set(x, y, z);
                }
                break;
            case 'CHANGE_COLOR':
                if (this.entity.mesh) {
                    this.entity.mesh.traverse((child) => {
                        if ((child as any).isMesh) {
                            (child as any).material.color.set(node.params.color);
                        }
                    });
                }
                break;
            case 'UPDATE_STAT':
                const stats = this.entity.getComponent<any>('PlayerStats');
                if (stats) {
                    stats.setStat(node.params.key, node.params.value);
                }
                break;
            default:
                console.log(`Node type ${node.type} execution not implemented yet.`);
        }

        // Execute next nodes
        if (node.next) {
            node.next.forEach(nextId => this.execute(nextId));
        }
    }

    public onAttach(): void {
        // Example: Setup listeners for trigger events if nodes exist
        eventBus.on('trigger:enter', (data) => {
            if (data.trigger === this.entity) {
                this.triggerNodesByType('ON_TRIGGER_ENTER');
            }
        });
    }

    private triggerNodesByType(type: NodeType) {
        this.nodes.forEach(node => {
            if (node.type === type) {
                this.execute(node.id);
            }
        });
    }

    public update(delta: number): void {
        // Logic updates if needed
    }
}
