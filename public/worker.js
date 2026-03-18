// 16. Worker untuk offload tugas CPU-heavy
self.onmessage = function(e) {
  const { id, type, data } = e.data;

  try {
    let result;

    switch (type) {
      case 'navmesh':
        result = buildNavMesh(data);
        break;
      case 'pathfinding':
        result = findPath(data);
        break;
      case 'baking':
        result = bakeData(data);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};

function buildNavMesh(data) {
  // Simplified navmesh building
  return { nodes: [], edges: [] };
}

function findPath(data) {
  // Simplified pathfinding
  return { path: [] };
}

function bakeData(data) {
  // Simplified data baking
  return { baked: true };
}
