// compile-data.js (Save in your root directory)
const fs = require('fs');
const path = require('path');

function buildDatabase() {
    let database = { faculty: [], achievers: [], studentLife: [] };
    
    const collections = [
        { key: 'faculty', dir: './content/faculty' },
        { key: 'achievers', dir: './content/achievers' },
        { key: 'studentLife', dir: './content/student-life' }
    ];

    collections.forEach(col => {
        if (fs.existsSync(col.dir)) {
            const files = fs.readdirSync(col.dir);
            files.forEach(file => {
                if (file.endsWith('.md') || file.endsWith('.json')) {
                    const content = fs.readFileSync(path.join(col.dir, file), 'utf8');
                    database[col.key].push({ file, content });
                }
            });
        }
    });

    // Make sure the target directory exists before writing
    const targetDir = path.join(__dirname, 'netlify', 'functions');
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, 'campus-data.json');
    fs.writeFileSync(targetPath, JSON.stringify(database, null, 2));
    console.log('✨ CampusBuddy Knowledge Matrix successfully built and synced into netlify/functions!');
}

buildDatabase();
