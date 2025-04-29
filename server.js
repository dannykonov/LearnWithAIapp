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
console.log('PERPLEXITY_API_KEY present:', !!process.env.PERPLEXITY_API_KEY);

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

// Add a helper function to extract JSON from markdown-formatted text
const extractJSONFromMarkdown = (text) => {
  try {
    // First try direct parse in case it's already valid JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.log('Not valid JSON directly, attempting to extract from markdown...');
    }
    
    // Look for json code blocks
    const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/;
    const match = text.match(jsonRegex);
    
    if (match && match[1]) {
      const jsonContent = match[1].trim();
      try {
        return JSON.parse(jsonContent);
      } catch (e) {
        console.error('Failed to parse extracted JSON from markdown', e);
      }
    }
    
    // If no code blocks found, try to find content between curly braces
    const curlyBraceRegex = /\{[\s\S]*\}/;
    const curlyMatch = text.match(curlyBraceRegex);
    if (curlyMatch) {
      try {
        return JSON.parse(curlyMatch[0]);
      } catch (e) {
        console.error('Failed to parse JSON with curly brace extraction', e);
      }
    }
    
    throw new Error('Unable to extract valid JSON from response');
  } catch (error) {
    console.error('Error in extractJSONFromMarkdown:', error.message);
    console.error('Original text:', text.substring(0, 200) + '...');
    return {
      title: "Could not parse data",
      description: "Error parsing AI response",
      searchQuery: "learning roadmap tutorial"
    };
  }
};

// Interfaces are not needed in JS, but keep for reference if converting back later
// interface Resource { ... }
// interface Step { ... }
// --- END MERGED CODE ----

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware

// Configure CORS specifically for your frontend development server
app.use(cors({
  origin: 'http://localhost:8080' // Allow requests from your frontend dev server
}));

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

