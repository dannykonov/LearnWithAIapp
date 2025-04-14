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
    // Return a default object to prevent crashes
    return {
      videoTitle: "Could not parse video data",
      youtubeUrl: `https://www.youtube.com/results?search_query=programming+tutorial`,
      creator: "YouTube",
      description: "Search results for programming tutorials",
      durationMinutes: 15,
      videoFound: false
    };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  let topic: string, userAnswers: any;
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
      model: "gpt-4",
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
      ]
    });

    const subtopicsContent = completion.choices[0].message?.content;
    console.log('Subtopics generated successfully');
    
    let subtopicsData: any;
    try {
      subtopicsData = JSON.parse(subtopicsContent || '{}');
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

      let videoData: any = null;
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
    
  } catch (error: any) {
    console.error('Error during enhanced roadmap generation:', error.message);
    return res.status(500).json({
      error: 'Enhanced roadmap generation failed',
      message: error.message || 'An unknown error occurred'
    });
  }
} 