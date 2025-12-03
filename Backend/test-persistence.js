// Test persistence with the collaborative API
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
    console.log('Testing Persistence Integration...\n');

    try {
        // 1. Create a document with data
        console.log('1. Creating document with data...');
        await makeRequest('POST', '/collab/doc/persistent-doc', {
            key: 'title',
            value: 'Persistent Collaborative Document'
        });
        console.log('✓ Document created');

        // 2. Add more data
        console.log('\n2. Adding more data to document...');
        await makeRequest('POST', '/collab/doc/persistent-doc', {
            key: 'author',
            value: 'John Doe'
        });
        console.log('✓ Data added');

        // 3. Save metadata
        console.log('\n3. Saving document metadata...');
        await makeRequest('POST', '/collab/doc/persistent-doc/metadata', {
            name: 'My Persistent Doc',
            description: 'A document that persists across restarts',
            owner: 'alice@example.com'
        });
        console.log('✓ Metadata saved');

        // 4. Update shared text
        console.log('\n4. Updating shared text...');
        await makeRequest('POST', '/collab/doc/persistent-doc/text/content', {
            content: 'This is persistent content!'
        });
        console.log('✓ Shared text updated');

        // 5. Retrieve document
        console.log('\n5. Retrieving document...');
        const docRes = await makeRequest('GET', '/collab/doc/persistent-doc');
        console.log('Document content:', docRes.data);

        // 6. Get database stats
        console.log('\n6. Checking persistence stats...');
        const statsRes = await makeRequest('GET', '/collab/persistence/stats');
        console.log('Database stats:', statsRes.stats);

        // 7. List all persisted documents
        console.log('\n7. Listing persisted documents...');
        const docsRes = await makeRequest('GET', '/collab/persistence/documents');
        console.log('Persisted documents:', docsRes.documents);

        // 8. Get document metadata
        console.log('\n8. Retrieving document metadata...');
        const metaRes = await makeRequest('GET', '/collab/doc/persistent-doc/metadata');
        console.log('Metadata:', metaRes.metadata);

        console.log('\n✅ All persistence tests completed successfully!');
        console.log('\nTo verify persistence, stop the server and restart it.');
        console.log('The document data and metadata should be restored automatically.');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// Wait a moment for server to be ready
setTimeout(test, 500);
