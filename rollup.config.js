import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

export default [
  // Core bundle
  {
    input: "src/core/index.js",
    output: [
      {
        file: "dist/minibum.core.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/minibum.core.min.js",
        format: "esm",
        plugins: [terser()],
      },
    ],
    plugins: [nodeResolve()],
    watch: {
      include: "src/**",
      exclude: "node_modules/**",
      clearScreen: false,
      buildDelay: 100,
    },
  },

  // Wrapper bundle
  {
    input: "src/wrapper/index.js",
    output: [
      {
        file: "dist/minibum.wrapper.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/minibum.wrapper.min.js",
        format: "esm",
        plugins: [terser()],
      },
    ],
    plugins: [nodeResolve()],
    watch: {
      include: "src/**",
      exclude: "node_modules/**",
      clearScreen: false,
      buildDelay: 100,
    },
  },
];
