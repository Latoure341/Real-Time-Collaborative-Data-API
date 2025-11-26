require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const { Server } = require('socket.io');

//Middleware
app.use(express.json());
//Logging Middleware
app.use(morgan('dev'));
//Custom Middleware
const { middle, notFound, errorHandler } = require("./middleware/middleware");
app.use(middle);

//Routing
const router = require("./router/router");
app.use(router);

//404 and error handling (mount after routes)
app.use(notFound);
app.use(errorHandler);

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// Make io accessible from routes/controllers if needed
app.set('io', io);

// Basic Socket.IO handlers (rooms/messages)
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        socket.to(room).emit('user-joined', { id: socket.id });
    });

    socket.on('leave', (room) => {
        socket.leave(room);
        socket.to(room).emit('user-left', { id: socket.id });
    });

    socket.on('message', (payload) => {
        // payload should include { room, message }
        if (payload && payload.room) {
            io.to(payload.room).emit('message', { from: socket.id, message: payload.message });
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', socket.id, 'reason:', reason);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log("Server (HTTP + Socket.IO) is running on port " + PORT);
});
