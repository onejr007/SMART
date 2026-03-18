// 17. Navmesh + crowd steering
import * as THREE from 'three';

export interface NavNode {
  position: THREE.Vector3;
  neighbors: NavNode[];
}

export class NavMesh {
  private nodes: NavNode[] = [];

  addNode(position: THREE.Vector3): NavNode {
    const node: NavNode = { position, neighbors: [] };
    this.nodes.push(node);
    return node;
  }

  connectNodes(a: NavNode, b: NavNode): void {
    if (!a.neighbors.includes(b)) a.neighbors.push(b);
    if (!b.neighbors.includes(a)) b.neighbors.push(a);
  }

  findPath(start: THREE.Vector3, end: THREE.Vector3): THREE.Vector3[] {
    const startNode = this.findNearestNode(start);
    const endNode = this.findNearestNode(end);
    
    if (!startNode || !endNode) return [];

    const openSet = [startNode];
    const cameFrom = new Map<NavNode, NavNode>();
    const gScore = new Map<NavNode, number>();
    const fScore = new Map<NavNode, number>();

    gScore.set(startNode, 0);
    fScore.set(startNode, startNode.position.distanceTo(endNode.position));

    while (openSet.length > 0) {
      openSet.sort((a, b) => (fScore.get(a) || Infinity) - (fScore.get(b) || Infinity));
      const current = openSet.shift()!;

      if (current === endNode) {
        return this.reconstructPath(cameFrom, current);
      }

      for (const neighbor of current.neighbors) {
        const tentativeGScore = (gScore.get(current) || Infinity) + 
          current.position.distanceTo(neighbor.position);

        if (tentativeGScore < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, tentativeGScore + neighbor.position.distanceTo(endNode.position));
          
          if (!openSet.includes(neighbor)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return [];
  }

  private findNearestNode(position: THREE.Vector3): NavNode | null {
    if (this.nodes.length === 0) return null;
    
    return this.nodes.reduce((nearest, node) => {
      const dist = node.position.distanceTo(position);
      const nearestDist = nearest.position.distanceTo(position);
      return dist < nearestDist ? node : nearest;
    });
  }

  private reconstructPath(cameFrom: Map<NavNode, NavNode>, current: NavNode): THREE.Vector3[] {
    const path = [current.position.clone()];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current.position.clone());
    }
    return path;
  }
}

export class CrowdSteering {
  private agents: Map<string, { position: THREE.Vector3; velocity: THREE.Vector3; radius: number }> = new Map();

  addAgent(id: string, position: THREE.Vector3, radius = 0.5): void {
    this.agents.set(id, { position, velocity: new THREE.Vector3(), radius });
  }

  removeAgent(id: string): void {
    this.agents.delete(id);
  }

  updateAgent(id: string, desiredVelocity: THREE.Vector3, maxSpeed = 5): THREE.Vector3 {
    const agent = this.agents.get(id);
    if (!agent) return new THREE.Vector3();

    let avoidance = new THREE.Vector3();
    
    for (const [otherId, other] of this.agents) {
      if (otherId === id) continue;
      
      const diff = agent.position.clone().sub(other.position);
      const dist = diff.length();
      const minDist = agent.radius + other.radius;
      
      if (dist < minDist * 2) {
        avoidance.add(diff.normalize().multiplyScalar((minDist * 2 - dist) / dist));
      }
    }

    const finalVelocity = desiredVelocity.clone().add(avoidance).clampLength(0, maxSpeed);
    agent.velocity.copy(finalVelocity);
    
    return finalVelocity;
  }
}
