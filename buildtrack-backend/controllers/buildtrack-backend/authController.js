const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { success, failure } = require('./dbHelpers');

async function login(req, res) {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return failure(res, { message: 'Email and password are required' }, 400);
        }

        const [rows] = await db.query('SELECT * FROM Users WHERE Email = ?', [email]);
        const user = rows[0];
        const ok = user && await bcrypt.compare(password, user.Password_Hash);
        if (!ok) {
            return failure(res, { message: 'Invalid email or password' }, 401);
        }

        const token = jwt.sign(
            { id: user.User_ID, role: user.Role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        return success(res, { token, user: { email: user.Email, role: user.Role } });
    } catch (error) {
        return failure(res, error);
    }
}

module.exports = { login };
