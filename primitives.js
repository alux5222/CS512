// cube
const positions = new Float32Array([
  -1, -1, -1,  // 0
   1, -1, -1,  // 1
   1,  1, -1,  // 2
  -1,  1, -1,  // 3
  -1, -1,  1,  // 4
   1, -1,  1,  // 5
   1,  1,  1,  // 6
  -1,  1,  1   // 7
]);

const colors = new Float32Array([
  1.2,1.0,1.5,  1,1,1,  0,1,1, 1,1,1, 1,1,1, 1.1,0,1.1, 1,1,1, 1,1,0
]);


const indices = new Uint16Array([
  // Front
  4, 5, 6,   4, 6, 7,
  // Back
  1, 0, 3,   1, 3, 2,
  // Top
  3, 7, 6,   3, 6, 2,
  // Bottom
  0, 1, 5,   0, 5, 4,
  // Right
  1, 2, 6,   1, 6, 5,
  // Left
  0, 4, 7,   0, 7, 3,
]);

// Donat (i, j)
// R = major radius (distance from center of hole to center of tube)
// r = minor radius (thickness of the tube)

// x = (R + r*cos(j)) * cos(i)
// y = r * sin(j)
// z = (R + r*cos(j)) * sin(i)

function createTorus(R, r, segMajor, segMinor) {
  //  vertex per (i, j) grid point → segMajor × segMinor vertices
  const positions = [];
  // Unit vector from tube center to surface point — needed for lighting
  const normals = [];
  // Each grid cell is a quad split into 2 triangles. The modulo wraps around so the ring closes seamlessly.
  const indices = [];

  for (let i = 0; i < segMajor; i++) {
    for (let j = 0; j < segMinor; j++) {
      const u = (i / segMajor) * Math.PI * 2;  // around the ring
      const v = (j / segMinor) * Math.PI * 2;  // around the tube

      const cu = Math.cos(u), su = Math.sin(u);
      const cv = Math.cos(v), sv = Math.sin(v);

      positions.push((R + r * cv) * cu, r * sv, (R + r * cv) * su );

      // Normal points outward from tube center to surface
      // Tube center at ring distance R from origin:
      // normals.push(1 + 1 * cv * cu, 0.8 + 0.2 * sv, 0.1 + 0.4 * cv * su );
      normals.push(1.2,1.2,1.2);
    }
  }

  // Indices: each quad becomes two triangles
  for (let i = 0; i < segMajor; i++) {
    for (let j = 0; j < segMinor; j++) {
      const a = i * segMinor + j;
      const b = i * segMinor + (j + 1) % segMinor;
      const c = ((i + 1) % segMajor) * segMinor + j;
      const d = ((i + 1) % segMajor) * segMinor + (j + 1) % segMinor;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return { positions: new Float32Array(positions),
           normals: new Float32Array(normals),
           indices: new Uint16Array(indices) };
}

export {
  positions,
  colors,
  indices,
  // trianglePositions,
  // triangleNormals,
  // triangleIndices,
  createTorus
};
