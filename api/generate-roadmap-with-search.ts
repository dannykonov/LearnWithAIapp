import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

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
const searchResource = async (query: string, contentType: string): Promise<{ title: string; link: string; source: string }> => {
  try {
    console.log(`Searching for: "${query}" [${contentType}]`);
    
    // Add content type to the query if specified (video, course, article, etc.)
    const searchQuery = contentType ? `${query} ${contentType}` : query;
    
    // Make request to Google Custom Search API
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: GOOGLE_API_KEY,
        cx: GOOGLE_CSE_ID,
        q: searchQuery,
        num: 1, // Get just the top result
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
    // If no results, return a fallback
    return {
      title: query,
      link: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      source: 'Google Search'
    };
  } catch (error: any) {
    console.error('Error searching for resource:', error.message);
    console.error('Query was:', query);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
    }
    
    // Return a fallback on error
    return {
      title: query,
      link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: 'Google Search (Fallback)'
    };
  }
};

// Helper function to create a real resource URL when Google search fails
const getRealResourceURL = (title: string, type: string): string => {
  // Map of popular platforms based on content type
  const platforms: Record<string, string[]> = {
    'video': ['youtube.com/results', 'coursera.org/search', 'udemy.com/courses/search'],
    'article': ['medium.com/search', 'dev.to/search', 'freecodecamp.org/news/search'],
    'course': ['udemy.com/courses/search', 'coursera.org/search', 'edx.org/search'],
    'interactive': ['codecademy.com/search', 'freecodecamp.org/learn', 'w3schools.com'],
    'tutorial': ['tutorialspoint.com/search', 'w3schools.com/search', 'geeksforgeeks.org/search'],
    'pdf': ['pdfdrive.com/search', 'academia.edu/search', 'researchgate.net/search'],
    'podcast': ['spotify.com/search', 'apple.com/apple-podcasts', 'listennotes.com/search'],
    'thread': ['reddit.com/search', 'stackoverflow.com/search', 'quora.com/search']
  };
  
  // Default to article if type not found
  const contentType = type.toLowerCase();
  const platformList = platforms[contentType] || platforms['article'];
  
  // Pick a platform based on the content
  const platform = platformList[Math.floor(Math.random() * platformList.length)];
  
  return `https://${platform}?q=${encodeURIComponent(title)}`;
};

// Fallback function to extract valid JSON from text, even if corrupted
const extractJSONFromString = (str: string): any => {
  // If we have a valid JSON, just parse it
  try {
    return JSON.parse(str);
  } catch (e) {
    // Not valid JSON, let's try to extract it
    console.log("Attempting to extract valid JSON from string...");
  }

  // Look for JSON-like structures
  let jsonStart = str.indexOf('{');
  let jsonEnd = str.lastIndexOf('}');
  
  if (jsonStart >= 0 && jsonEnd >= 0 && jsonEnd > jsonStart) {
    let possibleJSON = str.substring(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(possibleJSON);
    } catch (e) {
      console.log("First extraction attempt failed, trying more aggressive cleaning");
    }
  }
  
  // Very aggressive approach - create a minimal valid structure
  console.log("Creating fallback structure");
  return {
    steps: []
  };
};

// Define interfaces for our data structures
interface Resource {
  id: string;
  title: string;
  type: string;
  link: string;
  timeEstimate: string;
  source: string;
  description: string;
  completed: boolean;
}

interface Step {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  resources: Resource[];
  completed: boolean;
  timeEstimate: string;
}

