
function createSphere(segment) {
  const position = [];
  const normals = [];
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

      // Map the JPG onto the sphere
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
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createOctagon() {
  const positions = [];
  const normals = [];
  const indices = [];

  const ring = [
    [0, 1], [0.707, 0.707],
    [1, 0], [0.707, -0.707],
    [0, -1], [-0.707, -0.707],
    [-1, 0], [-0.707, 0.707]
  ];

  function addFace(vertices, normal) {
    const start = positions.length / 3;

    // Duplicate vertices for this face so each face
    // has its own constant normal (flat shading).
    for (const vertex of vertices) {
      positions.push(vertex[0], vertex[1], vertex[2]);
      normals.push(normal[0], normal[1], normal[2]);
    }

    // Triangulate the face as a fan.
    for (let i = 1; i < vertices.length - 1; i++) {
      indices.push(start, start + i, start + i + 1);
    }
  }

  // Front face: z = +0.5
  for (let i = 1; i < 7; i++) {
    addFace(
      [
        [0, 0, 0.5],
        [ring[i][0], ring[i][1], 0.5],
        [ring[i + 1][0], ring[i + 1][1], 0.5]
      ],
      [0, 0, 1]
    );
  }

  // Back face: z = -0.5
  for (let i = 1; i < 7; i++) {
    addFace(
      [
        [0, 0, -0.5],
        [ring[i + 1][0], ring[i + 1][1], -0.5],
        [ring[i][0], ring[i][1], -0.5]
      ],
      [0, 0, -1]
    );
  }

  // Eight rectangular side faces
  for (let i = 0; i < 8; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 8];

    // Outward-facing normal for this side.
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const length = Math.hypot(ex, ey);
    const nx = ey / length;
    const ny = -ex / length;

    addFace(
      [
        [a[0], a[1], 0.5],
        [b[0], b[1], 0.5],
        [b[0], b[1], -0.5],
        [a[0], a[1], -0.5]
      ],
      [nx, ny, 0]
    );
  }

  return {positions: new Float32Array(positions),normals: new Float32Array(normals),indices: new Uint16Array(indices) };
}




function createOctagonFur(strandsPerFace = 1800) {
  const positions = [];
  const normals = [];
  const indices = [];

  let seed = 12345;
  function rand() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const ring = [
    [0, 1], [0.707, 0.707],
    [1, 0], [0.707, -0.707],
    [0, -1], [-0.707, -0.707],
    [-1, 0], [-0.707, 0.707]
  ];

  function addStrand(x, y, z, nx, ny, nz) {
    // Keep the direction close to the surface normal.
    let dx = nx + (rand() - 0.5) * 0.35;
    let dy = ny + (rand() - 0.5) * 0.35;
    let dz = nz + (rand() - 0.5) * 0.35;

    const d = Math.hypot(dx, dy, dz);
    dx /= d;
    dy /= d;
    dz /= d;

    // Make a narrow ribbon perpendicular to the strand.
    let ax = dy * nz - dz * ny;
    let ay = dz * nx - dx * nz;
    let az = dx * ny - dy * nx;

    let al = Math.hypot(ax, ay, az);
    if (al < 0.0001) {
      ax = 1;
      ay = 0;
      az = 0;
      al = 1;
    }

    ax /= al;
    ay /= al;
    az /= al;

    const length = 0.55 + rand() * 0.12;
    const width = 0.002 + rand() * 0.0015;

    // Embed the root slightly into the surface to prevent gaps.
    x -= nx * 0.002;
    y -= ny * 0.002;
    z -= nz * 0.002;

    const base = positions.length / 3;

    positions.push(
      x - ax * width, y - ay * width, z - az * width,
      x + ax * width, y + ay * width, z + az * width,
      x + dx * length, y + dy * length, z + dz * length
    );

    for (let i = 0; i < 3; i++) {
      normals.push(nx, ny, nz);
    }

    indices.push(base, base + 1, base + 2);
  }

  // Front and back: sample the six triangles of the octagon fan.
  for (const side of [0.5, -0.5]) {
    const nz = side > 0 ? 1 : -1;

    for (let i = 1; i < 7; i++) {
      const b = ring[i];
      const c = ring[i + 1];

      for (let s = 0; s < strandsPerFace / 6; s++) {
        let u = rand();
        let v = rand();

        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }

        const x = u * b[0] + v * c[0];
        const y = u * b[1] + v * c[1];

        addStrand(x, y, side, 0, 0, nz);
      }
    }
  }

  // Sides: roots lie exactly on the eight rectangular side faces.
  for (let i = 0; i < 8; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % 8];

    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const el = Math.hypot(ex, ey);

    // Correct outward normal for the counter-clockwise ring.
    const nx = ey / el;
    const ny = -ex / el;

    for (let s = 0; s < strandsPerFace / 2; s++) {
      const t = rand();
      const z = rand() - 0.5;

      addStrand(
        a[0] + ex * t,
        a[1] + ey * t,
        z,
        nx, ny, 0
      );
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices)
  };
}


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

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, indices };
}

function createCylinder(segments) {
  const pos = [], nrm = [], idx = [];

  // Side
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2, x = Math.cos(a), z = Math.sin(a);
    pos.push(x, -1, z, x, 1, z);
    nrm.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < segments; i++) {
    const b = i * 2;
    idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
  }

  // Caps
  for (const y of [-1, 1]) {
    const center = pos.length / 3;
    pos.push(0, y, 0);
    nrm.push(0, y, 0);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pos.push(Math.cos(a), y, Math.sin(a));
      nrm.push(0, y, 0);
    }
    for (let i = 1; i <= segments; i++) {
      if (y > 0) idx.push(center, center + i + 1, center + i);
      else idx.push(center, center + i, center + i + 1);
    }
  }

  return { positions: new Float32Array(pos), normals: new Float32Array(nrm), indices: new Uint16Array(idx) };
}