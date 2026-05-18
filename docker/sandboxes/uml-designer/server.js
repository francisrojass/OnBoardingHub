const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PROJECT_DIR = '/root/workspace/library-model';
const MODELS_DIR = path.join(PROJECT_DIR, 'Models');

// Ensure project structure exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // Prevent browser caching (sandbox isolation)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API: Save generated code
  if (req.method === 'POST' && req.url === '/api/save-code') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { code, classes } = JSON.parse(body);
        
        if (!code || typeof code !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'No code provided' }));
          return;
        }

        // Write full file
        const filePath = path.join(MODELS_DIR, 'Models.cs');
        fs.writeFileSync(filePath, code, 'utf-8');
        
        // Also write individual class files
        const files = ['Models.cs'];
        if (classes && Array.isArray(classes)) {
          classes.forEach(className => {
            // Extract class code from full code
            const regex = new RegExp(`(    public class ${className}[\\s\\S]*?\\n    \\})`, 'm');
            const match = code.match(regex);
            if (match) {
              const classCode = `namespace LibraryModel.Models\n{\n${match[1]}\n}\n`;
              const classFile = `${className}.cs`;
              fs.writeFileSync(path.join(MODELS_DIR, classFile), classCode, 'utf-8');
              files.push(classFile);
            }
          });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, files }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // Static files
  const urlPath = req.url.split('?')[0];
  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  filePath = path.join(__dirname, filePath);
  
  // Prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`UML Designer server running on port ${PORT}`);
});
