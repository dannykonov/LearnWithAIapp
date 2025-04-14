import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import axios from 'axios';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract JSON from markdown-formatted text
const extractJSONFromMarkdown = (text: string) => {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    
    let nextStepData: any;
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

    let videoData: any = null;
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
    
  } catch (error: any) {
    console.error('Error during next step generation:', error.message);
    return res.status(500).json({
      error: 'Next step generation failed',
      message: error.message || 'An unknown error occurred'
    });
  }
} 