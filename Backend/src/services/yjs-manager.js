const Y = require('yjs');
const persistence = require('../db/persistence');

/**
 * YjsManager: Manages Yjs documents and awareness for collaborative editing
 * Each room has its own Y.Doc instance shared across all connected clients
 * Integrates persistence for automatic save/load
 */
class YjsManager {
    constructor() {
        this.docs = new Map(); // docId -> Y.Doc
        this.updateSubscriptions = new Map(); // docId -> observer function
    }

    /**
     * Get or create a Y.Doc for a given document/room
     * Loads from database if it exists, otherwise creates new
     */
    getOrCreateDoc(docId) {
        if (!this.docs.has(docId)) {
            const ydoc = new Y.Doc();
            
            // Try to load persisted state
            const savedState = persistence.loadDocument(docId);
            if (savedState) {
                try {
                    Y.applyUpdate(ydoc, savedState);
                    console.log(`✓ Loaded document ${docId} from database`);
                } catch (err) {
                    console.error(`Error loading document ${docId}:`, err);
                }
            }

            // Subscribe to updates and persist them
            const updateObserver = (update, origin) => {
                // Don't persist updates that come from loading
                if (origin !== 'load') {
                    persistence.saveDocument(docId, Y.encodeStateAsUpdate(ydoc));
                    persistence.saveUpdate(docId, update);
                }
            };

            ydoc.on('update', updateObserver);
            this.docs.set(docId, ydoc);
            this.updateSubscriptions.set(docId, updateObserver);
        }
        return this.docs.get(docId);
    }

    /**
     * Broadcast Yjs state update to all clients in a room
     * Socket.IO will handle the actual transmission
     */
    encodeStateAsUpdate(docId) {
        const ydoc = this.getOrCreateDoc(docId);
        return Y.encodeStateAsUpdate(ydoc);
    }

    /**
     * Apply update from a client to the document
     */
    applyUpdate(docId, update) {
        const ydoc = this.getOrCreateDoc(docId);
        try {
            Y.applyUpdate(ydoc, update);
        } catch (err) {
            console.error(`Error applying update to doc ${docId}:`, err);
        }
    }

    /**
     * Get initial state (full document) for a new client
     */
    getFullState(docId) {
        const ydoc = this.getOrCreateDoc(docId);
        return Y.encodeStateAsUpdate(ydoc);
    }

    /**
     * Update client awareness (cursor position, selection, etc.)
     * Simplified: stores state by clientId in a shared map
     */
    updateAwareness(docId, clientId, state) {
        const ydoc = this.getOrCreateDoc(docId);
        const awarenessMap = ydoc.getMap('awareness');
        awarenessMap.set(clientId, state);
    }

    /**
     * Get all clients' awareness states
     */
    getAwarenessStates(docId) {
        const ydoc = this.getOrCreateDoc(docId);
        const awarenessMap = ydoc.getMap('awareness');
        const states = {};
        awarenessMap.forEach((state, clientId) => {
            states[clientId] = state;
        });
        return states;
    }

    /**
     * Clean up resources for a document (optional, for memory management)
     */
    destroyDoc(docId) {
        const ydoc = this.docs.get(docId);
        if (ydoc) {
            const updateObserver = this.updateSubscriptions.get(docId);
            if (updateObserver) {
                ydoc.off('update', updateObserver);
            }
            ydoc.destroy();
        }
        this.docs.delete(docId);
        this.updateSubscriptions.delete(docId);
        persistence.deleteDocument(docId);
    }

    /**
     * Get shared data structures from a document
     */
    getSharedArray(docId, name = 'default') {
        const ydoc = this.getOrCreateDoc(docId);
        let yarray = ydoc.getArray(name);
        if (!yarray) {
            yarray = new Y.Array();
            ydoc.getMap().set(name, yarray);
        }
        return yarray;
    }

    getSharedMap(docId, name = 'default') {
        const ydoc = this.getOrCreateDoc(docId);
        let ymap = ydoc.getMap(name);
        if (!ymap) {
            ymap = new Y.Map();
            ydoc.getMap().set(name, ymap);
        }
        return ymap;
    }

    getSharedText(docId, name = 'default') {
        const ydoc = this.getOrCreateDoc(docId);
        let ytext = ydoc.getText(name);
        if (!ytext) {
            ytext = new Y.Text();
            ydoc.getMap().set(name, ytext);
        }
        return ytext;
    }

    /**
     * Get database statistics
     */
    getStats() {
        return persistence.getStats();
    }

    /**
     * Get all persisted document IDs
     */
    getAllDocumentIds() {
        return persistence.getAllDocumentIds();
    }

    /**
     * Get metadata for a document
     */
    getDocumentMetadata(docId) {
        return persistence.getMetadata(docId);
    }

    /**
     * Save metadata for a document
     */
    saveDocumentMetadata(docId, metadata) {
        return persistence.saveMetadata(docId, metadata);
    }
}

module.exports = new YjsManager();
