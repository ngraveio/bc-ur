import resolve from "@rollup/plugin-node-resolve";
import commonjs from '@rollup/plugin-commonjs';
import nodePolyfills from "rollup-plugin-node-polyfills";

export default [
  {
    input: "./dist/esm/wrappers/cbor2Wrapper.js",
    output: {
      file: "dist/commonjs/wrappers/cbor2Wrapper.js",
      format: "cjs",
      exports: "auto",
    },
    plugins: [
      resolve({
        preferBuiltins: false,
        moduleDirectories: ["node_modules"],
        exportConditions: ["default", "import", "node"],
      }),
    ],
  },
  {
    input: "./dist/esm/wrappers/uint8array.js",
    output: {
      file: "dist/commonjs/wrappers/uint8array.js",
      format: "cjs",
      exports: "auto",
    },
    plugins: [
      resolve({
        preferBuiltins: false,
        moduleDirectories: ["node_modules"],
        exportConditions: ["default", "import", "node"],
      }),
    ],
  },
  {
    input: "./dist/esm/encodingMethods/bytewords.js",
    output: {
      file: "./dist/web/bytewords.js",
      format: "esm",
      exports: "auto",
    },
    plugins: [
      nodePolyfills(),
      resolve({
        preferBuiltins: false,
        moduleDirectories: ["node_modules"],
        exportConditions: ["default", "import", "node"],
      }),
      commonjs(), // converts commonjs to esm
    ],
  },  
];
