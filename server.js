/**
 * Utilitarian LLM Chat Interface - Local Server & Streaming CORS Proxy
 * Zero npm dependencies. Uses standard Node.js libraries only.
 * 
 * Usage:
 *   agy-node server.js
 *   or
 *   node server.js [port]
 */

const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const PORT = parseInt(process.argv[2] || process.env.PORT || '3000', 10);
const PUBLIC_DIR = __dirname;
const WORKSPACE_DIR = path.join(__dirname, 'workspace');

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Global CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. Streaming Proxy Endpoint: POST /api/proxy
  if (pathname === '/api/proxy' && req.method === 'POST') {
    handleProxyRequest(req, res);
    return;
  }

  // 2. Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', workspace: WORKSPACE_DIR, time: new Date().toISOString() }));
    return;
  }

  // 3. Workspace API Endpoints
  if (pathname.startsWith('/api/workspace/')) {
    handleWorkspaceApi(req, res, pathname, parsedUrl.query);
    return;
  }

  // 4. Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(PUBLIC_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error: ' + readErr.message);
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

/**
 * Forwards requests to remote LLM endpoints and pipes back streaming responses.
 */
function handleProxyRequest(req, res) {
  let bodyBuffer = '';

  req.on('data', chunk => {
    bodyBuffer += chunk;
  });

  req.on('end', () => {
    try {
      const payload = JSON.parse(bodyBuffer);
      const targetUrl = payload.url;
      const targetMethod = payload.method || 'POST';
      const targetHeaders = payload.headers || {};
      const targetBody = payload.body ? (typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body)) : null;

      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Target URL is required' }));
        return;
      }

      const parsedTarget = url.parse(targetUrl);
      const isHttps = parsedTarget.protocol === 'https:';
      const client = isHttps ? https : http;

      // Filter headers
      delete targetHeaders['host'];
      delete targetHeaders['content-length'];

      if (targetBody) {
        targetHeaders['Content-Type'] = targetHeaders['Content-Type'] || 'application/json';
        targetHeaders['Content-Length'] = Buffer.byteLength(targetBody);
      }

      const clientReq = client.request({
        hostname: parsedTarget.hostname,
        port: parsedTarget.port || (isHttps ? 443 : 80),
        path: parsedTarget.path,
        method: targetMethod,
        headers: targetHeaders
      }, (clientRes) => {
        // Forward response headers
        const resHeaders = { ...clientRes.headers };
        resHeaders['access-control-allow-origin'] = '*';

        res.writeHead(clientRes.statusCode, resHeaders);

        // Pipe streaming chunks
        clientRes.pipe(res);
      });

      clientReq.on('error', (err) => {
        console.error('[Proxy Error]:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy forwarding failed: ' + err.message }));
        }
      });

      if (targetBody) {
        clientReq.write(targetBody);
      }
      clientReq.end();

    } catch (parseErr) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON payload: ' + parseErr.message }));
    }
  });
}

/**
 * Real Workspace API: Tree, Read, Write, Edit, Delete, Exec, and Repo Outline
 */
