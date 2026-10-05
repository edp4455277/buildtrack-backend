require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./config/db');

(async () => {
    const [email, password] = process.argv.slice(2);

    if (!email || !password) {
        console.log('Usage: node reset-password.js email password');
        process.exit(1);
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `UPDATE Users
             SET Password_Hash = ?,
    Is_Active = TRUE
             WHERE Email = ? `,
            [hash, email]
        );

        if (result.affectedRows === 0) {
            console.log('No user found with that email.');
            process.exit(1);
        }

        console.log('Password reset successfully.');
        console.log('User:', email);

        process.exit(0);

    } catch (err) {
        console.error('Error resetting password:', err.message);
        process.exit(1);
    }
})();

