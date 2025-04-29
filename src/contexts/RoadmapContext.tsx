import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { updateRoadmapSteps } from '@/services/roadmapService';

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

// Test question interface for podcast resources
export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
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
  isTestMode: boolean;
  paymentStatus: 'paid' | 'pending' | 'unpaid';
  
  // Actions
  setUserAnswers: (answers: UserAnswers) => void;
  setRoadmap: (roadmap: RoadmapStep[]) => void;
  toggleStepCompleted: (stepId: string) => void;
  toggleResourceCompleted: (stepId: string, resourceId: string) => void;
  setCurrentStep: (step: number) => void;
  setIsLoading: (loading: boolean) => void;
  generateMoreSteps: () => void;
  setProgress: (newProgress: number) => void;
  setIsTestMode: (isTest: boolean) => void;
  setPaymentStatus: (status: 'paid' | 'pending' | 'unpaid') => void;
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
  isTestMode: false,
  paymentStatus: 'unpaid',
  
  setUserAnswers: () => {},
  setRoadmap: () => {},
  toggleStepCompleted: () => {},
  toggleResourceCompleted: () => {},
  setCurrentStep: () => {},
  setIsLoading: () => {},
  generateMoreSteps: () => {},
  setProgress: () => {},
  setIsTestMode: () => {},
  setPaymentStatus: () => {},
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
  const [isTestMode, setIsTestModeState] = useState(false);
  const [paymentStatus, setPaymentStatusState] = useState<'paid' | 'pending' | 'unpaid'>('unpaid');
  
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
      setIsTestModeState(false);
    } else {
      setUserId(currentUser.uid);
    }
  }, [currentUser]);

  // Modified setRoadmap to capture userId and reset test mode
  const setRoadmap = useCallback((newRoadmap: RoadmapStep[]) => {
    console.log("setRoadmap called with data:", JSON.stringify(newRoadmap).substring(0, 100) + "...");
    console.log("newRoadmap is array:", Array.isArray(newRoadmap));
    console.log("newRoadmap length:", newRoadmap.length);

    setRoadmapState(newRoadmap);
    setIsTestModeState(false);
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
    if (isTestMode) {
      console.log("generateMoreSteps: Aborted due to Test Mode.");
      toast({
        title: "Test Mode Active",
        description: "Cannot generate more steps while in test mode.",
        variant: "default",
      });
      return;
    }

    console.log("generateMoreSteps called - starting process");
    setIsLoadingState(true);
    try {
      // Get API base URL
      const getApiBaseUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:3001';
        } else {
          console.log('Using production API path (relative URL)');
          return ''; // Empty string means use relative paths from the same domain
        }
      };
      
      const apiBaseUrl = getApiBaseUrl();
      const apiUrl = `${apiBaseUrl}/api/generate-next-step`;
      
      console.log(`Calling API at URL: ${apiUrl}`);
      console.log(`Current hostname: ${window.location.hostname}`);
      console.log(`Current roadmap length: ${roadmap.length} steps`);
      console.log(`User topic: ${userAnswers.topic}`);
      
      // Make API call to generate next step
      console.log("Sending API request for next step generation...");
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentRoadmap: roadmap,
          userAnswers: userAnswers,
          userId: userId
        }),
      });
      
      console.log(`API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || `Failed to generate next step: ${response.status}`);
      }
      
      // Get new step
      const newStep = await response.json();
      console.log(`New step generated: ${newStep.title}`);
      console.log(`Step details: stepNumber=${newStep.stepNumber}, resources=${newStep.resources.length}`);
      
      // Add it to the roadmap and determine the new roadmap
      const updatedRoadmap = [...roadmap, newStep];
      console.log(`Updated roadmap will have ${updatedRoadmap.length} steps`);
      setRoadmapState(updatedRoadmap);
      setManualProgress(null);
      
      // If we have a roadmap ID in the URL (which would be stored in RoadmapPage),
      // save the updated roadmap to Firebase
      const roadmapIdMatch = window.location.pathname.match(/\/roadmap\/([^\/]+)/);
      const roadmapId = roadmapIdMatch ? roadmapIdMatch[1] : null;
      
      if (roadmapId) {
        console.log(`Found roadmap ID in URL: ${roadmapId}, saving to Firebase...`);
        try {
          await updateRoadmapSteps(roadmapId, updatedRoadmap);
          console.log('Roadmap successfully updated in Firebase');
        } catch (firebaseError) {
          console.error('Error saving updated roadmap to Firebase:', firebaseError);
          // Don't throw here - we want to show the new step even if saving fails
        }
      } else {
        console.log('No roadmap ID found in URL - changes only saved locally');
      }

      // Show success toast
      toast({
        title: "New Learning Step Added",
        description: `Added "${newStep.title}" to your learning roadmap.`,
      });
    } catch (error) {
      console.error('Error generating more steps:', error);
      toast({
        title: "Error generating next step",
        description: error instanceof Error ? error.message : "There was a problem generating the next step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingState(false);
      console.log("generateMoreSteps process completed");
    }
  }, [roadmap, userAnswers, userId, setIsLoadingState, isTestMode]);

  // ADDED: Setter function for test mode
  const setIsTestMode = useCallback((isTest: boolean) => {
    setIsTestModeState(isTest);
  }, []);

  // Wrapped in useCallback
  const setPaymentStatus = useCallback((status: 'paid' | 'pending' | 'unpaid') => {
    setPaymentStatusState(status);
  }, []);

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
    isTestMode,
    paymentStatus,
    setUserAnswers,
    setRoadmap,
    toggleStepCompleted,
    toggleResourceCompleted,
    setCurrentStep,
    setIsLoading,
    generateMoreSteps,
    setProgress,
    setIsTestMode,
    setPaymentStatus,
  }), [
    roadmap, userAnswers, userId, currentStep, isLoading, progress, 
    totalSteps, completedSteps, completedResources, totalResources,
    isTestMode, paymentStatus,
    setUserAnswers, setRoadmap, toggleStepCompleted, toggleResourceCompleted, 
    setCurrentStep, setIsLoading, generateMoreSteps, setProgress, setIsTestMode, setPaymentStatus 
  ]);

  return (
    <RoadmapContext.Provider value={contextValue}>
      {children}
    </RoadmapContext.Provider>
  );
};

// Create a custom hook for using the context
export const useRoadmap = () => useContext(RoadmapContext);