// Add the new Perplexity API endpoint here
app.post('/api/generate-roadmap-perplexity', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.error('ERROR: Missing PERPLEXITY_API_KEY environment variable');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Perplexity API key is missing'
    });
  }

  let topic;
  try {
    // Check if the topic is directly in the request body or inside a userAnswers object
    // This handles both direct topic property and the format coming from frontend
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    
    if (req.body.topic) {
      topic = req.body.topic;
    } else if (req.body.userAnswers && req.body.userAnswers.topic) {
      topic = req.body.userAnswers.topic;
    } else {
      // Handle the case where the entire object might BE the userAnswers with topic inside
      const possibleUserAnswers = req.body;
      if (possibleUserAnswers && possibleUserAnswers.topic) {
        topic = possibleUserAnswers.topic;
      } else {
        throw new Error('Missing topic in request body');
      }
    }
    
    if (!topic) {
      throw new Error('Missing topic in request body');
    }
    console.log(`Received request for Perplexity roadmap generation for topic: ${topic}`);
  } catch (e) {
    console.error('ERROR: Failed to parse request body or missing topic:', e.message);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Could not parse request body or topic is missing'
    });
  }

  // Perplexity API Configuration
  const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
  // Use the correct model name from Perplexity documentation
  const PERPLEXITY_MODEL = 'sonar';  // This is the model shown in their official documentation
  
  // Add a few more Perplexity API parameters
  const PERPLEXITY_API_PARAMS = {
    temperature: 0.7,
    max_tokens: 2048,
  };

  // Perplexity API Prompt Engineering
  const systemPrompt = `You are an expert curriculum designer specializing in creating concise video-based learning paths.
Generate a 5-step learning roadmap focused on the topic "${topic}".
Each step MUST correspond to exactly one specific YouTube video.
The sequence of videos MUST build upon each other logically.
Provide a title and a brief description for each step (video).
Your response MUST be ONLY a valid JSON object. Do not include any text before or after the JSON.
The JSON object must have a key "steps", which is an array of 5 step objects.
Each step object must have the following keys: "stepNumber" (integer), "title" (string, the video title), "youtubeUrl" (string, the full YouTube URL), and "description" (string, a brief explanation of the video's content and how it fits the sequence).

Example format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Video Title 1",
      "youtubeUrl": "https://www.youtube.com/watch?v=...",
      "description": "Description for video 1."
    },
    {
      "stepNumber": 2,
      "title": "Video Title 2",
      "youtubeUrl": "https://www.youtube.com/watch?v=...",
      "description": "Description for video 2, building on video 1."
    },
    // ... up to step 5
  ]
}`;

  try {
    console.log(`Calling Perplexity API (${PERPLEXITY_MODEL}) for topic: ${topic}`);
    // Call Perplexity API
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: PERPLEXITY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate the 5-step YouTube video roadmap for ${topic}` } // User message can be simple
        ],
        // Include the additional parameters
        ...PERPLEXITY_API_PARAMS
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('Perplexity API call successful.');

    // Process Perplexity Response
    let perplexityResult;
    let rawContent = response.data.choices[0]?.message?.content;

    if (!rawContent) {
        throw new Error('Perplexity API returned an empty response content.');
    }

    console.log('Raw content from Perplexity:', rawContent);

    try {
      // Attempt to parse the JSON content directly
      perplexityResult = JSON.parse(rawContent);
      if (!perplexityResult || !Array.isArray(perplexityResult.steps) || perplexityResult.steps.length === 0) {
         throw new Error('Parsed JSON is not in the expected format or steps array is empty.');
      }
       console.log('Successfully parsed Perplexity JSON response.');
    } catch (parseError) {
      console.error('ERROR: Failed to parse JSON response from Perplexity:', parseError.message);
      console.error('Raw content was:', rawContent);
      throw new Error('Perplexity API did not return valid JSON in the expected format.');
    }

    // Format into Roadmap Structure
    const formattedSteps = perplexityResult.steps.map((pplxStep, index) => {
       if (!pplxStep.youtubeUrl || !pplxStep.title || !pplxStep.description) {
           console.warn(`Warning: Step ${index + 1} from Perplexity is missing required fields (youtubeUrl, title, or description). Skipping fields.`);
       }
      const resource = {
        id: uuidv4(),
        title: pplxStep.title || `Video Step ${index + 1}`,
        type: 'video',
        link: pplxStep.youtubeUrl || '#', // Provide a fallback link if missing
        timeEstimate: 'N/A', // MVP default
        source: 'YouTube',
        description: pplxStep.description || 'No description provided.',
        completed: false,
      };

      return {
        id: uuidv4(),
        stepNumber: pplxStep.stepNumber || index + 1,
        title: `Step ${index + 1}: ${resource.title}`, // Use video title for Step title
        description: resource.description, // Use video description for Step description
        resources: [resource],
        completed: false,
        timeEstimate: resource.timeEstimate, // Use single resource time estimate
      };
    });

    // Return Response
    console.log(`Successfully generated roadmap with ${formattedSteps.length} steps.`);
    return res.status(200).json({ roadmap: formattedSteps });

  } catch (error) {
    console.error('Error during Perplexity API call or processing:', error.message);
    
    // More detailed error logging
    console.error('DETAILED ERROR INFO:');
    console.error('Error object type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error constructor:', error.constructor?.name);
    console.error('Error stack:', error.stack);
    
    // Distinguish between Axios errors (API call failures) and other errors
    if (axios.isAxiosError(error)) {
      console.error('AXIOS ERROR DETAILS:');
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request headers:', JSON.stringify(error.config?.headers, null, 2));
      console.error('Request data:', error.config?.data);
      
      if (error.response) {
        console.error('API Error Status:', error.response.status);
        console.error('API Error Status Text:', error.response.statusText);
        console.error('API Error Headers:', JSON.stringify(error.response.headers, null, 2));
        console.error('API Error Data:', JSON.stringify(error.response.data, null, 2));
        
        return res.status(error.response.status || 500).json({
            error: 'Perplexity API error',
            message: error.response.data?.message || error.response.data?.error?.message || error.message,
            details: error.response.data
        });
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received from Perplexity API');
        console.error('Request details:', error.request);
        
        return res.status(500).json({
            error: 'Perplexity API connection error',
            message: 'No response received from Perplexity API'
        });
      }
    } 

    // For all other types of errors
    return res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred during roadmap generation.'
    });
  }
});

// Add the enhanced roadmap generation endpoint
app.post('/api/generate-enhanced-roadmap', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Enhanced roadmap generation started');
  
  // Check for required API keys
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!openaiApiKey) {
    console.error('ERROR: Missing OPENAI_API_KEY environment variable');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'OpenAI API key is missing'
    });
  }
  
  if (!perplexityApiKey) {
    console.error('ERROR: Missing PERPLEXITY_API_KEY environment variable');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Perplexity API key is missing'
    });
  }

  // Extract topic from request
  let topic, userAnswers;
  try {
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    
    userAnswers = req.body;
    
    if (req.body.topic) {
      topic = req.body.topic;
    } else if (req.body.userAnswers && req.body.userAnswers.topic) {
      topic = req.body.userAnswers.topic;
      userAnswers = req.body.userAnswers;
    } else {
      // Handle the case where the entire object might BE the userAnswers with topic inside
      const possibleUserAnswers = req.body;
      if (possibleUserAnswers && possibleUserAnswers.topic) {
        topic = possibleUserAnswers.topic;
        userAnswers = possibleUserAnswers;
      } else {
        throw new Error('Missing topic in request body');
      }
    }
    
    if (!topic) {
      throw new Error('Missing topic in request body');
    }
    
    console.log(`Received request for enhanced roadmap generation for topic: ${topic}`);
  } catch (e) {
    console.error('ERROR: Failed to parse request body or missing topic:', e.message);
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Could not parse request body or topic is missing'
    });
  }

  try {
    // Phase 1: Topic Decomposition with ChatGPT
    console.log('Phase 1: Breaking down topic into subtopics with ChatGPT');
    
    const systemPrompt = `You are an expert curriculum designer. 
Break down the topic "${topic}" into exactly 5 sequential subtopics that build upon each other logically.
Start with fundamentals and progress to more advanced concepts.
Your response MUST be a valid JSON object with the following structure:
{
  "subtopics": [
    {
      "number": 1,
      "title": "Subtopic title",
      "description": "Detailed description explaining this subtopic and its importance",
      "searchQuery": "Specific search query to find a YouTube video teaching this exact subtopic"
    },
    // ... repeat for all 5 subtopics
  ]
}

For each subtopic:
1. The title should be clear and specific
2. The description should explain what the learner will understand after this step
3. The searchQuery should be crafted to find a precise YouTube video for this subtopic

DO NOT include any text before or after the JSON. Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Break down "${topic}" into 5 sequential subtopics for a learning roadmap.
Consider these details about the learner:
- Existing knowledge: ${userAnswers.existingKnowledge || 'Beginner level'}
- Background level: ${userAnswers.background || 'Some exposure'}
- Learning pace: ${userAnswers.pace || 'Normal'}
- Learning goal: ${userAnswers.goal || 'Master the fundamentals'}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const subtopicsContent = completion.choices[0].message.content;
    console.log('Subtopics generated successfully');
    
    let subtopicsData;
    try {
      subtopicsData = JSON.parse(subtopicsContent);
      if (!subtopicsData.subtopics || !Array.isArray(subtopicsData.subtopics) || subtopicsData.subtopics.length !== 5) {
        throw new Error('Invalid subtopics structure from ChatGPT');
      }
    } catch (parseError) {
      console.error('Error parsing JSON from ChatGPT response:', parseError);
      throw new Error('Failed to parse subtopics data from ChatGPT');
    }
    
    // Phase 2 & 3: Targeted Video Search with Perplexity (with fallback)
    console.log('Phase 2 & 3: Searching for videos for each subtopic');
    
    const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
    const PERPLEXITY_MODEL = 'sonar';
    
    const enhancedSteps = [];
    
    for (const subtopic of subtopicsData.subtopics) {
      console.log(`Processing subtopic ${subtopic.number}: ${subtopic.title}`);
      
      // First attempt: Search for specific video
      const specificVideoPrompt = `Find the best YouTube educational video that precisely teaches "${subtopic.searchQuery}".
The video should:
1. Be high quality and from a reputable creator
2. Focus specifically on this exact topic
3. Be appropriate for the skill level of this subtopic
4. Be part of a learning sequence about ${topic}

Return ONLY a valid JSON object with this structure:
{
  "videoTitle": "The exact title of the video",
  "youtubeUrl": "The full YouTube URL",
  "creator": "Name of the YouTube channel",
  "description": "A brief description of what the video teaches",
  "durationMinutes": 15, 
  "videoFound": true
}

If you cannot find a specific video for this exact subtopic, set "videoFound" to false.
DO NOT return any text before or after the JSON.`;

      let videoData = null;
      let isVideoFound = false;
      
      try {
        console.log(`Searching for specific video for: ${subtopic.searchQuery}`);
        const videoSearchResponse = await axios.post(
          PERPLEXITY_API_URL,
          {
            model: PERPLEXITY_MODEL,
            messages: [
              { role: 'system', content: specificVideoPrompt },
              { role: 'user', content: `Find a specific YouTube video for learning "${subtopic.searchQuery}" as part of ${topic}` }
            ],
            temperature: 0.5,
            max_tokens: 1024
          },
          {
            headers: {
              'Authorization': `Bearer ${perplexityApiKey}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );
        
        const videoContent = videoSearchResponse.data.choices[0]?.message?.content;
        console.log('Raw video search response:', videoContent?.substring(0, 200) + '...');
        
        // Use our new parser to handle markdown-formatted JSON
        videoData = extractJSONFromMarkdown(videoContent);
        
        // Ensure proper YouTube URL format
        if (videoData.youtubeUrl) {
          // Convert any YouTube watch URLs to embed format
          if (videoData.youtubeUrl.includes('youtube.com/watch?v=')) {
            const videoId = new URL(videoData.youtubeUrl).searchParams.get('v');
            if (videoId) {
              videoData.youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
              console.log(`Converted YouTube URL to embed format: ${videoData.youtubeUrl}`);
            }
          } else if (videoData.youtubeUrl.includes('youtu.be/')) {
            const videoId = videoData.youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
            if (videoId) {
              videoData.youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
              console.log(`Converted youtu.be URL to embed format: ${videoData.youtubeUrl}`);
            }
          } else if (!videoData.youtubeUrl.includes('/embed/')) {
            // If it's not already an embed URL and we couldn't convert it,
            // replace with a search URL as fallback
            videoData.youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subtopic.searchQuery} tutorial`)}`;
            videoData.videoFound = false;
          }
        }
        
        isVideoFound = videoData.videoFound && videoData.youtubeUrl && videoData.youtubeUrl.includes('youtube.com');
        
        console.log(`Video found: ${isVideoFound}, URL: ${videoData.youtubeUrl}`);
      } catch (videoSearchError) {
        console.error(`Error searching for specific video: ${videoSearchError.message}`);
        isVideoFound = false;
      }
      
      // Phase 3: Fallback if specific video not found
      if (!isVideoFound) {
        console.log(`Specific video not found, searching for general video on: ${subtopic.title}`);
        
        const fallbackPrompt = `Find a general YouTube educational video about "${subtopic.title}" for someone learning ${topic}.
The video should:
1. Be high quality and from a reputable creator
2. Cover the general topic even if not specifically matching the exact query
3. Be appropriate for beginners to intermediate learners
4. Provide valuable information for someone learning ${topic}

Return ONLY a valid JSON object with this structure:
{
  "videoTitle": "The exact title of the video",
  "youtubeUrl": "The full YouTube URL",
  "creator": "Name of the YouTube channel",
  "description": "A brief description of what the video teaches",
  "durationMinutes": 15,
  "isFallback": true
}

DO NOT return any text before or after the JSON.`;

        try {
          const fallbackResponse = await axios.post(
            PERPLEXITY_API_URL,
            {
              model: PERPLEXITY_MODEL,
              messages: [
                { role: 'system', content: fallbackPrompt },
                { role: 'user', content: `Find a general YouTube video about "${subtopic.title}" related to ${topic}` }
              ],
              temperature: 0.7,
              max_tokens: 1024
            },
            {
              headers: {
                'Authorization': `Bearer ${perplexityApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          const fallbackContent = fallbackResponse.data.choices[0]?.message?.content;
          console.log('Raw fallback response:', fallbackContent?.substring(0, 200) + '...');
          
          // Use our new parser
          videoData = extractJSONFromMarkdown(fallbackContent);
          videoData.isFallback = true;
          
          // Ensure proper YouTube URL format
          if (videoData.youtubeUrl) {
            // Convert any YouTube watch URLs to embed format
            if (videoData.youtubeUrl.includes('youtube.com/watch?v=')) {
              const videoId = new URL(videoData.youtubeUrl).searchParams.get('v');
              if (videoId) {
                videoData.youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
                console.log(`Converted fallback YouTube URL to embed format: ${videoData.youtubeUrl}`);
              }
            } else if (videoData.youtubeUrl.includes('youtu.be/')) {
              const videoId = videoData.youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
              if (videoId) {
                videoData.youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
                console.log(`Converted fallback youtu.be URL to embed format: ${videoData.youtubeUrl}`);
              }
            } else if (!videoData.youtubeUrl.includes('/embed/')) {
              // If it's not already an embed URL and we couldn't convert it,
              // replace with a search URL as fallback
              videoData.youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subtopic.title} ${topic} tutorial`)}`;
            }
          }
          
          isVideoFound = videoData.youtubeUrl && videoData.youtubeUrl.includes('youtube.com');
          
          console.log(`Fallback video found: ${isVideoFound}, URL: ${videoData.youtubeUrl}`);
        } catch (fallbackError) {
          console.error(`Error searching for fallback video: ${fallbackError.message}`);
          // Create a generic fallback when all else fails
          videoData = {
            videoTitle: `${subtopic.title} - General Overview`,
            youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} ${subtopic.title} tutorial`)}`,
            creator: 'YouTube Search',
            description: `A search for videos about ${subtopic.title} in the context of ${topic}.`,
            durationMinutes: 20,
            isFallback: true
          };
        }
      }
      
      // Create the resource
      const resource = {
        id: uuidv4(),
        title: videoData.videoTitle || `Video on ${subtopic.title}`,
        type: 'video',
        link: videoData.youtubeUrl,
        timeEstimate: `${videoData.durationMinutes || 15} min`,
        source: videoData.creator || 'YouTube',
        description: videoData.description || subtopic.description,
        completed: false,
        isFallback: videoData.isFallback || false
      };
      
      // Create connection text to previous step (except for first step)
      let connectionText = '';
      if (subtopic.number > 1) {
        connectionText = `Having mastered ${subtopicsData.subtopics[subtopic.number - 2].title}, you're now ready to learn about ${subtopic.title}.`;
      }
      
      // Create the step
      enhancedSteps.push({
        id: uuidv4(),
        stepNumber: subtopic.number,
        title: subtopic.title,
        description: subtopic.description,
        connectionText: connectionText,
        resources: [resource],
        completed: false,
        timeEstimate: resource.timeEstimate
      });
    }
    
    // Phase 4: Roadmap Assembly - already done in the loop above
    console.log(`Successfully generated enhanced roadmap with ${enhancedSteps.length} steps.`);
    return res.status(200).json({ roadmap: enhancedSteps });
    
  } catch (error) {
    console.error('Error during enhanced roadmap generation:', error.message);
    return res.status(500).json({
      error: 'Enhanced roadmap generation failed',
      message: error.message || 'An unknown error occurred'
    });
  }
});

