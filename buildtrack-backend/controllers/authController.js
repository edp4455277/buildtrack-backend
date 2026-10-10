function login(req, res) {
    return res.status(200).json({
        success: true,
        message: 'Login successful',
        token: 'mock-jwt-token-xyz123',
        user: { id: 1, email: 'admin@buildtrack.com', role: 'Admin' }
    });
}

module.exports = { login };
