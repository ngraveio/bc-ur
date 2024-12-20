import resolve from "@rollup/plugin-node-resolve";

export default {
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
  ]
};