// Add a new endpoint to generate article content
app.post('/api/generate-article', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  console.log('Article generation requested');
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: Missing OPENAI_API_KEY environment variable');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'OpenAI API key is missing'
    });
  }
  
  // Extract topic from request
  let topic, description;
  try {
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    
    topic = req.body.topic;
    description = req.body.description || '';
    
    if (!topic) {
      throw new Error('Missing topic in request body');
    }
    
    console.log(`Received request for article generation on topic: ${topic}`);
  } catch (e) {
    console.error('ERROR: Failed to parse request body or missing topic:', e.message);
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Could not parse request body or topic is missing'
    });
  }
  
  try {
    // Define the prompt for article generation
    const articlePrompt = `Write a comprehensive, educational article about "${topic}".
    
Additional context about the topic: ${description}

The article should:
1. Be written in markdown format with proper headings, lists, and emphasis
2. Start with a brief introduction explaining the concept
3. Include 3-5 key points or sections about the topic
4. Use clear, concise explanations suitable for a learning environment
5. Be around 300-500 words in length
6. Include practical examples or applications where relevant
7. End with a brief summary

Format the article with proper markdown (##, *, -, etc.) to enhance readability.`;

    // Call OpenAI to generate the article
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert educational content creator who writes clear, concise articles for learners." 
        },
        { role: "user", content: articlePrompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });
    
    const articleContent = completion.choices[0].message.content;
    
    // Convert markdown to HTML
    let htmlContent = articleContent
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n- (.*)/gim, '<ul><li>$1</li></ul>')
      .replace(/<\/ul><ul>/gim, '');
    
    htmlContent = '<p>' + htmlContent + '</p>';
    
    console.log('Article generated successfully');
    return res.status(200).json({ article: htmlContent });
    
  } catch (error) {
    console.error('Error generating article:', error.message);
    return res.status(500).json({
      error: 'Article generation failed',
      message: error.message || 'An unknown error occurred'
    });
  }
});

