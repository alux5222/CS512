import {
  positions,
  colors,
  indices,
  trianglePositions,
  triangleColors,
  triangleIndices,
  createTorus
} from './primitives.js';


const makeTorus = createTorus(1, 0.4, 77, 32);

const shapes = {
  torus: {
    positions: makeTorus.positions,
    colors: makeTorus.colors,
    indices: makeTorus.indices
  },

  cube: {
    positions: positions,
    colors: colors,
    indices: indices
  },

  triangle: {
    positions: trianglePositions,
    colors: triangleColors,
    indices: triangleIndices
  }
};

export { shapes };
