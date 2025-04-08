import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define interfaces for our data structures (consistent with other generators)
interface Resource {
  id: string;
  title: string;
  type: 'video'; // Hardcoded for this MVP
  link: string;
  timeEstimate: string; // Can be 'N/A' or potentially extracted if PPLX provides it
  source: 'YouTube'; // Hardcoded for this MVP
  description: string;
  completed: boolean;
}

interface Step {
  id: string;
  stepNumber: number;
  title: string; // Can be derived from the video title or PPLX response
  description: string; // Provided by PPLX
  resources: Resource[]; // Will contain exactly one resource (video)
  completed: boolean;
  timeEstimate: string; // Sum of resource time estimates (just one for MVP)
}

// Perplexity API Configuration (Verify endpoint and model with documentation)
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar'; // Using the correct model name from their documentation

// Add additional API parameters
const PERPLEXITY_API_PARAMS = {
  temperature: 0.7,
  max_tokens: 2048,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  let topic: string;
  try {
    // Check if the topic is directly in the request body or inside a userAnswers object
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
  } catch (e: any) {
    console.error('ERROR: Failed to parse request body or missing topic:', e.message);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Could not parse request body or topic is missing'
    });
  }

  // Step 4: Perplexity API Prompt Engineering
  const systemPrompt = `You are an expert curriculum designer specializing in creating concise video-based learning paths.
Your ONLY task is to generate a valid JSON object representing a 5-step learning roadmap for the topic "${topic}".

The JSON object MUST follow this EXACT format:
{
  "steps": [
    {
      "stepNumber": 1,
      "title": "Video Title 1",
      "youtubeUrl": "https://www.youtube.com/watch?v=...",
      "description": "Description for video 1."
    },
    ...more steps...
  ]
}

IMPORTANT REQUIREMENTS:
1. Each step corresponds to EXACTLY ONE specific YouTube video
2. The sequence of videos must build upon each other logically
3. Include REAL YouTube URLs for actual existing videos
4. Include exactly 5 steps (no more, no less)
5. Your response MUST be VALID JSON only - no additional text, explanations, or markdown
6. Do not include comments in the JSON
7. Make sure the youtubeUrl is a complete and valid YouTube URL

The final response should be ONLY the JSON object, nothing else.`;

  try {
    console.log(`Calling Perplexity API (${PERPLEXITY_MODEL}) for topic: ${topic}`);
    // Step 5: Call Perplexity API
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

    // Step 6: Process Perplexity Response
    let perplexityResult;
    let rawContent = response.data.choices[0]?.message?.content;

    if (!rawContent) {
        throw new Error('Perplexity API returned an empty response content.');
    }

    console.log('Raw content from Perplexity:', rawContent);

    try {
      // Attempt to parse the JSON content directly
      perplexityResult = JSON.parse(rawContent);
      
      // Enhanced parsing logic to handle different response formats
      if (perplexityResult && Array.isArray(perplexityResult.steps) && perplexityResult.steps.length > 0) {
        // All good, the format is as expected
        console.log('Successfully parsed Perplexity JSON response with steps array.');
      } else if (perplexityResult && Array.isArray(perplexityResult) && perplexityResult.length > 0) {
        // The response might be a direct array instead of {steps: [...]}
        console.log('Perplexity returned a direct array instead of a steps object, adapting...');
        perplexityResult = { steps: perplexityResult };
      } else {
        // Try to extract steps from any nested structure
        console.log('Looking for steps array in nested structure...');
        let foundSteps: any[] | null = null;
        
        // Search for any array property that might contain our data
        Object.keys(perplexityResult || {}).forEach(key => {
          if (Array.isArray(perplexityResult[key]) && perplexityResult[key].length > 0) {
            console.log(`Found potential steps array in property: ${key}`);
            foundSteps = perplexityResult[key];
          }
        });
        
        if (foundSteps) {
          perplexityResult = { steps: foundSteps };
        } else {
          // If all else fails, try to construct a basic structure from the response
          console.log('Attempting to create steps structure from raw response...');
          
          // Search for potential YouTube URLs in the text and build a basic structure
          const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/g;
          const youtubeLinks = rawContent.match(youtubeRegex) || [];
          
          if (youtubeLinks.length > 0) {
            console.log(`Found ${youtubeLinks.length} YouTube links in response, constructing steps...`);
            perplexityResult = {
              steps: youtubeLinks.slice(0, 5).map((link, index) => ({
                stepNumber: index + 1,
                title: `Video ${index + 1} for ${topic}`,
                youtubeUrl: link,
                description: `Part ${index + 1} of learning ${topic}.`
              }))
            };
          } else {
            throw new Error('Could not find steps array or YouTube links in Perplexity response.');
          }
        }
      }
      
      // Final validation
      if (!perplexityResult || !Array.isArray(perplexityResult.steps) || perplexityResult.steps.length === 0) {
        throw new Error('Parsed JSON is not in the expected format or steps array is empty.');
      }
      
      console.log('Successfully processed Perplexity response into a valid steps format.');
    } catch (parseError: any) {
      console.error('ERROR: Failed to parse JSON response from Perplexity:', parseError.message);
      console.error('Raw content was:', rawContent);
       // Optional: Implement more robust JSON extraction if needed, similar to the other generator
      throw new Error('Perplexity API did not return valid JSON in the expected format.');
    }

    // Step 7: Format into Roadmap Structure
    const formattedSteps: Step[] = perplexityResult.steps.map((pplxStep: any, index: number): Step => {
       if (!pplxStep.youtubeUrl || !pplxStep.title || !pplxStep.description) {
           console.warn(`Warning: Step ${index + 1} from Perplexity is missing required fields (youtubeUrl, title, or description). Skipping fields.`);
       }
      const resource: Resource = {
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

     // Ensure we always return 5 steps, even if PPLX returns fewer/more? For MVP, we trust PPLX gives 5.
     // You might add logic here to truncate or pad if needed.

    // Step 8: Return Response
    console.log(`Successfully generated roadmap with ${formattedSteps.length} steps.`);
    return res.status(200).json({ roadmap: formattedSteps });

  } catch (error: any) {
    console.error('Error during Perplexity API call or processing:', error.message);
    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error Status:', error.response.status);
      console.error('API Error Data:', JSON.stringify(error.response.data));
       return res.status(error.response.status || 500).json({
           error: 'Perplexity API error',
           message: error.response.data?.message || error.message,
           details: error.response.data
       });
    } else {
       return res.status(500).json({
           error: 'Internal server error',
           message: error.message || 'An unexpected error occurred during roadmap generation.'
       });
    }
  }
} 