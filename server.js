/**
 * ============================================================================
 * NODE.JS STATIC HTTP WEB SERVER (server.js)
 * ============================================================================
 * Purpose: Optional Node.js web server executor for serving static files over
 *          HTTP at http://localhost:3000/
 * Run via: `node server.js` or `npm start`
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;

// MIME Types Mapping
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.md': 'text/markdown; charset=utf-8'
};

// Create HTTP Server
const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

// Start listening
server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n==================================================`);
    console.log(`🚀 Forever Incremental Web Server is Live!`);
    console.log(`🔗 URL: ${url}`);
    console.log(`==================================================\n`);

    // Auto open browser on default platform
    const startCmd = process.platform === 'win32' ? `start ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
    exec(startCmd, (execErr) => {
        if (execErr) console.log(`Note: Open ${url} in your browser.`);
    });
});
