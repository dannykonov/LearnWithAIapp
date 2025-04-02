import { UserAnswers, RoadmapStep, ResourceType } from '../contexts/RoadmapContext';

// Calls the API endpoint to generate a roadmap
export const generateRoadmap = async (userAnswers: UserAnswers): Promise<RoadmapStep[]> => {
  try {
    console.log('Sending request to API with answers:', JSON.stringify(userAnswers));
    
    // Use the ChatGPT + Google Search enhanced endpoint
    // Use the local backend server running on port 3001
    const response = await fetch('http://localhost:3001/api/generate-roadmap-with-search', {
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
      const roadmapData: RoadmapStep[] = await response.json();
      
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
