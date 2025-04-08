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
const PERPLEXITY_MODEL = 'pplx-7b-online'; // Or 'pplx-70b-online', etc.

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
    topic = req.body.topic;
    if (!topic) {
      throw new Error('Missing topic in request body');
    }
    console.log(`Received request for Perplexity roadmap generation for topic: ${topic}`);
  } catch (e: any) {
    console.error('ERROR: Failed to parse request body or missing topic:', e.message);
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Could not parse request body or topic is missing'
    });
  }

  // Step 4: Perplexity API Prompt Engineering
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
    // Step 5: Call Perplexity API
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: PERPLEXITY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate the 5-step YouTube video roadmap for ${topic}` } // User message can be simple
        ],
        // Optional parameters (temperature, max_tokens, etc.) can be added here if needed
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
      if (!perplexityResult || !Array.isArray(perplexityResult.steps) || perplexityResult.steps.length === 0) {
         throw new Error('Parsed JSON is not in the expected format or steps array is empty.');
      }
       console.log('Successfully parsed Perplexity JSON response.');
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