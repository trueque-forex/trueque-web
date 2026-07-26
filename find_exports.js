const fs = require('fs');
const path = require('path');

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'api') checkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('export default')) {
                console.log('Missing default export:', fullPath);
            }
        }
    }
}

checkDir(path.join(__dirname, 'src', 'pages'));
