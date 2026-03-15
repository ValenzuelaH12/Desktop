const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.jsx')) {
      fs.renameSync(p, p.replace('.jsx', '.tsx'));
    }
  }
}

walk('src');
console.log('Renamed all .jsx to .tsx');