// New API endpoint handler for generate-next-step
app.post('/api/generate-next-step', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Next step generation started');
  
  // Check for required API keys
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!openaiApiKey) {
    console.error('ERROR: Missing OPENAI_API_KEY environment variable');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'OpenAI API key is missing'
    });
  }
  
  if (!perplexityApiKey) {
    console.error('ERROR: Missing PERPLEXITY_API_KEY environment variable');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Perplexity API key is missing'
    });
  }

  try {
    // Extract data from request
    console.log('Request body received:', JSON.stringify(req.body, null, 2));
    
    const { currentRoadmap, userAnswers, userId } = req.body;
    
    if (!currentRoadmap || !Array.isArray(currentRoadmap) || !userAnswers || !userAnswers.topic) {
      throw new Error('Missing required data in request body');
    }
    
    const topic = userAnswers.topic;
    console.log(`Generating next step for topic: ${topic}`);
    
    // Step 1: Determine the next logical step using ChatGPT
    console.log('Phase 1: Determining next logical step with ChatGPT');
    
    // Create a summary of completed steps to give context
    const previousStepTitles = currentRoadmap.map(step => 
      `Step ${step.stepNumber}: ${step.title} - ${step.description.substring(0, 100)}...`
    ).join('\n');
    
    const systemPrompt = `You are an expert curriculum designer.
Based on the user's current progress learning "${topic}", determine the most logical next step in their learning journey.

The user has already completed these steps:
${previousStepTitles}

Create exactly ONE additional step that:
1. Builds on their existing knowledge
2. Progresses to a more advanced concept
3. Connects clearly to what they've already learned

Your response MUST be a valid JSON object with the following structure:
{
  "title": "Clear title for the next step",
  "description": "Detailed description explaining what the learner will learn in this step",
  "searchQuery": "Specific search query to find a YouTube video teaching this exact concept"
}

DO NOT include any text before or after the JSON. Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Create the next logical step for my learning journey about "${topic}" based on what I've already learned.`
        }
      ]
    });

    const nextStepContent = completion.choices[0].message?.content;
    console.log('Next step generated successfully');
    
    let nextStepData;
    try {
      nextStepData = extractJSONFromMarkdown(nextStepContent || '{}');
      if (!nextStepData.title || !nextStepData.description || !nextStepData.searchQuery) {
        throw new Error('Invalid next step structure from ChatGPT');
      }
    } catch (parseError) {
      console.error('Error parsing JSON from ChatGPT response:', parseError);
      throw new Error('Failed to parse next step data from ChatGPT');
    }
    
    // Step 2: Find appropriate video for the next step using Perplexity
    console.log('Phase 2: Searching for video for the next step');
    
    const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
    const PERPLEXITY_MODEL = 'sonar';
    
    // Search for specific video
    const specificVideoPrompt = `Find the best YouTube educational video that precisely teaches "${nextStepData.searchQuery}".
The video should:
1. Be high quality and from a reputable creator
2. Focus specifically on this exact topic
3. Be appropriate for someone who already understands ${topic} basics
4. Continue the learning journey about ${topic}

Return ONLY a valid JSON object with this structure:
{
  "videoTitle": "The exact title of the video",
  "youtubeUrl": "The full YouTube URL",
  "creator": "Name of the YouTube channel",
  "description": "A brief description of what the video teaches",
  "durationMinutes": 15, 
  "videoFound": true
}

If you cannot find a specific video for this exact subtopic, set "videoFound" to false.
DO NOT return any text before or after the JSON.`;

    let videoData = null;
    let isVideoFound = false;
    
    try {
      console.log(`Searching for specific video for: ${nextStepData.searchQuery}`);
      const videoSearchResponse = await axios.post(
        PERPLEXITY_API_URL,
        {
          model: PERPLEXITY_MODEL,
          messages: [
            { role: 'system', content: specificVideoPrompt },
            { role: 'user', content: `Find a specific YouTube video for learning "${nextStepData.searchQuery}" related to ${topic}` }
          ],
          temperature: 0.5,
          max_tokens: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${perplexityApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      
      const videoContent = videoSearchResponse.data.choices[0]?.message?.content;
      console.log('Raw video search response:', videoContent?.substring(0, 200) + '...');
      
      // Use our parser to handle markdown-formatted JSON
      videoData = extractJSONFromMarkdown(videoContent || '{}');
      
      // Ensure proper YouTube URL format
      if (videoData.youtubeUrl) {
        // Convert any YouTube watch URLs to embed format
        if (videoData.youtubeUrl.includes('youtube.com/watch?v=')) {
          const videoId = new URL(videoData.youtubeUrl).searchParams.get('v');
          if (videoId) {
            videoData.youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
            console.log(`Converted YouTube URL to embed format: ${videoData.youtubeUrl}`);
          }
        } else if (videoData.youtubeUrl.includes('youtu.be/')) {
          const videoId = videoData.youtubeUrl.split('youtu.be/')[1]?.split('?')[0];
          if (videoId) {
            videoData.youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
            console.log(`Converted youtu.be URL to embed format: ${videoData.youtubeUrl}`);
          }
        } else if (!videoData.youtubeUrl.includes('/embed/')) {
          // If it's not already an embed URL and we couldn't convert it,
          // replace with a search URL as fallback
          videoData.youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nextStepData.searchQuery} tutorial`)}`;
          videoData.videoFound = false;
        }
      }
      
      isVideoFound = videoData.videoFound && videoData.youtubeUrl && videoData.youtubeUrl.includes('youtube.com');
      
      console.log(`Video found: ${isVideoFound}, URL: ${videoData.youtubeUrl}`);
    } catch (videoSearchError) {
      console.error(`Error searching for specific video: ${videoSearchError.message}`);
      isVideoFound = false;
      
      // Create a fallback video link
      videoData = {
        videoTitle: `${nextStepData.title} - Tutorial`,
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nextStepData.searchQuery} tutorial`)}`,
        creator: 'YouTube Search',
        description: `A search for videos about ${nextStepData.title} in ${topic}.`,
        durationMinutes: 15,
        isFallback: true
      };
    }
    
    // Create the resource
    const resource = {
      id: uuidv4(),
      title: videoData.videoTitle || `Video on ${nextStepData.title}`,
      type: 'video',
      link: videoData.youtubeUrl,
      timeEstimate: `${videoData.durationMinutes || 15} min`,
      source: videoData.creator || 'YouTube',
      description: videoData.description || nextStepData.description,
      completed: false,
      isFallback: videoData.isFallback || false
    };
    
    // Create connection text to previous step
    const lastStep = currentRoadmap[currentRoadmap.length - 1];
    const connectionText = `Having mastered ${lastStep.title}, you're now ready to learn about ${nextStepData.title}.`;
    
    // Create the step
    const newStep = {
      id: uuidv4(),
      stepNumber: currentRoadmap.length + 1,
      title: nextStepData.title,
      description: nextStepData.description,
      connectionText: connectionText,
      resources: [resource],
      completed: false,
      timeEstimate: resource.timeEstimate
    };
    
    console.log(`Successfully generated next step: ${newStep.title}`);
    return res.status(200).json(newStep);
    
  } catch (error) {
    console.error('Error during next step generation:', error.message);
    return res.status(500).json({
      error: 'Next step generation failed',
      message: error.message || 'An unknown error occurred'
    });
  }
});

