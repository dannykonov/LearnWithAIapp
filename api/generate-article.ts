import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  } catch (e: any) {
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
    
    const articleContent = completion.choices[0].message?.content || '';
    
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
    
  } catch (error: any) {
    console.error('Error generating article:', error.message);
    return res.status(500).json({
      error: 'Article generation failed',
      message: error.message || 'An unknown error occurred'
    });
  }
} 