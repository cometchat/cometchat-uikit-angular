const fs = require('fs');
const path = require('path');

const tsconfigPath = path.join(__dirname, '../tsconfig.json');
const fileContent = fs.readFileSync(tsconfigPath, 'utf8');
// Simple regex to strip comments (not perfect but works for standard tsconfig)
const jsonContent = fileContent.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
const tsconfig = JSON.parse(jsonContent);

if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
  delete tsconfig.compilerOptions.paths['@cometchat/chat-uikit-angular'];
  if (Object.keys(tsconfig.compilerOptions.paths).length === 0) {
    delete tsconfig.compilerOptions.paths;
  }
}

fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
console.log('Switched to NPM dependency (removed paths from tsconfig.json)');
