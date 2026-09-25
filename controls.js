import {
  positions,
  colors,
  indices,
  createTorus
} from './primitives.js';

const makeTorus = createTorus(1, 0.4, 77, 32);

const shapes = {
  torus: {
    positions: makeTorus.positions,
    normals: makeTorus.normals,
    indices: makeTorus.indices
  },

  cube: {
    positions: positions,
    normals: colors,
    indices: indices
  },

  // triangle: {
  //   positions: trianglePositions,
  //   normals: triangleNormals,
  //   indices: triangleIndices
  // }
};

export { shapes };
