const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');

const homedir = os.homedir();
const folder = `${homedir}/Desktop/hars`; // should contain *.har files
const outputFile = `${folder}/summary.json`;

const summary = {};

for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.har'))) {
  console.log(`processing ${file}...`);

  const json = fs.readFileSync(path.join(folder, file), { encoding: 'UTF-8' });
  const har = JSON.parse(json);

  if (har['log'] && har['log']['entries']) {
    for (const entry of har['log']['entries']) {
      const request = entry['request'];

      if (request) {
        const requestUrl = url.parse(request['url']);
        const hostname = requestUrl.hostname;
        const path = requestUrl.path;
        const ip = entry['serverIPAddress'];

        const item = summary[hostname] || {};

        item[path] = ip;

        summary[hostname] = item;
      }
    }
  }
}

console.log(`generating ${outputFile}...`);

fs.writeFileSync(outputFile, JSON.stringify(summary, null, 2));

console.log(`done!`);
