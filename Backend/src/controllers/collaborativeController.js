const yjs = require('../services/yjs-manager');

/**
 * Collaborative Document Controller
 * Demonstrates reading/writing shared Yjs data structures via REST API
 */

/**
 * GET /collab/doc/:docId
 * Retrieve the current state of a document as JSON
 */
exports.getDocument = (req, res) => {
    const { docId } = req.params;
    const ydoc = yjs.getOrCreateDoc(docId);
    const data = ydoc.getMap().toJSON();
    res.status(200).json({ docId, data });
};

/**
 * POST /collab/doc/:docId
 * Update document with new data
 * Body: { key, value } or { arrayName, items }
 */
exports.updateDocument = (req, res) => {
    const { docId } = req.params;
    const { key, value, arrayName, items } = req.body;

    if (key !== undefined && value !== undefined) {
        const ymap = yjs.getSharedMap(docId, 'root');
        ymap.set(key, value);
        res.status(200).json({ message: 'Document updated', key, value });
    } else if (arrayName && Array.isArray(items)) {
        const yarray = yjs.getSharedArray(docId, arrayName);
        yarray.delete(0, yarray.length);
        yarray.insert(0, items);
        res.status(200).json({ message: 'Array updated', arrayName, items });
    } else {
        res.status(400).json({ message: 'Invalid payload; provide { key, value } or { arrayName, items }' });
    }
};

/**
 * GET /collab/doc/:docId/text/:textName
 * Get shared text content
 */
exports.getSharedText = (req, res) => {
    const { docId, textName = 'default' } = req.params;
    const ytext = yjs.getSharedText(docId, textName);
    res.status(200).json({ docId, textName, content: ytext.toString() });
};

/**
 * POST /collab/doc/:docId/text/:textName
 * Append or set shared text content
 * Body: { content, replace? }
 */
exports.updateSharedText = (req, res) => {
    const { docId, textName = 'default' } = req.params;
    const { content, replace = false } = req.body;

    const ytext = yjs.getSharedText(docId, textName);
    if (replace) {
        ytext.delete(0, ytext.length);
    }
    ytext.insert(ytext.length, content);

    res.status(200).json({ message: 'Text updated', docId, textName, content });
};

/**
 * GET /collab/doc/:docId/awareness
 * Get all client awareness states (presence info)
 */
exports.getAwareness = (req, res) => {
    const { docId } = req.params;
    const states = yjs.getAwarenessStates(docId);
    res.status(200).json({ docId, awareness: states });
};

/**
 * GET /collab/doc/:docId/export
 * Export full document state as binary (for backup/analysis)
 */
exports.exportDocument = (req, res) => {
    const { docId } = req.params;
    const state = yjs.getFullState(docId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="doc-${docId}.yjs"`);
    res.send(Buffer.from(state));
};

/**
 * POST /collab/doc/:docId/destroy
 * Clean up document resources (careful!)
 */
exports.destroyDocument = (req, res) => {
    const { docId } = req.params;
    yjs.destroyDoc(docId);
    res.status(200).json({ message: 'Document destroyed', docId });
};

/**
 * GET /collab/persistence/stats
 * Get database statistics
 */
exports.getPersistenceStats = (req, res) => {
    const stats = yjs.getStats();
    res.status(200).json({ stats });
};

/**
 * GET /collab/persistence/documents
 * List all persisted document IDs
 */
exports.listPersistedDocuments = (req, res) => {
    const docIds = yjs.getAllDocumentIds();
    res.status(200).json({ documents: docIds, count: docIds.length });
};

/**
 * GET /collab/doc/:docId/metadata
 * Get document metadata
 */
exports.getDocumentMetadata = (req, res) => {
    const { docId } = req.params;
    const metadata = yjs.getDocumentMetadata(docId);
    res.status(200).json({ docId, metadata });
};

/**
 * POST /collab/doc/:docId/metadata
 * Save document metadata (name, description, owner)
 */
exports.saveDocumentMetadata = (req, res) => {
    const { docId } = req.params;
    const { name, description, owner } = req.body;
    yjs.saveDocumentMetadata(docId, { name, description, owner });
    res.status(200).json({ message: 'Metadata saved', docId, metadata: { name, description, owner } });
};
