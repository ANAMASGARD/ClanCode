import { ShaderMaterial } from "three";

const plotVertexShader = `
  varying vec2 vWorldXZ;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldXZ = world.xz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const plotFragmentShader = `
  varying vec2 vWorldXZ;
  uniform float uTileSize;
  void main() {
    vec2 grid = vWorldXZ / uTileSize;
    vec2 cell = fract(grid);
    float checker = mod(floor(grid.x) + floor(grid.y), 2.0);
    vec3 light = vec3(0.74, 0.90, 0.50);
    vec3 dark = vec3(0.67, 0.84, 0.46);
    vec3 base = mix(light, dark, checker * 0.32);
    float lineX = smoothstep(0.02, 0.0, abs(cell.x - 0.5) - 0.48);
    float lineY = smoothstep(0.02, 0.0, abs(cell.y - 0.5) - 0.48);
    float gridLine = max(lineX, lineY) * 0.1;
    vec3 color = mix(base, vec3(0.52, 0.70, 0.36), gridLine);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createPlotMaterial(tileSize = 2): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uTileSize: { value: tileSize } },
    vertexShader: plotVertexShader,
    fragmentShader: plotFragmentShader,
  });
}
