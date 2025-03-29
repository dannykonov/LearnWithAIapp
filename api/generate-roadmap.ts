import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log to help debug
console.log('Environment check:', process.env.OPENAI_API_KEY ? 'API key found' : 'API key missing');

// Temporary workaround for local development
// IMPORTANT: Remove this before committing to GitHub
// Replace 'your-actual-api-key-here' with your real API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-actual-api-key-here'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userAnswers = req.body;
    
    // Example schema for better responses
    const format = {
      steps: [
        {
          title: "Step Title",
          description: "Detailed description of what to learn",
          resources: [
            {
              title: "Resource Title",
              type: "video|article|interactive|pdf|podcast|thread",
              link: "https://example.com",
              timeEstimate: "15 min",
              source: "Source name",
              description: "Brief description of the resource"
            }
          ]
        }
      ]
    };
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert educational content creator. Create detailed learning roadmaps with 5 steps.
          Each step should have a title, description, and 2-3 resources (videos, articles, etc).
          For each resource, include title, type (video/article/interactive/pdf/podcast/thread), link (use placeholder URLs if needed), 
          timeEstimate, and source. Format your response as JSON matching this structure: ${JSON.stringify(format)}`
        },
        {
          role: "user",
          content: `Create a personalized learning roadmap for someone who wants to learn ${userAnswers.topic}.
          Their existing knowledge: ${userAnswers.existingKnowledge}
          Background: ${userAnswers.background}
          Learning pace: ${userAnswers.pace}
          Preferred content format: ${userAnswers.contentPreference}
          Available time: ${userAnswers.availableTime}
          End goal: ${userAnswers.goal}
          Please focus on filling knowledge gaps rather than repeating what they already know.`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse and process the response
    const content = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Format response to match app's expected structure
    const roadmapSteps = content.steps.map((step, index) => {
      const resources = step.resources.map(resource => ({
        id: uuidv4(),
        title: resource.title,
        type: resource.type,
        link: resource.link,
        timeEstimate: resource.timeEstimate,
        source: resource.source,
        description: resource.description || '',
        completed: false
      }));
      
      // Calculate total time for the step
      const totalMinutes = resources.reduce((total, resource) => {
        const minutes = parseInt(resource.timeEstimate.split(' ')[0]);
        return total + (isNaN(minutes) ? 10 : minutes);
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
    });
    
    return res.status(200).json(roadmapSteps);
  } catch (error: any) {
    console.error('Error generating roadmap:', error);
    return res.status(500).json({ 
      error: 'Failed to generate roadmap',
      message: error.message 
    });
  }
} 