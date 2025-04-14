import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

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
  isFallback?: boolean;
}

export interface RoadmapStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  connectionText?: string;
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
  userId: string | null;
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
  setProgress: (newProgress: number) => void;
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
  userId: null,
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
  setProgress: () => {},
});

// Create provider component
export const RoadmapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [roadmap, setRoadmapState] = useState<RoadmapStep[]>([]);
  const [userAnswers, setUserAnswersState] = useState<UserAnswers>(defaultUserAnswers);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStepState] = useState(0);
  const [isLoading, setIsLoadingState] = useState(false);
  const [manualProgress, setManualProgress] = useState<number | null>(null);
  
  // Derived stats
  const totalSteps = roadmap.length;
  const completedSteps = roadmap.filter(step => step.completed).length;
  const calculatedProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const progress = manualProgress !== null ? manualProgress : calculatedProgress;
  
  const totalResources = roadmap.reduce((total, step) => total + step.resources.length, 0);
  const completedResources = roadmap.reduce(
    (total, step) => total + step.resources.filter(r => r.completed).length, 
    0
  );

  // Effect to clear roadmap and userId on logout
  useEffect(() => {
    if (!currentUser) {
      setRoadmapState([]);
      setUserAnswersState(defaultUserAnswers);
      setUserId(null);
      setCurrentStepState(0);
      setManualProgress(null);
    } else {
      setUserId(currentUser.uid);
    }
  }, [currentUser]);

  // Modified setRoadmap to capture userId
  const setRoadmap = useCallback((newRoadmap: RoadmapStep[]) => {
    console.log("setRoadmap called with data:", JSON.stringify(newRoadmap).substring(0, 100) + "...");
    console.log("newRoadmap is array:", Array.isArray(newRoadmap));
    console.log("newRoadmap length:", newRoadmap.length);

    setRoadmapState(newRoadmap);
  }, []);

  // Renamed and wrapped in useCallback
  const setUserAnswers = useCallback((newAnswers: UserAnswers) => {
    setUserAnswersState(newAnswers);
  }, []);

  // Function to manually set progress (for loading saved roadmaps)
  const setProgress = useCallback((newProgress: number) => {
    setManualProgress(newProgress);
  }, []);

  // Toggle step completion
  const toggleStepCompleted = useCallback((stepId: string) => {
    setRoadmapState(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              completed: !step.completed,
              resources: step.resources.map(resource => ({
                ...resource,
                completed: !step.completed
              }))
            } 
          : step
      )
    );
    setManualProgress(null);
  }, []);

  // Toggle resource completion
  const toggleResourceCompleted = useCallback((stepId: string, resourceId: string) => {
    setRoadmapState(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { 
              ...step, 
              resources: step.resources.map(resource => 
                resource.id === resourceId 
                  ? { ...resource, completed: !resource.completed } 
                  : resource
              ),
              completed: step.resources.every(r => 
                r.id === resourceId ? !r.completed : r.completed
              )
            } 
          : step
      )
    );
    setManualProgress(null);
  }, []);

  // Renamed and wrapped in useCallback
  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
  }, []);

  // Renamed and wrapped in useCallback
  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  // Function to generate more steps
  const generateMoreSteps = useCallback(async () => {
    setIsLoadingState(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      setRoadmapState(prev => [...prev, ...newSteps]);
      setManualProgress(null);
    } catch (error) {
      console.error('Error generating more steps:', error);
    } finally {
      setIsLoadingState(false);
    }
  }, [roadmap, userAnswers]);

  const contextValue = useMemo(() => ({
    roadmap,
    userAnswers,
    userId,
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
    generateMoreSteps,
    setProgress,
  }), [
    roadmap, userAnswers, userId, currentStep, isLoading, progress, 
    totalSteps, completedSteps, completedResources, totalResources,
    setUserAnswers, setRoadmap, toggleStepCompleted, toggleResourceCompleted, 
    setCurrentStep, setIsLoading, generateMoreSteps, setProgress 
  ]);

  return (
    <RoadmapContext.Provider value={contextValue}>
      {children}
    </RoadmapContext.Provider>
  );
};

// Create a custom hook for using the context
export const useRoadmap = () => useContext(RoadmapContext);
