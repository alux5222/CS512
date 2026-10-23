const VERTEX_SHADER = `#version 300 es
in vec3 aPosition;
in vec3 aNormal;
in vec2 aTexCoord;

uniform mat4 uModelView;
uniform mat4 uProjection;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
  vec4 p = uModelView * vec4(aPosition, 1.0);

  vPosition = p.xyz;
  vNormal = mat3(uModelView) * aNormal;
  vTexCoord = aTexCoord;

  gl_Position = uProjection * p;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

uniform vec3 uLightPos;
uniform vec3 uLightPosTwo;
uniform vec3 uColor;

uniform bool uLightOneEnabled;
uniform bool uLightTwoEnabled;

uniform sampler2D uTexture;
uniform bool uUseTexture;

out vec4 fragColor;

void main() {
  // Brighter material colors
  vec3 Ka = 0.2 * uColor;
  vec3 Kd = 0.8 * uColor;
  vec3 Ks = vec3(0.5);
  float shininess = 32.0;

  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vPosition);

  // First light
  vec3 L1 = normalize(uLightPos - vPosition);
  vec3 R1 = reflect(-L1, N);

  float diff1 = max(dot(N, L1), 0.0);
  float spec1 = 0.0;

  if (diff1 > 0.0) {
    spec1 = pow(max(dot(V, R1), 0.0), shininess);
  }

  // Second light
  vec3 L2 = normalize(uLightPosTwo - vPosition);
  vec3 R2 = reflect(-L2, N);

  float diff2 = max(dot(N, L2), 0.0);
  float spec2 = 0.0;

  if (diff2 > 0.0) {
    spec2 = pow(max(dot(V, R2), 0.0), shininess);
  }

  if (!uLightOneEnabled) {
    diff1 = 0.0;
    spec1 = 0.0;
  }

  if (!uLightTwoEnabled) {
      diff2 = 0.0;
      spec2 = 0.0;
  }

  // Combine lighting
  vec3 lighting;
  // Select textured or plain material
  vec3 baseColor = uColor;

  if (!uUseTexture) {
    // Slightly brighter than the original single-light shader
    lighting = 0.3 * uColor
         + 0.8 * uColor * (diff1 + diff2)
         + vec3(0.35) * (spec1 + spec2);
  } else {
    // Two lights for the textured sphere
    lighting = Ka
            + Kd * (diff1 + diff2)
            + Ks * (spec1 + spec2);
  }
  if (uUseTexture) {
    baseColor *= texture(uTexture, vTexCoord).rgb;
  }
  vec3 finalColor = uUseTexture
    ? baseColor * lighting
    : lighting;

  fragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

// WebGL setup
const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2");

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

// Fixed attribute slots, so the meshes stay valid when the shaders are recompiled
const ATTRIBUTES = { aPosition: 0, aNormal: 1, aTexCoord: 2 };

function createProgram(vsSource, fsSource) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
  for (const name in ATTRIBUTES) gl.bindAttribLocation(prog, ATTRIBUTES[name], name);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  return prog;
}

// Shader editors
const vertEditor = document.getElementById("vertEditor");
const fragEditor = document.getElementById("fragEditor");
const shaderError = document.getElementById("shaderError");
vertEditor.value = VERTEX_SHADER;
fragEditor.value = FRAGMENT_SHADER;

let program, uModelView, uProjection;
let uLightPos, uLightPosTwo, uColor;
let uLightOneEnabled, uLightTwoEnabled;
let uTexture,uUseTexture;

function updateProgram() {
  try {
    const prog = createProgram(vertEditor.value, fragEditor.value);
    if (program) gl.deleteProgram(program);
    // gl.deleteProgram(program);
    program = prog;
    gl.useProgram(program);
    uModelView = gl.getUniformLocation(program, "uModelView");
    uProjection = gl.getUniformLocation(program, "uProjection");
    uLightPos = gl.getUniformLocation(program, "uLightPos");  //firts light
    uLightPosTwo = gl.getUniformLocation(program, "uLightPosTwo"); //for second light
    uColor = gl.getUniformLocation(program, "uColor");
    uLightOneEnabled = gl.getUniformLocation(program, "uLightOneEnabled");
    uLightTwoEnabled = gl.getUniformLocation(program, "uLightTwoEnabled");
    uTexture = gl.getUniformLocation(program, "uTexture");
    uUseTexture = gl.getUniformLocation(program, "uUseTexture");
    shaderError.textContent = "";
  } catch (e) {
    shaderError.textContent = e.message.replace(/\0/g, "");  // some drivers end the log with \0
  }
}
updateProgram();
vertEditor.addEventListener("input", updateProgram);
fragEditor.addEventListener("input", updateProgram);

function bindAttribute(name, data) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.vertexAttribPointer(ATTRIBUTES[name], 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(ATTRIBUTES[name]);
}


function createMesh({ positions, normals, indices, texCoords }) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  bindAttribute("aPosition", positions);
  bindAttribute("aNormal", normals);

  if (texCoords) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(2);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);

  return { vao, count: indices.length };
}


const sphereMesh = createMesh(createSphere(16));
const octagonMesh = createMesh(createOctagon());
const furMesh = createMesh(createOctagonFur(2500));
const cubeMesh = createMesh(createCube());
const cylinderMesh = createMesh(createCylinder(32));

gl.enable(gl.DEPTH_TEST);
gl.clearColor(0, 0, 0, 1);
const projection = perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
const lightWorld = [3, 4, 5];
const lightWorldTwo = [-4, -4, 4];

let furVisible = true;
let textureVisible = true;
let upperArmAngle = 0;
let octagonAngle = 0;
let lightOneEnabled = true;
let lightTwoEnabled = true;

// nteractive controls
let dragRotX = 0, dragRotY = -0.5;      // mouse drag
let camX = 0, camY = 0, camZ = -7;      // arrow keys, w, s
let sliderAngle = 0;                    // degrees
let spinning = false, spinAngle = 0;    // Start/Stop button

let mouseDown = false, lastX, lastY;
canvas.addEventListener("mousedown", e => { mouseDown = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener("mouseup", () => mouseDown = false);
window.addEventListener("mousemove", e => {
  if (!mouseDown) return;
  dragRotY += (e.clientX - lastX) * 0.01;
  dragRotX += (e.clientY - lastY) * 0.01;
  lastX = e.clientX; lastY = e.clientY;
});

document.addEventListener("keydown", e => {
  if (e.target === vertEditor || e.target === fragEditor) return;  // let the editors use the keys
  const step = 0.2;
  switch (e.key) {
    case "ArrowUp": camY -= step; break;
    case "ArrowDown": camY += step; break;
    case "ArrowLeft": camX += step; break;
    case "ArrowRight": camX -= step; break;
    case "w": camZ += step; break;
    case "s": camZ -= step; break;
    default: return;
  }
  e.preventDefault();  // keep the arrow keys from scrolling the page
});

const axisSelect = document.getElementById("axisSelect");
document.getElementById("slider").addEventListener("input", e => {
  sliderAngle = Number(e.target.value);
  document.getElementById("sliderValue").textContent = sliderAngle;
});
document.getElementById("spinButton").addEventListener("click", () => spinning = !spinning);


function createNode(mesh, color, shape) {
  return { mesh, color, shape, joint: null, children: [] };
}

// Lower arm: scale the cylinder then move it up by 0.6 so its bottom sits at the joint
const lowerArm = createNode(cylinderMesh, [1, 0.2, 0.2],
  multiply(translate(0, 0.6, 0), scale(0.3, 0.6, 0.3)));

// Upper arm: scale the cube then move it up by 0.5 so its bottom sits at the joint
const upperArm = createNode(cubeMesh, [0.2, 0.4, 1],
  multiply(translate(0, 0.5, 0), scale(0.2, 0.5, 0.2)));

const upperArmTwo = createNode(octagonMesh, [0.2, 1.0, 0.2], scale(0.3, 0.3, 0.3));
const fur = createNode(furMesh,[0.25, .65, 0.12],scale(0.35, 0.35, 0.35));
const upperArmThree = createNode(sphereMesh, [1.0, 1.0, 1.0],scale(0.25, 0.25, 0.25));

lowerArm.children.push(upperArm);
upperArm.children.push(upperArmTwo);
upperArmTwo.children.push(fur);
upperArmTwo.children.push(upperArmThree);

function drawNode(node, frame) {
  gl.uniformMatrix4fv(
    uModelView,
    false,
    multiply(frame, node.shape)
  );

  gl.uniform3fv(uColor, node.color);
  gl.bindVertexArray(node.mesh.vao);

  const useTexture = node.mesh === sphereMesh && textureVisible;
  gl.uniform1i(uUseTexture, useTexture ? 1 : 0);

  if (node.mesh === sphereMesh) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
    gl.uniform1i(uTexture, 0);
  }

  gl.drawElements(
    gl.TRIANGLES,
    node.mesh.count,
    gl.UNSIGNED_SHORT,
    0
  );
}

//Data structure
function drawTree(root, rootFrame) {
  const stack = [[root, rootFrame]];
  while (stack.length > 0) {
    const [node, parentFrame] = stack.pop();
    const frame = multiply(parentFrame, node.joint);
    // drawNode(node, frame);
    if (node !== fur || furVisible) {
      drawNode(node, frame);
    }
    for (const child of node.children) stack.push([child, frame]);
  }
}

const sphereTexture = gl.createTexture();

gl.bindTexture(gl.TEXTURE_2D, sphereTexture);

// Temporary pixel while the JPG loads
gl.texImage2D(
  gl.TEXTURE_2D,
  0,
  gl.RGBA,
  1,
  1,
  0,
  gl.RGBA,
  gl.UNSIGNED_BYTE,
  new Uint8Array([255, 255, 255, 255])
);

const image = new Image();
image.onload = function () {
  gl.bindTexture(gl.TEXTURE_2D, sphereTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
};
image.src = "sand.jpg";

// Render loop
let lastTime = 0;
function render(time) {
  const t = time / 1000;
  if (spinning) spinAngle += t - lastTime;
  lastTime = t;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Camera moves with the keys; the light stays fixed in the world.
  const view = translate(camX, camY, camZ);
  gl.uniformMatrix4fv(uProjection, false, projection);
  gl.uniform3fv(uLightPos, transformPoint(view, lightWorld));
  gl.uniform3fv(uLightPosTwo, transformPoint(view, lightWorldTwo));
  gl.uniform1i(uLightOneEnabled,lightOneEnabled ? 1 : 0);
  gl.uniform1i(uLightTwoEnabled,lightTwoEnabled ? 1 : 0);

  // Whole-model rotation
  const axisRotation = ROTATE[axisSelect.value](sliderAngle * Math.PI / 180 + spinAngle);
  const rotation = multiply(multiply(rotateY(dragRotY), rotateX(dragRotX)), axisRotation);

  // Lower arm (root)
  lowerArm.joint = multiply(multiply(translate(0, -2, 0), rotation), rotateZ(0.5 * Math.sin(t)));

  // Upper arm (child)
  upperArm.joint = multiply(translate(0, 1.2, 0), rotateZ(upperArmAngle + Math.sin(1.5 * t)));

  upperArmTwo.joint = multiply(translate(0, 1.0, 0), rotateZ(octagonAngle + Math.sin(2.0 * t)));
  fur.joint = translate(0, 0, 0);
  upperArmThree.joint = multiply(translate(0, 0.3, 0), rotateZ(Math.sin(2.5 * t)));

  drawTree(lowerArm, view);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

document.getElementById("upperArmAngle")
  .addEventListener("input", e => {
    upperArmAngle = Number(e.target.value) * Math.PI / 180;
  });

document.getElementById("octagonAngle")
  .addEventListener("input", e => {
    octagonAngle = Number(e.target.value) * Math.PI / 180;
  });

document.getElementById("fur").addEventListener("click", () => {
  furVisible = !furVisible;

  document.getElementById("fur").textContent =
    furVisible ? "Fur Off" : "Fur On";
});

document.getElementById("sand").addEventListener("click", () => {
  textureVisible = !textureVisible;

  document.getElementById("sand").textContent =
    textureVisible ? "Sand off" : "Sand on";
});
document.getElementById("lOne").addEventListener("click", () => {
  lightOneEnabled = !lightOneEnabled;

  document.getElementById("lOne").textContent =
    lightOneEnabled ? "Light One On" : "Light One Off";
});

document.getElementById("lTwo").addEventListener("click", () => {
  lightTwoEnabled = !lightTwoEnabled;

  document.getElementById("lTwo").textContent =
    lightTwoEnabled ? "Light Two On" : "Light Two Off";
});