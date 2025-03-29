import { UserAnswers, RoadmapStep } from '../contexts/RoadmapContext';

// Calls the API endpoint to generate a roadmap
export const generateRoadmap = async (userAnswers: UserAnswers): Promise<RoadmapStep[]> => {
  try {
    // Use the ChatGPT + Google Search enhanced endpoint
    const response = await fetch('/api/generate-roadmap-with-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userAnswers),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate roadmap');
    }
    
    const roadmapData: RoadmapStep[] = await response.json();
    return roadmapData;
  } catch (error) {
    console.error('Error generating roadmap:', error);
    // No fallback to mock data - just throw the error
    throw error;
  }
};
