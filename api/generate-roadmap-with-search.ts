import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Google Search API configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// Function to search for resources using Google Custom Search API
async function searchResource(query: string, contentType: string): Promise<{ title: string; link: string; source: string }> {
  try {
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
    
    if (response.data.items && response.data.items.length > 0) {
      const result = response.data.items[0];
      return {
        title: result.title,
        link: result.link,
        source: result.displayLink || (new URL(result.link)).hostname
      };
    }
    
    // If no results, return a fallback
    return {
      title: query,
      link: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      source: 'Google Search'
    };
  } catch (error) {
    console.error('Error searching for resource:', error);
    // Return a fallback on error
    return {
      title: query,
      link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: 'Google Search (Fallback)'
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userAnswers = req.body;
    
    console.log('Generating roadmap structure with ChatGPT...');
    
    // Step 1: Generate the roadmap structure using ChatGPT
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
          - Type (video/article/interactive/course/tutorial/pdf/podcast)
          - Brief description of what this resource should cover
          - Approximate time commitment (15min, 30min, 1hr, etc.)
          
          Format your response as a JSON object with a "steps" array.`
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
    
    // Parse the roadmap structure
    let roadmapStructure;
    try {
      roadmapStructure = JSON.parse(content || '{}');
    } catch (e) {
      console.error('Error parsing JSON from response:', e);
      throw new Error('Failed to parse roadmap structure');
    }
    
    // Step 2: Enhance the roadmap with real resources using Google Search
    console.log('Enhancing roadmap with real resources...');
    
    const enhancedSteps = [];
    
    // Process each step sequentially
    for (let i = 0; i < roadmapStructure.steps.length; i++) {
      const step = roadmapStructure.steps[i];
      const enhancedResources = [];
      
      // Process each resource
      for (let j = 0; j < step.resources.length; j++) {
        const resource = step.resources[j];
        
        // Create a detailed search query based on the topic and resource
        const searchQuery = `${userAnswers.topic} ${resource.title} ${resource.description || ''}`;
        
        // Wait for the search result
        const searchResult = await searchResource(searchQuery, resource.type);
        
        // Combine the original resource info with the search result
        enhancedResources.push({
          id: uuidv4(),
          title: resource.title || searchResult.title,
          type: resource.type || 'article',
          link: searchResult.link,
          timeEstimate: resource.timeEstimate || resource.time || '30 min',
          source: searchResult.source,
          description: resource.description || '',
          completed: false
        });
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
    
    return res.status(200).json(enhancedSteps);
  } catch (error: any) {
    console.error('Error generating roadmap:', error);
    return res.status(500).json({ 
      error: 'Failed to generate roadmap',
      message: error.message 
    });
  }
} 