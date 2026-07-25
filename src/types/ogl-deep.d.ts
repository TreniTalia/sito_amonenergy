/**
 * `ogl` ships a barrel (`ogl/src/index.js`) that Rollup will not tree-shake
 * across a dynamic import, so WaveDivider imports the four classes it needs by
 * path (allowed by the package's `"./src/*"` export). Those paths carry no
 * types of their own — re-point them at the package's own declarations.
 */
declare module 'ogl/src/core/Renderer.js' {
  export { Renderer } from 'ogl';
}
declare module 'ogl/src/core/Program.js' {
  export { Program } from 'ogl';
}
declare module 'ogl/src/core/Mesh.js' {
  export { Mesh } from 'ogl';
}
declare module 'ogl/src/extras/Triangle.js' {
  export { Triangle } from 'ogl';
}
