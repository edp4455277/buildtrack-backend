require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
    const [email, password] = process.argv.slice(2);

    if (!email || !password) {
        console.log('Usage: node create-user.js email password');
        process.exit(1);
    }

    try {
        // Employee ID for the BuildTrack account
        const employeeId = 1;

        // Check that the employee exists
        const [employees] = await db.query(
            'SELECT Employee_ID FROM Employees WHERE Employee_ID = ?',
            [employeeId]
        );

        if (employees.length === 0) {
            console.error('Employee_ID 1 does not exist.');
            process.exit(1);
        }

        // Check whether this email already exists
        const [existingUsers] = await db.query(
            'SELECT User_ID FROM Users WHERE Email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            console.error('A user with this email already exists.');
            process.exit(1);
        }

        // Generate bcrypt password hash
        const hash = await bcrypt.hash(password, 10);

        // Create the user
        await db.query(
            `INSERT INTO Users
            (Employee_ID, Email, Password_Hash, Role, Is_Active)
            VALUES (?, ?, ?, ?, ?)`,
            [employeeId, email, hash, 'Admin', true]
        );

        console.log('User created successfully:', email);
        console.log('Employee ID:', employeeId);
        console.log('Role: Admin');

        process.exit(0);

    } catch (err) {
        console.error('Error creating user:', err.message);
        process.exit(1);
    }
})();

