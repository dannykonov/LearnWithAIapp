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
  const systemPrompt = `You are an expert curriculum designer creating a video learning path.
For the topic "${topic}", recommend exactly 5 YouTube videos that build upon each other in a logical sequence for a beginner to learn this topic.

Just list the videos with:
1. A brief title/description
2. The FULL YouTube URL (must be a valid YouTube link)

No need for JSON formatting or additional explanations. Just provide 5 YouTube videos with their titles and URLs.`;

  try {
    console.log(`Calling Perplexity API (${PERPLEXITY_MODEL}) for topic: ${topic}`);
    // Step 5: Call Perplexity API
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: PERPLEXITY_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Give me 5 YouTube videos to learn ${topic}, with full URLs. Just the titles and links, no explanations.` }
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
    let rawContent = response.data.choices[0]?.message?.content;

    if (!rawContent) {
        throw new Error('Perplexity API returned an empty response content.');
    }

    console.log('Raw content from Perplexity:', rawContent);

    // Parse text response to extract YouTube links
    try {
      // Regular expression to match YouTube URLs
      const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/[^\s"']+/g;
      const youtubeLinks: string[] = [];
      let urlMatch;
      while ((urlMatch = youtubeRegex.exec(rawContent)) !== null) {
        youtubeLinks.push(urlMatch[0]);
      }
      
      if (youtubeLinks.length === 0) {
        console.error('No YouTube links found in the response content');
        throw new Error('No YouTube links found in the Perplexity response.');
      }
      
      console.log(`Found ${youtubeLinks.length} YouTube links in the response`);
      
      // Regular expression to match numbered items with titles
      const titleRegex = /\d+\.\s+([^\n]+)(?=https?|$)/g;
      const titles: string[] = [];
      let match;
      while ((match = titleRegex.exec(rawContent)) !== null) {
        titles.push(match[1].trim());
      }
      
      console.log(`Found ${titles.length} titles in the response`);
      
      // If we didn't find enough titles, generate some based on the topic
      while (titles.length < youtubeLinks.length) {
        titles.push(`${topic} - Video ${titles.length + 1}`);
      }
      
      // Build our steps array (up to 5 videos)
      const steps = youtubeLinks.slice(0, 5).map((link, index) => {
        return {
          stepNumber: index + 1,
          title: titles[index] || `${topic} - Video ${index + 1}`,
          youtubeUrl: link,
          description: `Part ${index + 1} of the learning sequence for ${topic}.`
        };
      });
      
      // Create our final perplexityResult object
      const perplexityResult = { steps };
      
      // Step 7: Format into Roadmap Structure
      const formattedSteps: Step[] = perplexityResult.steps.map((pplxStep: any, index: number): Step => {
        const resource: Resource = {
          id: uuidv4(),
          title: pplxStep.title || `Video Step ${index + 1}`,
          type: 'video',
          link: pplxStep.youtubeUrl || '#',
          timeEstimate: 'N/A', // MVP default
          source: 'YouTube',
          description: pplxStep.description || 'No description provided.',
          completed: false,
        };

        return {
          id: uuidv4(),
          stepNumber: pplxStep.stepNumber || index + 1,
          title: `Step ${index + 1}: ${resource.title}`,
          description: resource.description,
          resources: [resource],
          completed: false,
          timeEstimate: resource.timeEstimate,
        };
      });

      console.log(`Successfully generated roadmap with ${formattedSteps.length} steps.`);
      return res.status(200).json({ roadmap: formattedSteps });
      
    } catch (parseError: any) {
      console.error('ERROR: Failed to extract YouTube links from Perplexity response:', parseError.message);
      console.error('Raw content was:', rawContent);
      throw new Error('Failed to extract YouTube links from Perplexity response.');
    }

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