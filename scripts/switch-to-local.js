const fs = require('fs');
const path = require('path');

const tsconfigPath = path.join(__dirname, '../tsconfig.json');
const fileContent = fs.readFileSync(tsconfigPath, 'utf8');
// Simple regex to strip comments (not perfect but works for standard tsconfig)
const jsonContent = fileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
const tsconfig = JSON.parse(jsonContent);

if (!tsconfig.compilerOptions) {
  tsconfig.compilerOptions = {};
}

if (!tsconfig.compilerOptions.paths) {
  tsconfig.compilerOptions.paths = {};
}

tsconfig.compilerOptions.paths['@cometchat/chat-uikit-angular'] = [
  './projects/cometchat-uikit/src/public-api.ts'
];

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('Switched to local dependency (added paths to tsconfig.json)');
