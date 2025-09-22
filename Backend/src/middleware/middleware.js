const cors = require('cors');
const express = require('express');
const middle = express();

// Enable CORS for all routes
middle.use(cors());
middle.use(express.json());

//404 handler
function notFound(req, res, next) {
    res.status(404).json({ message: "Route not found" });
}

// Error handler
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
}

module.exports = { middle, notFound, errorHandler };