// Edit package.json here to inject react-native exports

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the package.json file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// Add react-native export as the first entry
const exports = packageJson.exports['.'];
packageJson.exports['.'] = {
  "react-native": {
    "types": "./dist/commonjs/index-react-native.d.ts",
    "default": "./dist/commonjs/index-react-native.js"
  },
  ...exports
};

// Write the updated package.json back to its path
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
