const express = require('express');
const path = require('path');
const serveIndex = require('serve-index');
const fs = require('fs'); // Make sure to require fs to check directory stats

const app = express();

// Serve static files from the 'public' directory
app.use('/', express.static(path.join(__dirname, '/')));

// Serve directory listing for all folders inside 'public'
app.use('/*', (req, res, next) => {
    const folderPath = path.join(__dirname, '/', req.params[0]);
    
    // Check if the path is a directory
    fs.stat(folderPath, (err, stats) => {
        if (err || !stats.isDirectory()) {
            return next();  // If it's not a directory, proceed to the next handler
        }
        
        // Serve directory listing using serve-index
        serveIndex(folderPath, {'icons': true})(req, res, next);
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
