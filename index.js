const os = require('os');
const fs = require('fs');
const path = require('path');
const url = require('url');

const homedir = os.homedir();
const folder = `${homedir}/Desktop/hars`; // should contain *.har files
const summaryFile = `${folder}/summary.json`;
const hostsFile = `${folder}/hosts.txt`;

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

let hosts = "";

for (const domain in summary) {
  let unique_ip = true;
  let domain_ip = null;

  for (const path in summary[domain]) {
    const ip = summary[domain][path];

    if (ip && ip.length > 0) {
      if (domain_ip === null) {
        domain_ip = ip;
      }
      else if(domain_ip !== ip) {
        unique_ip = false;
      }
    }
  }

  if (unique_ip && domain_ip !== null && domain_ip.length > 0) {
    hosts += `${domain}\t${domain_ip}\n`;
  }
  else if (Object.keys(summary[domain]).length > 0) {
    hosts += '\n';
    hosts += `# '${domain}' special cases:\n`;

    for (const path in summary[domain]) {
      const ip = summary[domain][path];

      if (ip && ip.length > 0) {
        hosts += `${domain}${path}\t${ip}\n`;
      }
      else {
        hosts += `# ${domain}${path}\t(no ip found)\n`;
      }
    }

    hosts += '\n';
  }
  else {
    hosts += '\n';
    hosts += `# ${domain}\t(no path found)\n`;
    hosts += '\n';
  }
}

console.log(`generating ${summaryFile}...`);

fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));

console.log(`generating ${hostsFile}...`);

fs.writeFileSync(hostsFile, hosts);

console.log(`done!`);
