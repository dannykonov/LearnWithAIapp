// Simple Express server for local development
const express = require('express');
const dotenv = require('dotenv');
// const { createHandler } = require('vercel-community-serverless');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased size limit for large roadmaps

// Register the TypeScript compiler
require('ts-node/register');

// Define API routes directly with handler function
app.post('/api/generate-roadmap-with-search', async (req, res) => {
  try {
    // Dynamically import the TypeScript file using the full path
    const { default: handler } = require('./api/generate-roadmap-with-search.ts');
    
    // Call the handler
    await handler(req, res);
  } catch (error) {
    console.error('Error in API route:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('- POST /api/generate-roadmap-with-search');
}); 