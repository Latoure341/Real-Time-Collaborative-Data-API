require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = process.env.PORT || 3000;
const http = require('http');
const { Server } = require('socket.io');
const yjs = require('./services/yjs-manager');
const awareness = require('./services/awareness-manager');

//Middleware
app.use(express.json());
//Logging Middleware
app.use(morgan('dev'));
//Custom Middleware
const { corsMiddleware, notFound, errorHandler } = require("./middleware/middleware");
app.use(corsMiddleware);

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

// Basic Socket.IO handlers (rooms/messages + Yjs sync + Presence/Awareness)
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    /**
     * Join a collaborative document room with presence tracking
     * Payload: { docId, room, clientInfo }
     */
    socket.on('join', (payload) => {
        const { docId = 'default', room = 'default', clientInfo = {} } = typeof payload === 'string' ? { room: payload } : payload;
        socket.join(room);

        // Register client in awareness manager
        const clientState = awareness.joinRoom(socket.id, room, clientInfo);
        console.log(`Client ${socket.id} joined room ${room}`);

        // Send initial document state to the joining client
        const state = yjs.getFullState(docId);
        socket.emit('sync-state', { docId, state: Array.from(state) });

        // Send presence information to joining client
        const roomPresence = awareness.getRoomPresence(room);
        socket.emit('presence-init', roomPresence);

        // Notify others of new client
        socket.to(room).emit('client-joined', clientState);
    });

    socket.on('leave', (payload) => {
        const { room = 'default' } = typeof payload === 'string' ? { room: payload } : payload;
        socket.leave(room);
        
        // Unregister from awareness
        const clientState = awareness.getClient(socket.id);
        awareness.leaveRoom(socket.id, room);
        
        socket.to(room).emit('client-left', { id: socket.id, name: clientState?.name });
    });

    /**
     * Receive Yjs updates from clients and broadcast to room
     * Payload: { docId, update, room }
     */
    socket.on('yjs-update', (payload) => {
        const { docId = 'default', update, room = 'default' } = payload || {};
        if (!update) return;

        // Apply update to local Yjs document
        yjs.applyUpdate(docId, Buffer.from(update));

        // Broadcast update to all clients in the room (except sender)
        socket.to(room).emit('yjs-update', { docId, update });
    });

    /**
     * Handle generic messages
     */
    socket.on('message', (payload) => {
        const { room = 'default', message } = payload || {};
        if (room) {
            io.to(room).emit('message', { from: socket.id, message });
        }
    });

    /**
     * Update client cursor position
     * Payload: { room, cursor }
     */
    socket.on('cursor-move', (payload) => {
        const { room = 'default', cursor } = payload || {};
        awareness.updateCursor(socket.id, cursor);
        socket.to(room).emit('cursor-move', {
            clientId: socket.id,
            cursor: cursor
        });
    });

    /**
     * Update client text selection
     * Payload: { room, selection }
     */
    socket.on('selection-change', (payload) => {
        const { room = 'default', selection } = payload || {};
        awareness.updateSelection(socket.id, selection);
        socket.to(room).emit('selection-change', {
            clientId: socket.id,
            selection: selection
        });
    });

    /**
     * Update client activity status
     * Payload: { room, isActive }
     */
    socket.on('activity-status', (payload) => {
        const { room = 'default', isActive } = payload || {};
        awareness.setActivity(socket.id, isActive);
        socket.to(room).emit('activity-status', {
            clientId: socket.id,
            isActive: isActive
        });
    });

    /**
     * Request presence information for a room
     */
    socket.on('get-presence', (room = 'default') => {
        const roomPresence = awareness.getRoomPresence(room);
        socket.emit('presence-data', roomPresence);
    });

    /**
     * Update client awareness (cursor, selection, presence)
     * Payload: { docId, awareness, room }
     */
    socket.on('awareness-update', (payload) => {
        const { docId = 'default', awareness: awarenessData, room = 'default' } = payload || {};
        if (awarenessData) {
            yjs.updateAwareness(docId, socket.id, awarenessData);
            // Broadcast awareness to room
            socket.to(room).emit('awareness-update', {
                clientId: socket.id,
                awareness: awarenessData
            });
        }
    });

    socket.on('disconnect', (reason) => {
        const clientState = awareness.getClient(socket.id);
        if (clientState) {
            awareness.leaveRoom(socket.id, clientState.room);
            console.log(`Socket disconnected: ${socket.id} from ${clientState.room} (${reason})`);
        } else {
            console.log('Socket disconnected:', socket.id, 'reason:', reason);
        }
    });
});

// Periodic cleanup of inactive clients (every 5 minutes)
setInterval(() => {
    const cleaned = awareness.cleanupInactiveClients(600); // 10 minutes threshold
    if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} inactive clients`);
    }
}, 5 * 60 * 1000);

// Start the server
server.listen(PORT, () => {
    console.log("Server (HTTP + Socket.IO) is running on port " + PORT);
});