// Main handler function - explicitly use ESM export
const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API called with request method:', req.method);
    
    // Check if we have the OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: Missing OPENAI_API_KEY environment variable');
      return res.status(500).json({ 
        error: 'Server configuration error', 
        message: 'OpenAI API key is missing' 
      });
    }

    // Check if we have the Google API key
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
      console.error('WARNING: Missing Google API key or CSE ID - search will be limited');
    }

    // Parse the user's answers
    let userAnswers;
    try {
      userAnswers = req.body;
      console.log('Received user answers for topic:', userAnswers.topic);
      
      if (!userAnswers || !userAnswers.topic) {
        throw new Error('Invalid request body - missing topic');
      }
    } catch (e) {
      console.error('ERROR: Failed to parse request body:', e);
      return res.status(400).json({ 
        error: 'Invalid request', 
        message: 'Could not parse request body' 
      });
    }
    
    console.log('Starting roadmap generation for topic:', userAnswers.topic);
    console.log('Step 1: Generating roadmap structure with ChatGPT...');
    
    // Step 1: Generate the roadmap structure using ChatGPT
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using 3.5 to reduce costs, can use gpt-4 for better quality
        messages: [
          {
            role: "system",
            content: `You are an expert educational content creator with deep knowledge of learning pathways.
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
            
            DO NOT include any text before or after the JSON. Your entire response must be valid JSON.`
          },
          {
            role: "user",
            content: `Create a personalized learning roadmap for ${userAnswers.topic}.
            
            About me:
            - Existing knowledge: ${userAnswers.existingKnowledge}
            - Background level: ${userAnswers.background}
            - Learning pace: ${userAnswers.pace}
            - Preferred content format: ${userAnswers.contentPreference}
            - Available time: ${userAnswers.availableTime}
            - Learning goal: ${userAnswers.goal}
            
            Provide a logical progression of learning steps that will take me from my current knowledge to my goal.`
          }
        ],
        response_format: { type: "json_object" }
      });

      // Get the content from the response
      const content = completion.choices[0].message.content;
      console.log('Roadmap structure generated successfully');
      console.log('Raw content received:', typeof content, content ? content.substring(0, 50) + '...' : 'null');
      
      // Parse the roadmap structure
      let roadmapStructure;
      try {
        // First, ensure content is a valid string
        if (!content || typeof content !== 'string') {
          throw new Error('OpenAI returned empty or invalid content');
        }
        
        // Try our custom JSON extractor which works even with malformed input
        roadmapStructure = extractJSONFromString(content);
        
        // Verify structure has steps
        if (!roadmapStructure.steps || !Array.isArray(roadmapStructure.steps)) {
          throw new Error('Invalid roadmap structure: missing steps array');
        }
        
        console.log(`Parsed roadmap with ${roadmapStructure.steps.length} steps`);
      } catch (e) {
        console.error('Error parsing JSON from response:', e);
        console.error('Raw content causing error:', content);
        
        // Provide a fallback structure
        roadmapStructure = {
          steps: [
            {
              title: `Learning ${userAnswers.topic} - Step 1`,
              description: `Getting started with ${userAnswers.topic}`,
              resources: [
                {
                  title: `Introduction to ${userAnswers.topic}`,
                  type: userAnswers.contentPreference || 'article',
                  description: `Learn the basics of ${userAnswers.topic}`,
                  timeEstimate: '30 min'
                },
                {
                  title: `${userAnswers.topic} fundamentals`,
                  type: 'video',
                  description: `Core concepts of ${userAnswers.topic}`,
                  timeEstimate: '45 min'
                }
              ]
            },
            {
              title: `Learning ${userAnswers.topic} - Step 2`,
              description: `Building on your knowledge of ${userAnswers.topic}`,
              resources: [
                {
                  title: `Intermediate ${userAnswers.topic}`,
                  type: 'article',
                  description: `Advance your understanding of ${userAnswers.topic}`,
                  timeEstimate: '60 min'
                }
              ]
            }
          ]
        };
        console.log('Using fallback roadmap structure instead');
      }
      
      // Step 2: Enhance the roadmap with real resources using Google Search
      console.log('Step 2: Enhancing roadmap with real resources...');
      
      const enhancedSteps: Step[] = [];
      
      // Process each step sequentially
      for (let i = 0; i < roadmapStructure.steps.length; i++) {
        console.log(`Processing step ${i+1}/${roadmapStructure.steps.length}`);
        const step = roadmapStructure.steps[i];
        const enhancedResources: Resource[] = [];
        
        // Process each resource
        for (let j = 0; j < step.resources.length; j++) {
          const resource = step.resources[j];
          console.log(`Processing resource ${j+1}/${step.resources.length}: ${resource.title}`);
          
          // Validate resource type to match frontend expectations
          // IMPORTANT: Must match the ResourceType in the frontend
          const validTypes = ['video', 'article', 'interactive', 'pdf', 'podcast', 'thread'];
          const type = validTypes.includes(resource.type?.toLowerCase()) 
            ? resource.type.toLowerCase() 
            : (userAnswers.contentPreference && validTypes.includes(userAnswers.contentPreference) 
                ? userAnswers.contentPreference 
                : 'article');
          
          // Create a detailed search query based on the topic and resource
          const searchQuery = `${userAnswers.topic} ${resource.title} ${resource.description || ''}`;
          
          try {
            // Wait for the search result
            const searchResult = await searchResource(searchQuery, type);
            
            // Check if the result has a valid link (not example.com)
            let finalLink = searchResult.link;
            
            // If link contains example.com or is empty, use our backup strategy
            if (!finalLink || finalLink.includes('example.com')) {
              console.log('Search returned invalid link, using direct platform URL');
              finalLink = getRealResourceURL(resource.title, type);
            }
            
            // Combine the original resource info with the search result
            enhancedResources.push({
              id: uuidv4(),
              title: resource.title || searchResult.title,
              type: type,
              link: finalLink,
              timeEstimate: resource.timeEstimate || resource.time || '30 min',
              source: searchResult.source,
              description: resource.description || '',
              completed: false
            });
          } catch (e) {
            console.error(`Error processing resource ${j+1}:`, e);
            
            // Add a fallback resource if search fails
            enhancedResources.push({
              id: uuidv4(),
              title: resource.title,
              type: type,
              link: getRealResourceURL(resource.title, type),
              timeEstimate: resource.timeEstimate || resource.time || '30 min',
              source: 'Recommended Platform',
              description: resource.description || '',
              completed: false
            });
          }
        }
        
        // Calculate total time estimate for the step
        const totalMinutes = enhancedResources.reduce((total, resource) => {
          const timeString = resource.timeEstimate;
          const minutes = parseInt(timeString.match(/\d+/)?.[0] || '30');
          return total + minutes;
        }, 0);
        
        // Add the enhanced step
        enhancedSteps.push({
          id: uuidv4(),
          stepNumber: i + 1,
          title: step.title,
          description: step.description,
          resources: enhancedResources,
          completed: false,
          timeEstimate: `${totalMinutes} min`
        });
      }
      
      console.log('Roadmap generation complete, sending response');
      return res.status(200).json(enhancedSteps);
    } catch (openAiError: any) {
      console.error('OpenAI API Error:', openAiError);
      console.error('OpenAI error details:', openAiError.message);
      if (openAiError.response) {
        console.error('Status:', openAiError.response.status);
        console.error('Data:', JSON.stringify(openAiError.response.data));
      }
      
      return res.status(500).json({ 
        error: 'AI processing error', 
        message: openAiError.message || 'Failed to generate roadmap with AI',
        detail: process.env.NODE_ENV === 'development' ? openAiError.toString() : undefined
      });
    }
  } catch (error: any) {
    console.error('Unhandled error in API handler:', error);
    return res.status(500).json({ 
      error: 'Server error',
      message: error.message || 'An unknown error occurred', 
      detail: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// Export the handler function using ES Module syntax
export default handler; 