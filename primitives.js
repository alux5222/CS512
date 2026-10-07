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
      const wave1 = Math.sin(u * 5.0 + v * 3.0);
      const wave2 = Math.cos(u * 11.0 - v * 7.0) * 0.5;
      
      // Normalized heat intensity from 0.0 (charcoal) to 1.0 (white hot)
      let heat = 0.5 + 0.5 * ((wave1 + wave2) / 1.5);
      
      // Boost heat on the inner ring of the torus for a dense core
      heat = Math.min(1.0, heat * 1.15);

      // Color mapping curve:
      // Red rises fast (dominant warm base)
      const red = Math.min(1.0, heat * 1.8); 
      // Green rises exponentially (creates deep orange -> bright yellow)
      const green = Math.pow(heat, 2.8); 
      // Blue spikes only at peak temperatures (white-hot core)
      const blue = Math.pow(heat, 7.0); 

      colors.push(red, green, blue);
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

const rectanglePositions = new Float32Array([
  // Front face
  -1.0,  0.15, -0.5,  // 0
   1.0,  0.15, -0.5,  // 1
   1.0,  0.15,  0.5,  // 2
  -1.0,  0.15,  0.5,  // 3

  // Bottom face
  -1.0, -0.15, -0.5,  // 4
   1.0, -0.15, -0.5,  // 5
   1.0, -0.15,  0.5,  // 6
  -1.0, -0.15,  0.5   // 7
]);

const rectangleColors = new Float32Array([
  // Front
 1.0,  0.95, 0.70, // Vertex 0: White-hot peak
  1.0,  0.85, 0.30, // Vertex 1: Bright golden yellow
  1.0,  0.75, 0.15, // Vertex 2: Warm yellow-orange
  1.0,  0.90, 0.50,

  // Back
  0.8,  0.15, 0.00, // Vertex 4: Deep fiery red
  0.4,  0.05, 0.00, // Vertex 5: Dark cooling ember red
  0.2,  0.02, 0.00, // Vertex 6: Near-black charcoal red
  0.6,  0.08, 0.00
]);

const rectangleIndices = new Uint16Array([
  0, 1, 2,
  0, 2, 3,

  // Back
  5, 4, 7,
  5, 7, 6,

  // Bottom
  0, 4, 5,
  0, 5, 1,

  // Right
  1, 5, 6,
  1, 6, 2,

  // Top
  3, 2, 6,
  3, 6, 7,

  // Left
  4, 0, 3,
  4, 3, 7
]);

export {
  positions,
  colors,
  indices,
  trianglePositions,
  triangleColors,
  triangleIndices,
  createTorus,
  rectanglePositions,
  rectangleColors,
  rectangleIndices
};
