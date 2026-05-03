
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function checkDb(dbName) {
    console.log(`--- CHECKING ${dbName} ---`);
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database(dbName, (err) => {
            if (err) {
                console.log(`Failed to open ${dbName}: ${err.message}`);
                return resolve();
            }
        });

        db.all(`SELECT id, email, tid, trueque_id, created_at FROM users ORDER BY created_at DESC LIMIT 5`, [], (err, rows) => {
            if (err) {
                console.log(`Error querying ${dbName}: ${err.message}`);
            } else {
                console.log(JSON.stringify(rows, null, 2));
            }
            db.close();
            resolve();
        });
    });
}

async function run() {
    await checkDb('trueque.db');
    await checkDb('trueque_dev.db');
    await checkDb('test.db');
}

run();
