import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

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
    {
      name: "debug-resolve",
      resolveId(source) {
        if (source.includes("cbor2")) {
          console.log(`Resolving: ${source}`);
        }
        return null; // Let Rollup handle the actual resolution
      },
    },
    commonjs({
      include: /node_modules\/(cbor2|cbor2\/encoder)/, // Ensure cbor2 and encoder are included
    }),
  ],
  onwarn(warning, warn) {
    if (warning.code === "UNRESOLVED_IMPORT") {
      console.error(`Unresolved import: ${warning.source}`);
    } else {
      warn(warning); // Pass other warnings to the default handler
    }
  },
  external: id => false, // Fully include all dependencies
};
