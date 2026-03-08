/**
 * Patches rxjs package.json to add the 'import' export condition for ESM resolution.
 * This fixes the webpack 5 "module has no exports" error when ng-bootstrap's .mjs
 * file imports named operators from 'rxjs/operators'.
 */
const fs = require('fs');
const path = require('path');

const rxjsPkgPath = path.join(__dirname, '../node_modules/rxjs/package.json');

if (!fs.existsSync(rxjsPkgPath)) {
  console.log('rxjs not found, skipping patch');
  process.exit(0);
}

const pkg = JSON.parse(fs.readFileSync(rxjsPkgPath, 'utf8'));
let patched = false;

const esmDir = './dist/esm';

// Patch each sub-path export (e.g. './operators', './ajax', etc.)
for (const [key, val] of Object.entries(pkg.exports || {})) {
  if (typeof val === 'object' && val !== null && !val['import'] && val['es2015']) {
    val['import'] = val['es2015'];
    patched = true;
  }
}

if (patched) {
  fs.writeFileSync(rxjsPkgPath, JSON.stringify(pkg, null, 2));
  console.log('rxjs package.json patched: added "import" export conditions');
} else {
  console.log('rxjs package.json already patched or no changes needed');
}