function handleWorkspaceApi(req, res, pathname, query) {
  function sendJson(status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  function resolveWorkspacePath(relativePath) {
    const cleanPath = path.normalize((relativePath || '').replace(/^[\\\/]+/, ''));
    const fullPath = path.join(WORKSPACE_DIR, cleanPath);
    if (!fullPath.startsWith(WORKSPACE_DIR)) {
      throw new Error('Access denied: path outside workspace');
    }
    return { fullPath, cleanPath };
  }

  // 1. GET /api/workspace/tree
  if (pathname === '/api/workspace/tree' && req.method === 'GET') {
    try {
      const tree = scanDir(WORKSPACE_DIR, '');
      sendJson(200, { success: true, root: WORKSPACE_DIR, tree });
    } catch (e) {
      sendJson(500, { success: false, error: e.message });
    }
    return;
  }

  // 2. GET /api/workspace/file?path=...
  if (pathname === '/api/workspace/file' && req.method === 'GET') {
    try {
      const { fullPath, cleanPath } = resolveWorkspacePath(query.path);
      if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
        sendJson(404, { success: false, error: `File not found: ${cleanPath}` });
        return;
      }
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      sendJson(200, { success: true, path: cleanPath, content, lines, size: Buffer.byteLength(content) });
    } catch (e) {
      sendJson(500, { success: false, error: e.message });
    }
    return;
  }

  // Helper for reading JSON body
  function readBody(callback) {
    let buf = '';
    req.on('data', chunk => { buf += chunk; });
    req.on('end', () => {
      try {
        const body = buf ? JSON.parse(buf) : {};
        callback(null, body);
      } catch (err) {
        callback(err);
      }
    });
  }

  // 3. POST /api/workspace/write
  if (pathname === '/api/workspace/write' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { success: false, error: 'Invalid JSON body' });
      try {
        const { fullPath, cleanPath } = resolveWorkspacePath(body.path);
        const parentDir = path.dirname(fullPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        const content = body.content || '';
        fs.writeFileSync(fullPath, content, 'utf8');
        const lines = content.split('\n').length;
        sendJson(200, { success: true, path: cleanPath, lines, size: Buffer.byteLength(content) });
      } catch (e) {
        sendJson(500, { success: false, error: e.message });
      }
    });
    return;
  }

  // 4. POST /api/workspace/edit (Surgical search & replace)
  if (pathname === '/api/workspace/edit' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { success: false, error: 'Invalid JSON body' });
      try {
        const { fullPath, cleanPath } = resolveWorkspacePath(body.path);
        if (!fs.existsSync(fullPath)) {
          return sendJson(404, { success: false, error: `File not found: ${cleanPath}` });
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        const target = body.target || body.search;
        const replacement = body.replacement !== undefined ? body.replacement : (body.replace || '');
        if (!target) {
          return sendJson(400, { success: false, error: 'Target / search string is required' });
        }
        if (!content.includes(target)) {
          return sendJson(400, { success: false, error: 'Target string not found in file' });
        }
        const newContent = content.replace(target, replacement);
        fs.writeFileSync(fullPath, newContent, 'utf8');
        sendJson(200, { success: true, path: cleanPath, lines: newContent.split('\n').length });
      } catch (e) {
        sendJson(500, { success: false, error: e.message });
      }
    });
    return;
  }

  // 5. POST /api/workspace/delete
  if (pathname === '/api/workspace/delete' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { success: false, error: 'Invalid JSON body' });
      try {
        const { fullPath, cleanPath } = resolveWorkspacePath(body.path);
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
        }
        sendJson(200, { success: true, path: cleanPath });
      } catch (e) {
        sendJson(500, { success: false, error: e.message });
      }
    });
    return;
  }

  // 6. POST /api/workspace/exec (Run shell command in workspace)
  if (pathname === '/api/workspace/exec' && req.method === 'POST') {
    readBody((err, body) => {
      if (err || !body.command) return sendJson(400, { success: false, error: 'command is required' });
      const startTime = Date.now();
      exec(body.command, { cwd: WORKSPACE_DIR, timeout: 30000, maxBuffer: 1024 * 1024 }, (execErr, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        sendJson(200, {
          success: !execErr,
          command: body.command,
          stdout: stdout || '',
          stderr: stderr || (execErr ? execErr.message : ''),
          exitCode: execErr ? (execErr.code || 1) : 0,
          durationMs
        });
      });
    });
    return;
  }

  // 7. GET /api/workspace/repoprompt (Compact repository outline)
  if (pathname === '/api/workspace/repoprompt' && req.method === 'GET') {
    try {
      const summary = generateRepoSummary(WORKSPACE_DIR, '');
      sendJson(200, { success: true, summary });
    } catch (e) {
      sendJson(500, { success: false, error: e.message });
    }
    return;
  }

  sendJson(404, { success: false, error: 'Unknown workspace endpoint' });
}

function scanDir(dir, prefix) {
  const IGNORE = new Set(['.git', 'node_modules', '.cache', 'dist', 'build', '.DS_Store', 'Thumbs.db']);
  const items = [];
  if (!fs.existsSync(dir)) return items;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE.has(entry.name)) continue;
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      items.push({
        name: entry.name,
        path: relPath,
        type: 'directory',
        children: scanDir(full, relPath)
      });
    } else if (entry.isFile()) {
      const stat = fs.statSync(full);
      items.push({
        name: entry.name,
        path: relPath,
        type: 'file',
        size: stat.size
      });
    }
  }
  return items;
}

function generateRepoSummary(dir, prefix) {
  const IGNORE = new Set(['.git', 'node_modules', '.cache', 'dist', 'build', '.DS_Store', 'Thumbs.db']);
  const lines = ['<repository_map>'];

  function walk(currentDir, currentPrefix) {
    if (!fs.existsSync(currentDir)) return;
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE.has(entry.name)) continue;
      const relPath = currentPrefix ? `${currentPrefix}/${entry.name}` : entry.name;
      const full = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(full, relPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          const lineCount = content.split('\n').length;
          // Extract top exported symbols or declarations
          const symbols = [];
          const symbolMatches = content.match(/^(?:export\s+(?:default\s+)?(?:class|function|const|let|var|type|interface)\s+([a-zA-Z0-9_$]+)|def\s+([a-zA-Z0-9_]+)|class\s+([a-zA-Z0-9_]+))/gm);
          if (symbolMatches) {
            symbols.push(symbolMatches.slice(0, 5).join('; '));
          }
          lines.push(`- ${relPath} (${lineCount} lines)${symbols.length ? ' :: ' + symbols[0] : ''}`);
        } catch (e) {
          lines.push(`- ${relPath}`);
        }
      }
    }
  }

  walk(dir, prefix);
  lines.push('</repository_map>');
  return lines.join('\n');
}

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`  LLM Chat Workspace Server Running`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  CORS Proxy: http://localhost:${PORT}/api/proxy`);
  console.log(`  Static Root: ${PUBLIC_DIR}`);
  console.log(`======================================================\n`);
});
