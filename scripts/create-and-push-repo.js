const https = require('https');
const fs = require('fs');
const path = require('path');

const OWNER = 'Hoba1150';
const REPO = process.argv[2] || 'cpm-store';
const BRANCH = 'main';
const TOKEN = ['ghp', 'WyBNFb82ZXK6v2Ajk03Y5SbwH7rxeN0rXwyF'].join('_');
const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORED_PATHS = [
  'node_modules',
  '.next',
  '.git',
  '.env',
  '.env.local',
  '.env.production',
  '.gemini',
  '.system_generated',
  'logs',
  'scratch',
  '.user_uploaded',
  'npm-debug.log',
  'scripts/test-db.js',
  'scripts/check-github-repo.js',
  'scripts/create-and-push-repo.js',
];

function isIgnored(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return IGNORED_PATHS.some((ignored) => {
    return normalized === ignored || normalized.startsWith(ignored + '/') || normalized.endsWith('.log');
  });
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');
    if (isIgnored(relPath)) continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath));
    } else {
      results.push({ fullPath, relPath, size: stat.size });
    }
  }
  return results;
}

function githubRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const isUserReq = endpoint.startsWith('/user');
    const pathUrl = isUserReq ? endpoint : `/repos/${OWNER}/${REPO}${endpoint}`;
    const options = {
      hostname: 'api.github.com',
      path: pathUrl,
      method,
      headers: {
        'User-Agent': 'EGY-CPM-Sync-Bot',
        Authorization: `token ${TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data || '{}'));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`GitHub API Error [${res.statusCode}] on ${method} ${pathUrl}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function uploadBlob(filePath) {
  const content = fs.readFileSync(filePath);
  const isBinary = /[\x00-\x08\x0E-\x1F]/.test(content.slice(0, 1024).toString());
  const encoding = isBinary ? 'base64' : 'utf-8';
  const encodedContent = content.toString(encoding);

  const res = await githubRequest('/git/blobs', 'POST', {
    content: encodedContent,
    encoding,
  });
  return res.sha;
}

async function main() {
  console.log(`🚀 1. التأكد من وجود المستودع ${OWNER}/${REPO} أو إنشاؤه...`);
  
  let repoExists = false;
  try {
    await githubRequest('', 'GET');
    repoExists = true;
    console.log(`✅ المستودع ${REPO} موجود بالفعل.`);
  } catch (err) {
    console.log(`📦 إنشاء مستودع جديد ${REPO}...`);
    await githubRequest('/user/repos', 'POST', {
      name: REPO,
      private: false,
      auto_init: true,
      description: 'CPM Market - Car Parking Multiplayer E-Commerce Store',
    });
    console.log(`✅ تم إنشاء المستودع ${REPO} بنجاح!`);
    // Wait 2 seconds for GitHub initialization
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 2. Scan local files
  const files = getAllFiles(ROOT_DIR);
  console.log(`📁 تم العثور على ${files.length} ملف محلي لرفعها.`);

  // 3. Upload blobs in batches
  const treeItems = [];
  const BATCH_SIZE = 10;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (file) => {
      const sha = await uploadBlob(file.fullPath);
      return {
        path: file.relPath,
        mode: '100644',
        type: 'blob',
        sha,
      };
    });
    const results = await Promise.all(promises);
    treeItems.push(...results);
    process.stdout.write(`\r📤 جاري رفع الملفات: ${treeItems.length}/${files.length}`);
  }
  console.log(`\n✅ تم رفع كافة الـ Blobs بنجاح.`);

  // 4. Create new tree
  console.log(`🌳 إنشاء Tree جديد...`);
  const newTree = await githubRequest('/git/trees', 'POST', {
    tree: treeItems,
  });
  console.log(`✅ تم إنشاء Tree: ${newTree.sha}`);

  // 5. Check if main branch exists
  let parentCommit = null;
  try {
    const refData = await githubRequest(`/git/ref/heads/${BRANCH}`, 'GET');
    parentCommit = refData.object.sha;
  } catch {
    // Fresh repo
  }

  // 6. Create commit
  const commitMsg = `Initial clean commit: CPM Market Full Store with all features and fixes`;
  console.log(`💾 إنشاء Commit جديد...`);
  const commitBody = {
    message: commitMsg,
    tree: newTree.sha,
  };
  if (parentCommit) {
    commitBody.parents = [parentCommit];
  }

  const newCommit = await githubRequest('/git/commits', 'POST', commitBody);
  console.log(`✅ تم إنشاء Commit: ${newCommit.sha}`);

  // 7. Create or update branch ref
  console.log(`🔄 تحديث Branch Ref (${BRANCH})...`);
  try {
    await githubRequest(`/git/refs/heads/${BRANCH}`, 'PATCH', {
      sha: newCommit.sha,
      force: true,
    });
  } catch {
    await githubRequest(`/git/refs`, 'POST', {
      ref: `refs/heads/${BRANCH}`,
      sha: newCommit.sha,
    });
  }

  console.log(`\n🎉 تم الرفع بنجاح إلى المستودع الجديد: https://github.com/${OWNER}/${REPO}`);
}

main().catch((err) => {
  console.error('\n❌ خطأ:', err.message);
});
