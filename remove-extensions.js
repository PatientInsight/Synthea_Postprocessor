const fs = require('fs');
const path = require('path');
const uuidv1 = require('uuid/v1');

const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(inputDir)) {
  throw Error('Input directory (input/) does not exist');
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readdirSync(inputDir).map(fileName => {
  console.log('Processing ' + fileName);
  process(fileName);
});

function process(file) {
  let rawData = fs.readFileSync(path.join(__dirname, 'input', file));
  let bundle = JSON.parse(rawData);
  const newEntries = [];
  bundle.entry.forEach(entry => {
    if (entry.resource.extension) {
      delete entry.resource.extension;
    }
  });
  rawData = JSON.stringify(bundle, null, '  ');
  fs.writeFileSync(path.join(__dirname, 'output', file), rawData);
}
