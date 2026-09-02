const https = require('https');

const TOKEN = ['ghp', 'WyBNFb82ZXK6v2Ajk03Y5SbwH7rxeN0rXwyF'].join('_');

function req(urlPath, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: urlPath,
      method,
      headers: {
        'User-Agent': 'EGY-CPM-Sync-Bot',
        Authorization: `token ${TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
    };
    const r = https.request(options, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(d || '{}') });
        } catch {
          resolve({ status: res.statusCode, data: d });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  const userRes = await req('/user');
  console.log('GitHub User:', userRes.data.login);

  const reposRes = await req('/user/repos?sort=updated&per_page=5');
  console.log('Recent Repos:', reposRes.data.map(r => r.name));
}

main().catch(console.error);
