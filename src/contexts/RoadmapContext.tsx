
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for our data structures
export type ResourceType = 'video' | 'article' | 'interactive' | 'pdf' | 'podcast' | 'thread';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  link: string;
  timeEstimate: string;
  source: string;
  description?: string;
  completed: boolean;
}

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  resources: Resource[];
  completed: boolean;
  timeEstimate: string;
}

export interface UserAnswers {
  topic: string;
  existingKnowledge: string;
  background: string;
  pace: string;
  contentPreference: string;
  availableTime: string;
  goal: string;
}

interface RoadmapContextType {
  roadmap: RoadmapStep[];
  userAnswers: UserAnswers;
  currentStep: number;
  isLoading: boolean;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  completedResources: number;
  totalResources: number;
  
  // Actions
  setUserAnswers: (answers: UserAnswers) => void;
  setRoadmap: (roadmap: RoadmapStep[]) => void;
  toggleStepCompleted: (stepId: string) => void;
  toggleResourceCompleted: (stepId: string, resourceId: string) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  generateMoreSteps: () => void;
}

// Default values
const defaultUserAnswers: UserAnswers = {
  topic: '',
  existingKnowledge: '',
  background: '',
  pace: '',
  contentPreference: '',
  availableTime: '',
  goal: '',
};

// Create the context
const RoadmapContext = createContext<RoadmapContextType>({
  roadmap: [],
  userAnswers: defaultUserAnswers,
  currentStep: 0,
  isLoading: false,
  progress: 0,
  totalSteps: 0,
  completedSteps: 0,
  completedResources: 0,
  totalResources: 0,
  
  setUserAnswers: () => {},
  setRoadmap: () => {},
  toggleStepCompleted: () => {},
  toggleResourceCompleted: () => {},
  setCurrentStep: () => {},
  setIsLoading: () => {},
  generateMoreSteps: () => {},
});

// Create provider component
export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>(defaultUserAnswers);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Derived stats
  const totalSteps = roadmap.length;
  const completedSteps = roadmap.filter(step => step.completed).length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  
  const totalResources = roadmap.reduce((total, step) => total + step.resources.length, 0);
  const completedResources = roadmap.reduce(
    (total, step) => total + step.resources.filter(r => r.completed).length, 
    0
  );

  // Toggle step completion
  const toggleStepCompleted = (stepId: string) => {
    setRoadmap(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              completed: !step.completed,
              // Mark all resources as completed/incomplete along with the step
              resources: step.resources.map(resource => ({
                ...resource,
                completed: !step.completed
              }))
            } 
          : step
      )
    );
  };

  // Toggle resource completion
  const toggleResourceCompleted = (stepId: string, resourceId: string) => {
    setRoadmap(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              resources: step.resources.map(resource => 
                resource.id === resourceId 
                  ? { ...resource, completed: !resource.completed } 
                  : resource
              ),
              // Check if all resources are completed to mark step as completed
              completed: step.resources.every(r => 
                r.id === resourceId ? !r.completed : r.completed
              )
            } 
          : step
      )
    );
  };

  // Function to generate more steps
  const generateMoreSteps = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call the API to generate more steps
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Example of how we would add new steps
      const newStepNumber = roadmap.length + 1;
      const newSteps: RoadmapStep[] = [
        {
          id: `step-${Date.now()}`,
          stepNumber: newStepNumber,
          title: `Advanced ${userAnswers.topic} Concepts`,
          description: `Now that you've mastered the basics, let's dive deeper into ${userAnswers.topic}.`,
          resources: [
            {
              id: `resource-${Date.now()}-1`,
              title: `Advanced ${userAnswers.topic} Tutorial`,
              type: 'video',
              link: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              timeEstimate: '15 min',
              source: 'YouTube',
              completed: false
            },
            {
              id: `resource-${Date.now()}-2`,
              title: `${userAnswers.topic} Best Practices`,
              type: 'article',
              link: 'https://example.com/best-practices',
              timeEstimate: '10 min',
              source: 'Example Blog',
              completed: false
            }
          ],
          completed: false,
          timeEstimate: '25 min'
        }
      ];
      
      setRoadmap(prev => [...prev, ...newSteps]);
    } catch (error) {
      console.error('Error generating more steps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoadmapContext.Provider
      value={{
        roadmap,
        userAnswers,
        currentStep,
        isLoading,
        progress,
        totalSteps,
        completedSteps,
        completedResources,
        totalResources,
        
        setUserAnswers,
        setRoadmap,
        toggleStepCompleted,
        toggleResourceCompleted,
        setCurrentStep,
        setIsLoading,
        generateMoreSteps
      }}
    >
      {children}
    </RoadmapContext.Provider>
  );
};

// Create a custom hook for using the context
export const useRoadmap = () => useContext(RoadmapContext);
