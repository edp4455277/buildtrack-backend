const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('SUCCESS: Connected to BuildTrackDB!');

        const [rows] = await connection.query('SELECT DATABASE() AS database_name');
        console.log(rows);

        await connection.end();
    } catch (error) {
        console.log('DATABASE CONNECTION FAILED');
        console.log(error.message);
    }
}

testDatabase();