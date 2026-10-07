import {
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
} from './primitives.js';


const makeTorus = createTorus(1, 0.4, 77, 32);

const torus1 = createTorus(0.65, 0.18, 48, 24);
const torus2 = createTorus(0.50, 0.15, 48, 24);
const torus3 = createTorus(0.35, 0.12, 48, 24);

const shapes = {
  torus: {
    positions: makeTorus.positions,
    colors: makeTorus.colors,
    indices: makeTorus.indices
  },

  torus1: {
    positions: torus1.positions,
    colors: torus1.colors,
    indices: torus1.indices
  },

  torus2: {
    positions: torus2.positions,
    colors: torus2.colors,
    indices: torus2.indices
  },

  torus3: {
    positions: torus3.positions,
    colors: torus3.colors,
    indices: torus3.indices
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
  },

  rectangle: {
    positions: rectanglePositions,
    colors: rectangleColors,
    indices: rectangleIndices
  }
};

export { shapes };