// Add handler for generate-test-questions
app.post('/api/generate-test-questions', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: Missing OPENAI_API_KEY environment variable');
    return res.status(500).json({ error: 'Server configuration error', message: 'OpenAI API key is missing' });
  }

  // Extract data from request body
  const { stepTitle, stepDescription, podcastTitle } = req.body;

  // Validate required fields
  if (!stepTitle || !stepDescription) {
    console.error('ERROR: Missing required fields in request body');
    return res.status(400).json({ error: 'Missing required fields', message: 'Step title and description are required' });
  }

  try {
    // Generate test questions with ChatGPT
    console.log('Generating test questions with ChatGPT');
    
    const systemPrompt = `You are an expert test creator. 
Create exactly 2 multiple choice questions to test knowledge about the learning step: "${stepTitle}".
The step is described as: "${stepDescription}"
${podcastTitle ? `This is related to the podcast: "${podcastTitle}"` : ''}

Your response MUST be a valid JSON array with the following structure:
[
  {
    "question": "First question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0
  },
  {
    "question": "Second question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 2
  }
]

Guidelines:
1. Each question should test understanding of important concepts related to the topic
2. Each question must have exactly 4 options
3. Exactly one option must be correct for each question (indicated by correctAnswerIndex)
4. correctAnswerIndex must be 0, 1, 2, or 3, corresponding to the position in the options array
5. Questions should be distinct and cover different aspects of the topic
6. Make sure questions are thoughtful and appropriate for a knowledge check

DO NOT include any text before or after the JSON. Return ONLY valid JSON.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using the smaller model for efficiency
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Create 2 multiple choice questions to test knowledge about the learning step: "${stepTitle}" with description: "${stepDescription}".`
        }
      ]
    });

    const questionsContent = completion.choices[0].message?.content;
    console.log('Test questions generated successfully');
    
    let questionsData;
    try {
      questionsData = JSON.parse(questionsContent || '[]');
      if (!Array.isArray(questionsData) || questionsData.length !== 2) {
        throw new Error('Invalid questions structure from ChatGPT');
      }
      
      // Validate each question's structure
      questionsData.forEach((question, index) => {
        if (!question.question || !Array.isArray(question.options) || 
            question.options.length !== 4 || 
            typeof question.correctAnswerIndex !== 'number' ||
            question.correctAnswerIndex < 0 || 
            question.correctAnswerIndex > 3) {
          throw new Error(`Question ${index + 1} has invalid structure`);
        }
      });
    } catch (parseError) {
      console.error('Error parsing JSON from ChatGPT response:', parseError);
      throw new Error('Failed to parse questions data from ChatGPT');
    }
    
    // Add unique IDs to each question
    const questionsWithIds = questionsData.map((question, index) => ({
      ...question,
      id: `question-${index}-${Date.now()}`
    }));
    
    return res.status(200).json({ questions: questionsWithIds });
  } catch (error) {
    console.error('Error generating test questions:', error);
    return res.status(500).json({
      error: 'Failed to generate test questions',
      message: error.message || 'Unknown error occurred'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('- POST /api/generate-roadmap-with-search');
  console.log('- POST /api/generate-roadmap-perplexity');
  console.log('- POST /api/generate-enhanced-roadmap');
  console.log('- POST /api/generate-article');
  console.log('- POST /api/generate-next-step');
  console.log('- POST /api/generate-test-questions');
});

// Added empty line to trigger deployment 