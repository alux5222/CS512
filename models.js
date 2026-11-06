function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  // Tangent; bitangent = cross(N, T)
  const faceTangents = [[1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]];
  const tangents = new Float32Array(faceTangents.flatMap(t => [...t, ...t, ...t, ...t]));

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, tangents, texCoords, indices };
}


function createCylinder(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side: theta grows with u, so T points along the circle and B = cross(N, T) points up
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    for (const y of [-1, 1]) {
      positions.push(s, y, c);
      normals.push(s, 0, c);
      tangents.push(c, 0, -s);
      texCoords.push(u * uRepeat, (y + 1) / 2);
    }
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    indices.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }

  // Caps: planar mapping of x, z into the texture, T = +x on both
  for (const y of [1, -1]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, y, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, y, c);
      normals.push(0, y, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 - 0.5 * y * c);  // keeps cross(N, T) along +v
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      if (y > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createSphere(segment) {
  const position = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  const radius = 1.0;
  const latitudeBands = segment;
  const longitudeBands = segment;

  for (let lat = 0; lat <= latitudeBands; lat++) {
    const theta = lat * Math.PI / latitudeBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= longitudeBands; lon++) {
      const phi = lon * 2 * Math.PI / longitudeBands;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      position.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);

      // Tangent: direction of increasing U
      tangents.push(-sinPhi, 0, cosPhi);

      const u = lon / longitudeBands;
      const v = lat / latitudeBands;
      texCoords.push(u, v);
    }
  }

  for (let lat = 0; lat < latitudeBands; lat++) {
    for (let lon = 0; lon < longitudeBands; lon++) {
      const first = lat * (longitudeBands + 1) + lon;
      const second = first + longitudeBands + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    positions: new Float32Array(position),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createOctagon() {
  const positions = [];
  const normals = [];
  const indices = [];
  const tangents = [];
  const texCoords = [];

  const ring = [
    [0, 1], [0.70710678, 0.70710678],
    [1, 0], [0.70710678, -0.70710678],
    [0, -1], [-0.70710678, -0.70710678],
    [-1, 0], [-0.70710678, 0.70710678]
  ];

  function addFace(vertices, normal, tangent, uvs) {
    const start = positions.length / 3;

    for (let i = 0; i < vertices.length; i++) {
      positions.push(...vertices[i]);
      normals.push(...normal);
      tangents.push(...tangent);
      texCoords.push(...uvs[i]);
    }

    for (let i = 1; i < vertices.length - 1; i++) {
      indices.push(start, start + i, start + i + 1);
    }
  }

  // Front face
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;

    const vertices = [
      [0, 0, 0.5],
      [ring[next][0], ring[next][1], 0.5],
      [ring[i][0], ring[i][1], 0.5]
    ];

    addFace(
      vertices,
      [0, 0, 1],
      [1, 0, 0],
      vertices.map(v => [(v[0] + 1) / 2, (v[1] + 1) / 2])
    );
  }

  // Back face
  for (let i = 0; i < 8; i++) {
    const next = (i + 1) % 8;

    const vertices = [
      [0, 0, -0.5],
      [ring[i][0], ring[i][1], -0.5],
      [ring[next][0], ring[next][1], -0.5]
    ];

    addFace(
      vertices,
      [0, 0, -1],
      [-1, 0, 0],
      vertices.map(v => [(1 - v[0]) / 2, (v[1] + 1) / 2])
    );
  }

  // Eight side faces
  for (let i = 0; i < 8; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 8];

    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const length = Math.hypot(ex, ey);

    // Outward-facing normal
    const nx = -ey / length;
    const ny = ex / length;

    const tx = ex / length;
    const ty = ey / length;

    const vertices = [
      [a[0], a[1], 0.5],
      [b[0], b[1], 0.5],
      [b[0], b[1], -0.5],
      [a[0], a[1], -0.5]
    ];

    addFace(
      vertices,
      [nx, ny, 0],
      [tx, ty, 0],
      [
        [0, 0],
        [length, 0],
        [length, 1],
        [0, 1]
      ]
    );
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createTorus(R, r, segMajor, segMinor) {
  //  vertex per (i, j) grid point → segMajor × segMinor vertices
  const positions = [];
  // Unit vector from tube center to surface point — needed for lighting
  const colors = [];
  // Each grid cell is a quad split into 2 triangles. The modulo wraps around so the ring closes seamlessly.
  const indices = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];

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
      // Position
      positions.push(
        (R + r * cv) * cu,
        r * sv,
        (R + r * cv) * su
      );

      // Normal
      normals.push(
        cv * cu,
        sv,
        cv * su
      );

      // Tangent: direction of increasing U
      tangents.push(
        -su,
        0,
        cu
      );

      // Texture coordinates
      const texU = i / segMajor;
      const texV = j / segMinor;

      texCoords.push(texU, texV);

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

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    colors: new Float32Array(colors),
    indices: new Uint16Array(indices)
  };
}

