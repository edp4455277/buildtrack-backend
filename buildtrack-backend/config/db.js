const mysql = require('mysql2/promise');

require('dotenv').config();

console.log("DB HOST:", process.env.DB_HOST);
console.log("DB USER:", process.env.DB_USER);
console.log("DB NAME:", process.env.DB_NAME);
console.log("PASSWORD LOADED:", !!process.env.DB_PASS);

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'BuildTrackDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function ensureCompatibilityColumns() {
    const migrations = [
        'ALTER TABLE Projects ADD COLUMN Project_Location VARCHAR(150) NULL',
        'ALTER TABLE Projects ADD COLUMN Project_Total_Expenditure DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'ALTER TABLE Suppliers ADD COLUMN Service_Type VARCHAR(150) NULL',
        'ALTER TABLE Suppliers ADD COLUMN Balance_Due DECIMAL(14,2) NOT NULL DEFAULT 0.00',
        'ALTER TABLE Equipments ADD COLUMN Assigned_Project_ID INT NULL',
       // 'ALTER TABLE Equipments ADD CONSTRAINT fk_equipment_assigned_project FOREIGN KEY (Assigned_Project_ID) REFERENCES Projects(Project_ID)',
    ];

    for (const migration of migrations) {
        try {
            await pool.query(migration);
        } catch (error) {
            if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_CANT_CREATE_TABLE'].includes(error.code)) {
                throw error;
            }
        }
    }
}

pool.ensureCompatibilityColumns = ensureCompatibilityColumns;

module.exports = pool;