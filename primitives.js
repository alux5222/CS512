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
  1.2,1.0,0,  1,1,1,  1,0.35,0,  1,1,1,  0,0.8,1,  1,1,1,  0.5,0,1,  1,1,1,  0,1,0.3
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
  const colors = [];
  // Each grid cell is a quad split into 2 triangles. The modulo wraps around so the ring closes seamlessly.
  const indices = [];

  // i moves around the large/main circle of the torus.
  // j moves around the smaller tube of the torus.
  // Together, i and j create a 2D grid of points
  // that is wrapped into the shape of a torus.
  for (let i = 0; i < segMajor; i++) {
    for (let j = 0; j < segMinor; j++) {
       // u = angle around the large/main ring.
       // v = angle around the smaller tube.
       // Math.PI * 2 = 360-degree.
      const u = (i / segMajor) * Math.PI * 2;  
      const v = (j / segMinor) * Math.PI * 2; 
      
      // cu and su describe the position around the circle torus.
       // cv and sv describe the position around the radiouse.
      const cu = Math.cos(u), su = Math.sin(u);
      const cv = Math.cos(v), sv = Math.sin(v);

      // The torus equation:
      // x = (R + r*cos(v)) * cos(u)
      // y = r*sin(v)
      // z = (R + r*cos(v)) * sin(u)
      positions.push((R + r * cv) * cu, r * sv, (R + r * cv) * su );

      // Normal points outward from tube center to surface
      // Tube center at ring distance R from origin:
      colors.push(0.00, 0.40, 1.00); 
    }
  }

  // Indices: each quad becomes two very small triangles
  for (let i = 0; i < segMajor; i++) {
    for (let j = 0; j < segMinor; j++) {
      // a,b,c are the vertex that make the triangles
      const a = i * segMinor + j;
      const b = i * segMinor + (j + 1) % segMinor;
      const c = ((i + 1) % segMajor) * segMinor + j;
      // d is the diagonal vertex of the quad
      const d = ((i + 1) % segMajor) * segMinor + (j + 1) % segMinor;

      // 1st triangle
      indices.push(a, b, c);
      // 2nd triangle
      indices.push(b, d, c);
    }
  }

  return { positions: new Float32Array(positions),
           colors: new Float32Array(colors),
           indices: new Uint16Array(indices) };
}

// Triangle in 3D = more like a pyramid
// Each vertex has an x, y, and z coordinate.
const trianglePositions = new Float32Array([
   // Base of pyramid
  -1.0, -1.0, -1.0,  // 0
   1.0, -1.0, -1.0,  // 1
   1.0, -1.0,  1.0,  // 2
  -1.0, -1.0,  1.0,  // 3

  // Top
   0.0,  1.0,  0.0   // 4
]);


// One RGB color for each vertex.
//
// Vertex 0 = red
// Vertex 1 = green
// Vertex 2 = blue

const triangleColors = new Float32Array([
  0.98, 0.65, 0.25,  // 0 
  0.98, 0.65, 0.25,  // 1 
  0.98, 0.65, 0.25,  // 2 
  0.98, 0.65, 0.25,  // 3 
  0.98, 0.95, 0.90   // 4 light yellow white
]);


// Tell WebGL which vertices make the triangle.
//
// 0 → 1 → 2

const triangleIndices = new Uint16Array([
  0, 1, 4,

  // Right
  1, 2, 4,

  // Back
  2, 3, 4,

  // Left
  3, 0, 4,

  // Bottom
  0, 3, 2,
  0, 2, 1
]);

export {
  positions,
  colors,
  indices,
  trianglePositions,
  triangleColors,
  triangleIndices,
  createTorus
};
