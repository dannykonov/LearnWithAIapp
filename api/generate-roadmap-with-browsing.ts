import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userAnswers = req.body;
    
    console.log('Generating roadmap with better resource recommendations...');
    
    // Since direct web browsing isn't available, use a detailed prompt with the chat completions API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator with extensive knowledge of online learning resources.
          Your task is to create personalized learning roadmaps with specific, real learning resources that actually exist.
          
          For each resource you recommend:
          - Use REAL websites, courses, and platforms that actually exist (Coursera, edX, Udemy, Khan Academy, YouTube, etc.)
          - Provide specific, descriptive titles that would actually be used
          - Suggest real course names, video titles, or article names
          - Estimate realistic time commitments
          - Mention actual content creators or sources when possible
          
          Create a coherent learning progression from basics to advanced topics.
          Avoid using "example.com" or placeholder URLs - if you don't know the exact URL, suggest a real platform where 
          the learner can search for the content (e.g., "Search on Coursera for: Python for Beginners").`
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
          
          Please create a 5-step roadmap. Each step should have:
          1. A clear title
          2. A description of what to learn
          3. 2-3 specific resources (videos, courses, articles, etc.)
          
          For each resource, include:
          - Title (be specific, not generic)
          - Type (video/article/interactive/pdf/podcast/thread)
          - Link suggestions (where to find it)
          - Estimated time commitment
          - Source (platform, creator, organization)
          
          Please format your response as a JSON object with a "steps" array.`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Get the content from the response
    const content = completion.choices[0].message.content;
    
    // Parse the JSON
    let roadmapData;
    try {
      roadmapData = JSON.parse(content || '{}');
    } catch (e) {
      console.error('Error parsing JSON from response:', e);
      roadmapData = { raw: content };
    }
    
    // Format response to match the expected structure in your app
    const formattedSteps = roadmapData.steps?.map((step, index) => {
      const resources = step.resources.map(resource => ({
        id: uuidv4(),
        title: resource.title,
        type: resource.type,
        link: resource.link || resource.url || `https://www.google.com/search?q=${encodeURIComponent(resource.title)}`,
        timeEstimate: resource.timeEstimate || resource.time || '15 min',
        source: resource.source,
        description: resource.description || '',
        completed: false
      }));
      
      // Calculate total time estimate for the step
      const totalMinutes = resources.reduce((total, resource) => {
        const timeString = resource.timeEstimate;
        const minutes = parseInt(timeString.match(/\d+/)?.[0] || '15');
        return total + minutes;
      }, 0);
      
      return {
        id: uuidv4(),
        stepNumber: index + 1,
        title: step.title,
        description: step.description,
        resources: resources,
        completed: false,
        timeEstimate: `${totalMinutes} min`
      };
    }) || [];
    
    return res.status(200).json(formattedSteps);
  } catch (error: any) {
    console.error('Error generating roadmap:', error);
    return res.status(500).json({ 
      error: 'Failed to generate roadmap',
      message: error.message 
    });
  }
} 