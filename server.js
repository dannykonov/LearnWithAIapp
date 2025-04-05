// Simple Express server for local development
const express = require('express');
const dotenv = require('dotenv');
// const { createHandler } = require('vercel-community-serverless');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// --- START MERGED CODE ----
const { v4: uuidv4 } = require('uuid'); // Use require for uuid
const axios = require('axios');        // Use require for axios
const OpenAI = require('openai');       // Use require for openai
// --- END MERGED CODE ----

// Load environment variables
dotenv.config();

// --- START MERGED CODE ----
// Log environment variables presence at startup
console.log('API INIT - Environment variables check:');
console.log('OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
console.log('GOOGLE_CSE_ID present:', !!process.env.GOOGLE_CSE_ID);

// Initialize OpenAI client using ES module compatible approach
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Google Search API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// Function to search for resources using Google Custom Search API
const searchResource = async (query, contentType) => { // Adjusted types for JS
  try {
    console.log(`Searching for: "${query}" [${contentType}]`);
    const searchQuery = contentType ? `${query} ${contentType}` : query;
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: searchQuery,
        num: 1,
      }
    });
    console.log('Search successful, items:', response.data.items?.length || 0);
    if (response.data.items && response.data.items.length > 0) {
      const result = response.data.items[0];
      return {
        title: result.title,
        link: result.link,
        source: result.displayLink || (new URL(result.link)).hostname
      };
    }
    console.log('No search results found, using fallback');
    return {
      title: query,
      link: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      source: 'Google Search'
    };
  } catch (error) {
    console.error('Error searching for resource:', error.message);
    console.error('Query was:', query);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    }
    return {
      title: query,
      link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: 'Google Search (Fallback)'
    };
  }
};

// Helper function to create a real resource URL when Google search fails
const getRealResourceURL = (title, type) => { // Adjusted types for JS
  const platforms = {
    'video': ['youtube.com/results', 'coursera.org/search', 'udemy.com/courses/search'],
    'article': ['medium.com/search', 'dev.to/search', 'freecodecamp.org/news/search'],
    'course': ['udemy.com/courses/search', 'coursera.org/search', 'edx.org/search'],
    'interactive': ['codecademy.com/search', 'freecodecamp.org/learn', 'w3schools.com'],
    'tutorial': ['tutorialspoint.com/search', 'w3schools.com/search', 'geeksforgeeks.org/search'],
    'pdf': ['pdfdrive.com/search', 'academia.edu/search', 'researchgate.net/search'],
    'podcast': ['spotify.com/search', 'apple.com/apple-podcasts', 'listennotes.com/search'],
    'thread': ['reddit.com/search', 'stackoverflow.com/search', 'quora.com/search']
  };
  const contentType = type.toLowerCase();
  const platformList = platforms[contentType] || platforms['article'];
  const platform = platformList[Math.floor(Math.random() * platformList.length)];
  return `https://${platform}?q=${encodeURIComponent(title)}`;
};

// Fallback function to extract valid JSON from text, even if corrupted
const extractJSONFromString = (str) => { // Adjusted types for JS
  try { return JSON.parse(str); } catch (e) { console.log("Attempting to extract valid JSON from string..."); }
  let jsonStart = str.indexOf('{');
  let jsonEnd = str.lastIndexOf('}');
  if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
    let possibleJSON = str.substring(jsonStart, jsonEnd + 1);
    try { return JSON.parse(possibleJSON); } catch (e) { console.log("First extraction attempt failed..."); }
  }
  console.log("Creating fallback structure");
  return { steps: [] };
};

// Interfaces are not needed in JS, but keep for reference if converting back later
// interface Resource { ... }
// interface Step { ... }
// --- END MERGED CODE ----

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increased size limit for large roadmaps

