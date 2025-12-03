const awareness = require('../services/awareness-manager');

/**
 * Presence / Awareness Controller
 * Exposes endpoints for querying client presence and activity
 */

/**
 * GET /presence/rooms
 * Get list of all active rooms
 */
exports.getActiveRooms = (req, res) => {
    const state = awareness.exportState();
    res.status(200).json({
        activeRooms: state.activeRooms,
        rooms: state.rooms.map(r => ({
            name: r.room,
            clientCount: r.clientCount,
            clients: r.clients.map(c => ({ id: c.id, name: c.name, isActive: c.isActive }))
        }))
    });
};

/**
 * GET /presence/room/:room
 * Get presence information for a specific room
 */
exports.getRoomPresence = (req, res) => {
    const { room } = req.params;
    const presence = awareness.getRoomPresence(room);
    res.status(200).json(presence);
};

/**
 * GET /presence/room/:room/stats
 * Get statistics for a room (active/inactive clients, idle duration, etc.)
 */
exports.getRoomStats = (req, res) => {
    const { room } = req.params;
    const stats = awareness.getRoomStats(room);
    res.status(200).json(stats);
};

/**
 * GET /presence/client/:clientId
 * Get state of a specific client
 */
exports.getClientPresence = (req, res) => {
    const { clientId } = req.params;
    const client = awareness.getClient(clientId);
    
    if (!client) {
        return res.status(404).json({ error: 'Client not found', clientId });
    }

    res.status(200).json(client);
};

/**
 * GET /presence/stats
 * Get global presence statistics
 */
exports.getGlobalStats = (req, res) => {
    const totalClients = awareness.getTotalClients();
    const activeRooms = awareness.getActiveRoomCount();
    const allClients = awareness.getAllClients();
    const activeClients = allClients.filter(c => c.isActive).length;

    res.status(200).json({
        totalClients: totalClients,
        activeClients: activeClients,
        inactiveClients: totalClients - activeClients,
        activeRooms: activeRooms,
        summary: {
            clientsPerRoom: totalClients > 0 ? (totalClients / activeRooms).toFixed(2) : 0,
            activityRate: totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(2) + '%' : '0%'
        }
    });
};

/**
 * POST /presence/check-inactive
 * Find and optionally clean up inactive clients
 * Query: ?threshold=600 (seconds, default 600 = 10 minutes)
 * Query: ?cleanup=true (auto-remove inactive clients)
 */
exports.checkInactiveClients = (req, res) => {
    const threshold = parseInt(req.query.threshold) || 600;
    const cleanup = req.query.cleanup === 'true';

    const inactiveClients = awareness.getInactiveClients(threshold);
    let removed = 0;

    if (cleanup) {
        inactiveClients.forEach(client => {
            awareness.leaveRoom(client.id, client.room);
            removed++;
        });
    }

    res.status(200).json({
        threshold: threshold,
        inactiveClientsFound: inactiveClients.length,
        clientsRemoved: removed,
        clients: inactiveClients.map(c => ({
            id: c.id,
            name: c.name,
            room: c.room,
            lastActivity: c.lastActivity,
            joinedAt: c.joinedAt
        }))
    });
};

/**
 * GET /presence/export
 * Export full awareness state (for debugging/monitoring)
 */
exports.exportState = (req, res) => {
    const state = awareness.exportState();
    res.status(200).json(state);
};
