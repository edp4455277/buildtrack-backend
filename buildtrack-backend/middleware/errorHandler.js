function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

function errorHandler(error, req, res, next) {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    const status = error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
    res.status(status).json({
        error: error.message || 'Internal server error',
    });
}

module.exports = { notFoundHandler, errorHandler };