// Define API routes directly with handler function
app.post('/api/generate-roadmap-with-search', async (req, res) => {
  // Handler logic starts here, copied from api/generate-roadmap-with-search.ts
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API called with request method:', req.method);

    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: Missing OPENAI_API_KEY environment variable');
      return res.status(500).json({ error: 'Server configuration error', message: 'OpenAI API key is missing' });
    }
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      console.error('WARNING: Missing Google API key or CSE ID - search will be limited');
    }

    let userAnswers;
    try {
      userAnswers = req.body;
      console.log('Received user answers for topic:', userAnswers.topic);
      console.log('Full user answers received:', JSON.stringify(userAnswers, null, 2));
      if (!userAnswers || !userAnswers.topic) {
        throw new Error('Invalid request body - missing topic');
      }
    } catch (e) {
      console.error('ERROR: Failed to parse request body:', e);
      return res.status(400).json({ error: 'Invalid request', message: 'Could not parse request body' });
    }

    console.log('Starting roadmap generation for topic:', userAnswers.topic);
    console.log('Step 1: Generating roadmap structure with ChatGPT...');

    try {
      let systemPrompt = `You are an expert educational content creator with deep knowledge of learning pathways.
            Your task is to create a personalized 5-step learning roadmap structure for someone learning ${userAnswers.topic}.

            For each step, include:
            1. A clear, descriptive title showing progression through the topic
            2. A detailed description of what the learner should understand by the end of this step
            3. 2-3 specific resource topics (not URLs, just describe what the resource should cover)

            For each resource, provide:
            - Title (be specific about what should be learned)
            - Type (ONLY use these exact values: video, article, interactive, pdf, podcast, thread)
            - Brief description of what this resource should cover
            - Approximate time commitment (15min, 30min, 1hr, etc.)

            IMPORTANT: Your response MUST be a valid JSON object with a "steps" array like this example:
            {
              "steps": [
                {
                  "title": "Step title",
                  "description": "Step description",
                  "resources": [
                    {
                      "title": "Resource title",
                      "type": "video",
                      "description": "Resource description",
                      "timeEstimate": "30 min"
                    }
                  ]
                }
              ]
            }

            DO NOT include any text before or after the JSON. Your entire response must be valid JSON.`;
      if (userAnswers.contentPreference?.toLowerCase() === 'videos' || userAnswers.contentPreference?.toLowerCase() === 'video') {
        systemPrompt += `\n\nVERY IMPORTANT: The user strongly prefers video content. Ensure ALL suggested resources are of type 'video' and describe content typically found on YouTube (tutorials, lectures, explanations). DO NOT include any articles, interactive resources, or other non-video content types.`;
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Create a personalized learning roadmap for ${userAnswers.topic}.\n\nAbout me:\n- Existing knowledge: ${userAnswers.existingKnowledge}\n- Background level: ${userAnswers.background}\n- Learning pace: ${userAnswers.pace}\n- Preferred content format: ${userAnswers.contentPreference}\n- Available time: ${userAnswers.availableTime}\n- Learning goal: ${userAnswers.goal}\n\nProvide a logical progression...`
          }
        ],
        response_format: { type: "json_object" }
      });

      const roadmapContent = completion.choices[0].message.content;
      console.log('Roadmap structure generated successfully');
      console.log('Raw content received:', typeof roadmapContent, roadmapContent ? roadmapContent.substring(0, 50) + '...' : 'null');

      let roadmapStructure;
      try {
        if (!roadmapContent || typeof roadmapContent !== 'string') throw new Error('OpenAI returned empty or invalid content');
        roadmapStructure = extractJSONFromString(roadmapContent);
        if (!roadmapStructure.steps || !Array.isArray(roadmapStructure.steps)) throw new Error('Invalid roadmap structure: missing steps array');
        console.log(`Parsed roadmap with ${roadmapStructure.steps.length} steps`);
      } catch (e) {
        console.error('Error parsing JSON from response:', e);
        console.error('Raw content causing error:', roadmapContent);
        
        // Provide a better fallback structure with topic-specific content
        const topicName = userAnswers.topic || "this topic";
        roadmapStructure = {
          steps: [
            {
              title: `Introduction to ${topicName}`,
              description: `Getting started with the basics of ${topicName}`,
              resources: [
                {
                  title: `${topicName} for Beginners`,
                  type: 'video',
                  description: `A comprehensive introduction to ${topicName} for beginners`,
                  timeEstimate: '30 min'
                },
                {
                  title: `Basic ${topicName} Concepts`,
                  type: 'video',
                  description: `Learn the fundamental concepts of ${topicName}`,
                  timeEstimate: '45 min'
                }
              ]
            },
            {
              title: `Building ${topicName} Skills`,
              description: `Developing core skills and understanding in ${topicName}`,
              resources: [
                {
                  title: `Practical ${topicName} Techniques`,
                  type: 'video',
                  description: `Hands-on demonstration of key ${topicName} techniques`,
                  timeEstimate: '60 min'
                }
              ]
            }
          ]
        };
        console.log('Using fallback roadmap structure instead');
      }

      if (userAnswers.contentPreference?.toLowerCase() === 'videos') {
        console.log('User prefers videos - enforcing video-only roadmap');
        roadmapStructure.steps.forEach((step) => {
          step.resources.forEach((resource) => { resource.type = 'video'; });
        });
      }

      console.log('Step 2: Enhancing roadmap with real resources...');
      const enhancedSteps = [];

      for (let i = 0; i < roadmapStructure.steps.length; i++) {
        console.log(`Processing step ${i + 1}/${roadmapStructure.steps.length}`);
        const step = roadmapStructure.steps[i];
        const enhancedResources = [];

        for (let j = 0; j < step.resources.length; j++) {
          const resource = step.resources[j];
          console.log(`Processing resource ${j + 1}/${step.resources.length}: ${resource.title}`);

          const validTypes = ['video', 'article', 'interactive', 'pdf', 'podcast', 'thread'];
          let type = validTypes.includes(resource.type?.toLowerCase()) ? resource.type.toLowerCase() : 'article';
          if (userAnswers.contentPreference?.toLowerCase() === 'videos') type = 'video'; // Force type if video pref

          let searchQuery = `${userAnswers.topic} ${resource.title} ${resource.description || ''}`;
          if (userAnswers.contentPreference?.toLowerCase() === 'videos') {
            searchQuery = `site:youtube.com ${searchQuery}`;
            console.log('Enforcing video-only search with YouTube restriction');
          }

          try {
            const searchResult = await searchResource(searchQuery, type);
            let finalLink = searchResult.link;
            let finalSource = searchResult.source;

            if (userAnswers.contentPreference?.toLowerCase() === 'videos') {
              console.log(`[Video Pref] Checking resource: ${resource.title}, Link: ${finalLink}, Source: ${finalSource}`);
              const isYouTube = finalLink && (finalLink.toLowerCase().includes('youtube.com/') || finalLink.toLowerCase().includes('youtu.be/'));
              if (!isYouTube) {
                console.log('[Video Pref] Non-YouTube result detected! Performing specific YouTube search.');
                const youtubeQuery = `site:youtube.com ${userAnswers.topic} ${resource.title} tutorial`;
                const youtubeResult = await searchResource(youtubeQuery, 'video');
                const isYouTubeResultValid = youtubeResult.link && (youtubeResult.link.toLowerCase().includes('youtube.com/') || youtubeResult.link.toLowerCase().includes('youtu.be/'));
                if (isYouTubeResultValid) {
                  console.log(`[Video Pref] Found valid YouTube alternative: ${youtubeResult.link}`);
                  finalLink = youtubeResult.link;
                  finalSource = youtubeResult.source || 'YouTube';
                } else {
                  console.log('[Video Pref] Specific YouTube search failed or invalid. Falling back to direct YouTube search URL.');
                  finalLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userAnswers.topic} ${resource.title}`)}`;
                  finalSource = 'YouTube';
                }
              } else {
                 console.log('[Video Pref] Resource confirmed as YouTube.');
              }
            }

            if (!finalLink || finalLink.includes('example.com')) {
              console.log('Search returned invalid link, using direct platform URL');
              if (userAnswers.contentPreference?.toLowerCase() === 'videos') {
                finalLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userAnswers.topic} ${resource.title}`)}`;
                finalSource = 'YouTube';
              } else {
                finalLink = getRealResourceURL(resource.title, type);
                finalSource = 'Recommended Platform'; // Add source for fallback
              }
            }

            enhancedResources.push({
              id: uuidv4(),
              title: resource.title || searchResult.title,
              type: userAnswers.contentPreference?.toLowerCase() === 'videos' ? 'video' : type,
              link: finalLink,
              timeEstimate: resource.timeEstimate || '30 min',
              source: finalSource,
              description: resource.description || '',
              completed: false
            });
          } catch (e) {
            console.error(`Error processing resource ${j + 1}:`, e);
            let fallbackLink = `https://www.google.com/search?q=${encodeURIComponent(`${userAnswers.topic} ${resource.title}`)}`;
            let fallbackSource = 'Google Search';
            if (userAnswers.contentPreference?.toLowerCase() === 'videos') {
               fallbackLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userAnswers.topic} ${resource.title}`)}`;
               fallbackSource = 'YouTube';
            }
            enhancedResources.push({
              id: uuidv4(), title: resource.title, type: type,
              link: fallbackLink, timeEstimate: resource.timeEstimate || '30 min',
              source: fallbackSource, description: resource.description || '', completed: false
            });
          }
        }

        const totalMinutes = enhancedResources.reduce((total, resource) => {
          const timeString = resource.timeEstimate;
          const minutes = parseInt(timeString.match(/\d+/)?.[0] || '30');
          return total + minutes;
        }, 0);

        enhancedSteps.push({
          id: uuidv4(), stepNumber: i + 1, title: step.title,
          description: step.description, resources: enhancedResources,
          completed: false, timeEstimate: `${totalMinutes} min`
        });
      }

      if (userAnswers.contentPreference?.toLowerCase() === 'videos') {
        console.log('[Video Pref - Final Check] Verifying all resources are YouTube videos...');
        enhancedSteps.forEach(step => {
          step.resources.forEach(resource => {
            resource.type = 'video';
            const isYouTubeFinal = resource.link && (resource.link.toLowerCase().includes('youtube.com/') || resource.link.toLowerCase().includes('youtu.be/'));
            if (!isYouTubeFinal) {
              console.log(`[Video Pref - Final Check] Replacing non-YouTube resource: Title: ${resource.title}, Original Link: ${resource.link}`);
              resource.link = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${userAnswers.topic} ${resource.title}`)}`;
              resource.source = 'YouTube';
              console.log(`[Video Pref - Final Check] Replaced with: ${resource.link}`);
            }
          });
        });
        console.log('[Video Pref - Final Check] Verification complete.');
      }

      console.log('Roadmap generation complete, sending response');
      return res.status(200).json(enhancedSteps);

    } catch (openAiError) {
      console.error('OpenAI API Error:', openAiError);
      return res.status(500).json({ error: 'AI processing error', message: openAiError.message || 'Failed to generate roadmap with AI' });
    }

  } catch (error) {
    console.error('Unhandled error in API handler:', error);
    return res.status(500).json({ error: 'Server error', message: error.message || 'An unknown error occurred' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('- POST /api/generate-roadmap-with-search');
}); 