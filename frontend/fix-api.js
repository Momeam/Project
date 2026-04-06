const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.next') return;
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/KawinGuy/Documents/GitHub/Project/frontend/src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Pattern 1: Template literals `http://localhost:5000/api/...` -> `/api/...`
    content = content.replace(/`http:\/\/localhost:5000\/api/g, '`/api');
    
    // Pattern 2: Process.env lines in stores (like useAuthStore.ts)
    content = content.replace(/\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:5000\/api'\}/g, '/api');

    // Pattern 3: Single quotes 'http://localhost:5000/api/...' -> '/api/...'
    content = content.replace(/'http:\/\/localhost:5000\/api/g, "'/api");

    // Pattern 4: Double quotes "http://localhost:5000/api/..." -> "/api/..."
    content = content.replace(/"http:\/\/localhost:5000\/api/g, '"/api');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
        changedFiles++;
    }
});

console.log(`\nUpdated ${changedFiles} files successfully.`);
