#!/usr/bin/env node

import http from 'http';

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/echo') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('Received request body:', body);
      
      try {
        const data = JSON.parse(body);
        const message = data.message || 'No message provided';
        
        // Format the response according to the MCP specification
        const response = {
          content: [
            {
              type: 'text',
              text: `Echo: ${message}`
            }
          ]
        };
        
        console.log('Sending response:', JSON.stringify(response));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
}); 