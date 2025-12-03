const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * PersistenceManager: Handles SQLite storage of Yjs documents
 * Stores document state and metadata for recovery on restart
 */
class PersistenceManager {
    constructor(dbPath = path.join(__dirname, '../../data/documents.db')) {
        this.dbPath = dbPath;
        this.db = null;
        this.init();
    }

    /**
     * Initialize database connection and create tables
     */
    init() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.db = new Database(this.dbPath);
            this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
            this.createTables();
            console.log(`✓ Database initialized at ${this.dbPath}`);
        } catch (err) {
            console.error('Database initialization error:', err);
            throw err;
        }
    }

    /**
     * Create database schema
     */
    createTables() {
        const createDocsTable = `
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                state BLOB NOT NULL,
                version INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const createUpdatesTable = `
            CREATE TABLE IF NOT EXISTS updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL,
                update_data BLOB NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        `;

        const createMetadataTable = `
            CREATE TABLE IF NOT EXISTS metadata (
                doc_id TEXT PRIMARY KEY,
                name TEXT,
                description TEXT,
                owner TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
            );
        `;

        try {
            this.db.exec(createDocsTable);
            this.db.exec(createUpdatesTable);
            this.db.exec(createMetadataTable);
        } catch (err) {
            console.error('Error creating tables:', err);
            throw err;
        }
    }

    /**
     * Save document state
     */
    saveDocument(docId, state) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO documents (id, state, version, updated_at)
                VALUES (?, ?, 
                    COALESCE((SELECT version FROM documents WHERE id = ?), 0) + 1,
                    CURRENT_TIMESTAMP)
            `);
            stmt.run(docId, state, docId);
            return true;
        } catch (err) {
            console.error(`Error saving document ${docId}:`, err);
            return false;
        }
    }

    /**
     * Load document state
     */
    loadDocument(docId) {
        try {
            const stmt = this.db.prepare('SELECT state FROM documents WHERE id = ?');
            const row = stmt.get(docId);
            return row ? row.state : null;
        } catch (err) {
            console.error(`Error loading document ${docId}:`, err);
            return null;
        }
    }

    /**
     * Save an incremental update
     */
    saveUpdate(docId, update) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO updates (doc_id, update_data)
                VALUES (?, ?)
            `);
            stmt.run(docId, update);
            return true;
        } catch (err) {
            console.error(`Error saving update for ${docId}:`, err);
            return false;
        }
    }

    /**
     * Get all updates for a document since a certain version
     */
    getUpdates(docId, sinceVersion = 0) {
        try {
            const stmt = this.db.prepare(`
                SELECT update_data FROM updates 
                WHERE doc_id = ? 
                ORDER BY id ASC 
                LIMIT 1000
            `);
            const rows = stmt.all(docId);
            return rows.map(row => row.update_data);
        } catch (err) {
            console.error(`Error retrieving updates for ${docId}:`, err);
            return [];
        }
    }

    /**
     * Get all document IDs
     */
    getAllDocumentIds() {
        try {
            const stmt = this.db.prepare('SELECT id FROM documents ORDER BY created_at DESC');
            return stmt.all().map(row => row.id);
        } catch (err) {
            console.error('Error retrieving document IDs:', err);
            return [];
        }
    }

    /**
     * Get document metadata
     */
    getMetadata(docId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM metadata WHERE doc_id = ?');
            return stmt.get(docId) || null;
        } catch (err) {
            console.error(`Error retrieving metadata for ${docId}:`, err);
            return null;
        }
    }

    /**
     * Save document metadata
     */
    saveMetadata(docId, metadata) {
        try {
            const { name, description, owner } = metadata;
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO metadata (doc_id, name, description, owner)
                VALUES (?, ?, ?, ?)
            `);
            stmt.run(docId, name, description, owner);
            return true;
        } catch (err) {
            console.error(`Error saving metadata for ${docId}:`, err);
            return false;
        }
    }

    /**
     * Delete a document and its data
     */
    deleteDocument(docId) {
        try {
            const stmt1 = this.db.prepare('DELETE FROM updates WHERE doc_id = ?');
            const stmt2 = this.db.prepare('DELETE FROM metadata WHERE doc_id = ?');
            const stmt3 = this.db.prepare('DELETE FROM documents WHERE id = ?');
            
            stmt1.run(docId);
            stmt2.run(docId);
            stmt3.run(docId);
            return true;
        } catch (err) {
            console.error(`Error deleting document ${docId}:`, err);
            return false;
        }
    }

    /**
     * Get database statistics
     */
    getStats() {
        try {
            const docCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get().count;
            const updateCount = this.db.prepare('SELECT COUNT(*) as count FROM updates').get().count;
            const dbSize = require('fs').statSync(this.dbPath).size;
            
            return {
                documents: docCount,
                updates: updateCount,
                dbSizeBytes: dbSize,
                dbSizeKB: (dbSize / 1024).toFixed(2)
            };
        } catch (err) {
            console.error('Error getting stats:', err);
            return null;
        }
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            console.log('Database connection closed');
        }
    }
}

module.exports = new PersistenceManager();
