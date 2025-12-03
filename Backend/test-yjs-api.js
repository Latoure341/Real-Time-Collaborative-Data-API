// Simple test client for Yjs collaborative API
const http = require('http');

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
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
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function test() {
    console.log('Testing Yjs Collaborative API...\n');

    try {
        // Update document
        console.log('1. Updating document...');
        const updateRes = await makeRequest('POST', '/collab/doc/test-doc', {
            key: 'title',
            value: 'My Collaborative Document'
        });
        console.log('Response:', updateRes);

        // Get document
        console.log('\n2. Getting document...');
        const getRes = await makeRequest('GET', '/collab/doc/test-doc');
        console.log('Response:', getRes);

        // Update shared text
        console.log('\n3. Updating shared text...');
        const textRes = await makeRequest('POST', '/collab/doc/test-doc/text/content', {
            content: 'Hello from collaborative editor!'
        });
        console.log('Response:', textRes);

        // Get shared text
        console.log('\n4. Getting shared text...');
        const getTextRes = await makeRequest('GET', '/collab/doc/test-doc/text/content');
        console.log('Response:', getTextRes);

        console.log('\nAll tests completed!');
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
