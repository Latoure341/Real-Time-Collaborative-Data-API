/**
 * AwarenessManager: Tracks client presence, activity, and collaborative state
 * Maintains real-time information about who is editing, where cursors are, etc.
 */
class AwarenessManager {
    constructor() {
        this.clients = new Map(); // clientId -> clientState
        this.roomClients = new Map(); // room -> Set<clientId>
    }

    /**
     * Register a client in a room
     */
    joinRoom(clientId, room, clientInfo = {}) {
        if (!this.roomClients.has(room)) {
            this.roomClients.set(room, new Set());
        }
        this.roomClients.get(room).add(clientId);

        const clientState = {
            id: clientId,
            room: room,
            joinedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            cursor: null,
            selection: null,
            color: this.generateUserColor(),
            name: clientInfo.name || `User ${clientId.slice(0, 5)}`,
            metadata: clientInfo.metadata || {},
            isActive: true
        };

        this.clients.set(clientId, clientState);
        return clientState;
    }

    /**
     * Remove a client from a room
     */
    leaveRoom(clientId, room) {
        if (this.roomClients.has(room)) {
            this.roomClients.get(room).delete(clientId);
            if (this.roomClients.get(room).size === 0) {
                this.roomClients.delete(room);
            }
        }
        this.clients.delete(clientId);
    }

    /**
     * Update client cursor position
     */
    updateCursor(clientId, cursor) {
        const client = this.clients.get(clientId);
        if (client) {
            client.cursor = cursor;
            client.lastActivity = new Date().toISOString();
            return client;
        }
        return null;
    }

    /**
     * Update client selection range
     */
    updateSelection(clientId, selection) {
        const client = this.clients.get(clientId);
        if (client) {
            client.selection = selection;
            client.lastActivity = new Date().toISOString();
            return client;
        }
        return null;
    }

    /**
     * Set client activity status
     */
    setActivity(clientId, isActive) {
        const client = this.clients.get(clientId);
        if (client) {
            client.isActive = isActive;
            client.lastActivity = new Date().toISOString();
            return client;
        }
        return null;
    }

    /**
     * Get all clients in a room
     */
    getRoomClients(room) {
        const clientIds = this.roomClients.get(room) || new Set();
        return Array.from(clientIds).map(id => this.clients.get(id)).filter(c => c);
    }

    /**
     * Get single client state
     */
    getClient(clientId) {
        return this.clients.get(clientId) || null;
    }

    /**
     * Get all active clients
     */
    getAllClients() {
        return Array.from(this.clients.values());
    }

    /**
     * Get clients in a room with their full state (for broadcasting)
     */
    getRoomPresence(room) {
        const clients = this.getRoomClients(room);
        return {
            room: room,
            count: clients.length,
            clients: clients.map(client => ({
                id: client.id,
                name: client.name,
                cursor: client.cursor,
                selection: client.selection,
                color: client.color,
                isActive: client.isActive,
                lastActivity: client.lastActivity
            }))
        };
    }

    /**
     * Get statistics for a room
     */
    getRoomStats(room) {
        const clients = this.getRoomClients(room);
        const activeClients = clients.filter(c => c.isActive);
        const now = new Date();

        return {
            room: room,
            totalClients: clients.length,
            activeClients: activeClients.length,
            inactiveClients: clients.length - activeClients.length,
            clientDetails: clients.map(client => ({
                id: client.id,
                name: client.name,
                isActive: client.isActive,
                idleDurationSeconds: Math.round((now - new Date(client.lastActivity)) / 1000),
                joinedAt: client.joinedAt
            }))
        };
    }

    /**
     * Update client metadata
     */
    updateClientMetadata(clientId, metadata) {
        const client = this.clients.get(clientId);
        if (client) {
            client.metadata = { ...client.metadata, ...metadata };
            return client;
        }
        return null;
    }

    /**
     * Detect inactive clients (haven't updated in N seconds)
     */
    getInactiveClients(inactiveThresholdSeconds = 300) {
        const now = new Date();
        const threshold = inactiveThresholdSeconds * 1000;

        return Array.from(this.clients.values()).filter(client => {
            const idleDuration = now - new Date(client.lastActivity);
            return idleDuration > threshold;
        });
    }

    /**
     * Clean up inactive clients (auto-remove after N seconds)
     */
    cleanupInactiveClients(inactiveThresholdSeconds = 600) {
        const inactiveClients = this.getInactiveClients(inactiveThresholdSeconds);
        inactiveClients.forEach(client => {
            this.leaveRoom(client.id, client.room);
            console.log(`Cleaned up inactive client: ${client.id} from ${client.room}`);
        });
        return inactiveClients.length;
    }

    /**
     * Generate a unique color for each user
     */
    generateUserColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B88B', '#ABEBC6', '#F5B7B1', '#D5A6BD'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Get total number of connected clients
     */
    getTotalClients() {
        return this.clients.size;
    }

    /**
     * Get number of rooms with active clients
     */
    getActiveRoomCount() {
        return this.roomClients.size;
    }

    /**
     * Export full awareness state (for debugging/monitoring)
     */
    exportState() {
        return {
            totalClients: this.clients.size,
            activeRooms: this.roomClients.size,
            rooms: Array.from(this.roomClients.entries()).map(([room, clientIds]) => ({
                room: room,
                clientCount: clientIds.size,
                clients: Array.from(clientIds).map(id => this.clients.get(id))
            }))
        };
    }
}

module.exports = new AwarenessManager();
