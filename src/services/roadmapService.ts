import { UserAnswers, RoadmapStep, ResourceType } from '../contexts/RoadmapContext';

// Add a type for the generation engine choice
export type GenerationEngine = 'chatgpt' | 'perplexity';

// Determine the appropriate API base URL based on environment
const getApiBaseUrl = () => {
  // For local development, use the dedicated Express API server on port 3001
  // This is necessary because in this project, Vite (on 8080) doesn't handle API routes itself
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  } else {
    // In production, use relative path (API is hosted on same domain via Vercel)
    console.log('Using production API path (relative URL)');
    return '';
  }
};

// Calls the API endpoint to generate a roadmap
// Add 'engine' parameter
export const generateRoadmap = async (userAnswers: UserAnswers, engine: GenerationEngine = 'chatgpt'): Promise<RoadmapStep[]> => {
  try {
    console.log(`Sending request to API using ${engine} engine with answers:`, JSON.stringify(userAnswers));
    
    // Determine API endpoint based on the engine choice
    const apiBaseUrl = getApiBaseUrl();
    let apiUrl = '';
    if (engine === 'perplexity') {
      apiUrl = `${apiBaseUrl}/api/generate-roadmap-perplexity`;
      // Ensure contentPreference reflects the engine's capability for the request (optional, depends on API)
      // userAnswers.contentPreference = 'video'; // Example: Force video if using perplexity MVP
    } else {
      // Default to ChatGPT + Search
      apiUrl = `${apiBaseUrl}/api/generate-roadmap-with-search`;
    }
    
    console.log('Calling API at URL:', apiUrl);
    console.log('Current hostname:', window.location.hostname);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userAnswers),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(errorData.message || `Failed to generate roadmap: ${response.status}`);
    }
    
    try {
      // First get the raw response data, which may have different formats
      const responseData = await response.json();
      console.log('API Response received:', responseData);
      
      // Extract the roadmap array, which could be the response itself or nested in a roadmap property
      let roadmapData: RoadmapStep[];
      
      if (Array.isArray(responseData)) {
        // Direct array response (like from generate-roadmap-with-search)
        roadmapData = responseData;
      } else if (responseData.roadmap && Array.isArray(responseData.roadmap)) {
        // Nested structure (like from generate-roadmap-perplexity)
        roadmapData = responseData.roadmap;
      } else {
        console.error('Unknown response format:', responseData);
        throw new Error('Received invalid roadmap data format');
      }
      
      // Validate roadmap data before returning
      if (!Array.isArray(roadmapData)) {
        console.error('Invalid roadmap data, not an array:', roadmapData);
        throw new Error('Received invalid roadmap data format');
      }
      
      // Ensure each step has the required fields
      const validatedRoadmap = roadmapData.map((step, index) => ({
        id: step.id || `step-${index}-${Date.now()}`,
        stepNumber: step.stepNumber || index + 1,
        title: step.title || `Step ${index + 1}`,
        description: step.description || '',
        resources: Array.isArray(step.resources) ? step.resources.map((resource, rIndex) => {
          // Convert resource type to a valid ResourceType
          let validType: ResourceType = 'article';
          const typeStr = resource.type?.toLowerCase();
          if (typeStr === 'video') validType = 'video';
          else if (typeStr === 'article') validType = 'article';
          else if (typeStr === 'interactive') validType = 'interactive';
          else if (typeStr === 'pdf') validType = 'pdf';
          else if (typeStr === 'podcast') validType = 'podcast';
          else if (typeStr === 'thread') validType = 'thread';
          // Default to article if not in allowed values
          
          return {
            id: resource.id || `resource-${rIndex}-${Date.now()}`,
            title: resource.title || 'Resource',
            type: validType,
            link: resource.link || '#',
            timeEstimate: resource.timeEstimate || '30 min',
            source: resource.source || 'Unknown',
            description: resource.description || '',
            completed: false
          };
        }) : [],
        completed: false,
        timeEstimate: step.timeEstimate || '30 min'
      }));

      return validatedRoadmap;
    } catch (parseError) {
      console.error('Error parsing roadmap data:', parseError);
      throw new Error('Failed to parse roadmap data from API');
    }
  } catch (error) {
    console.error('Error generating roadmap:', error);
    // No fallback to mock data - just throw the error
    throw error;
  }
};
