// Test presence API endpoints
const http = require('http');

function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function test() {
    console.log('Testing Presence API Endpoints...\n');

    try {
        // 1. Get global stats
        console.log('1. Getting global presence stats...');
        const statsRes = await makeRequest('GET', '/presence/stats');
        console.log('Global stats:', JSON.stringify(statsRes, null, 2));

        // 2. Get active rooms
        console.log('\n2. Getting active rooms...');
        const roomsRes = await makeRequest('GET', '/presence/rooms');
        console.log('Active rooms:', JSON.stringify(roomsRes, null, 2));

        // 3. Export full state
        console.log('\n3. Exporting full awareness state...');
        const stateRes = await makeRequest('GET', '/presence/export');
        console.log('Full state:', JSON.stringify(stateRes, null, 2));

        console.log('\n✅ All presence API tests completed!');
        console.log('\nNote: Connect WebSocket clients to see real presence data.');
        console.log('Open presence-example.html in a browser to test with real clients.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// Wait for server to be ready
setTimeout(test, 500);
