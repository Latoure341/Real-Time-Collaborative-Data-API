const cors = require('cors');

// CORS middleware
const corsMiddleware = cors();

// 404 handler
function notFound(req, res, next) {
    res.status(404).json({ message: "Route not found" });
}

// Error handler
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
}

module.exports = { corsMiddleware, notFound, errorHandler };