# Real-Time-Collaborative-Data-API
A backend system that enables multiple users to edit and sync structured data in real time, similar to Google Docs but for APIs. It supports authentication, role-based access control, version history, conflict resolution. Built with Node.js, PostgreSQL abd others for scalability, it is containerized with Docker and deployable on cloud platforms.

# Features

Real-time Document Sync
Powered by Yjs; efficiently broadcasts updates between connected clients.

User Presence Tracking
Shows who’s online, cursor positions, and live activity.

Persistence Layer
Stores document updates for recovery and replay.

Modular Architecture
Clear separation of controllers, services, middleware, and routing.

Extendable User System
Basic user model ready to integrate into authentication flows.

# Tech Stack

Node.js

Express.js

Yjs for CRDT-based real-time sync

WebSockets (or WS layer depending on your integration)

Custom persistence layer (can be extended to Redis, MongoDB, PostgreSQL, etc.)

# Installation

git clone <repo-url>
cd src
npm install

# Running the Server

node index.js

or (recommended)

npm run dev

# API Overview
/collaboration/

Handles core real-time document logic.

POST /create — create or load a document

GET /:id — fetch document metadata

WebSocket channel for syncing updates

/presence/

Manages awareness & presence state.

Tracks users online in a doc

Broadcasts cursor/selection updates

/users/

User-related actions.

Register/login logic (extendable)

Fetch user data

# Persistence

The persistence layer stores Yjs document updates so users can reconnect without losing state.
You can swap the internal storage for your preferred database.

# Extending the System

You can plug this backend into:

A collaborative text editor

A design tool

A code editor

A whiteboard
