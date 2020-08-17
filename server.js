//ssh -L 3306:db2.csse.canterbury.ac.nz:3306 jqi26@linux.cosc.canterbury.ac.nz

require('dotenv').config();
const db = require('./config/db');
const express = require('./config/express');

const app = express();
const port = process.env.PORT || 4941;

// Test connection to MySQL on start-up
async function testDbConnection() {
    try {
        await db.createPool();
        await db.getPool().getConnection();
    } catch (err) {
        console.error(`Unable to connect to MySQL: ${err.message}`);
        process.exit(1);
    }
}

testDbConnection()
    .then(function () {
        app.listen(port, function () {
            console.log(`Listening on port: ${port}`);
        });
    });
