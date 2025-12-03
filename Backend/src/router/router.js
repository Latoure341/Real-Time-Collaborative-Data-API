const express = require('express');
const router = express.Router();
const { getDocument, updateDocument, getSharedText, updateSharedText, getAwareness, exportDocument, destroyDocument, getPersistenceStats, listPersistedDocuments, getDocumentMetadata, saveDocumentMetadata } = require('../controllers/collaborativeController');
const { getActiveRooms, getRoomPresence, getRoomStats, getClientPresence, getGlobalStats, checkInactiveClients, exportState } = require('../controllers/presenceController');

//Landing page
router.get("/", (req, res)=>{
    res.status(200).send("Real-Time Collaborative Data API is running");
})
//About page
router.get("/about", (req, res)=>{
    res.status(200).send("This is a Real-Time Collaborative Data API built with Express.js");
})
//Login page
router.post("/login", (req, res)=>{
    const { username, password} = req.body;

    //Dummy authentication logic
    if(username === "admin" && password === "password"){
        res.status(200).json({ message: "Login successful"});
    } else {
        res.status(401).json({ message: "Invalid credentials"});
    }
})

// Collaborative API routes (Yjs)
router.get('/collab/doc/:docId', getDocument);
router.post('/collab/doc/:docId', updateDocument);
router.get('/collab/doc/:docId/text/:textName', getSharedText);
router.post('/collab/doc/:docId/text/:textName', updateSharedText);
router.get('/collab/doc/:docId/awareness', getAwareness);
router.get('/collab/doc/:docId/export', exportDocument);
router.post('/collab/doc/:docId/destroy', destroyDocument);
router.get('/collab/doc/:docId/metadata', getDocumentMetadata);
router.post('/collab/doc/:docId/metadata', saveDocumentMetadata);

// Persistence routes
router.get('/collab/persistence/stats', getPersistenceStats);
router.get('/collab/persistence/documents', listPersistedDocuments);

// Presence / Awareness routes
router.get('/presence/rooms', getActiveRooms);
router.get('/presence/room/:room', getRoomPresence);
router.get('/presence/room/:room/stats', getRoomStats);
router.get('/presence/client/:clientId', getClientPresence);
router.get('/presence/stats', getGlobalStats);
router.post('/presence/check-inactive', checkInactiveClients);
router.get('/presence/export', exportState);

module.exports = router;
