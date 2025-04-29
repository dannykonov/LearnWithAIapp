import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingQuestion from '@/components/OnboardingQuestion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRoadmap, ResourceType } from '@/contexts/RoadmapContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebaseConfig';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, FlaskConical } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { generateRoadmap, GenerationEngine } from '@/services/roadmapService';
import { toast } from '@/components/ui/use-toast';

const QuestionsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { userAnswers, setUserAnswers, setRoadmap, setIsLoading, isLoading, setIsTestMode, isTestMode } = useRoadmap();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedEngine] = useState<GenerationEngine>('enhanced');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const estimatedDuration = 30000;
  
  useEffect(() => {
    if (!currentUser || !userAnswers.topic) {
      navigate(currentUser ? '/' : '/login');
    }
  }, [currentUser, userAnswers.topic, navigate]);
  
  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      setProgress(0);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsedTime = Date.now() - startTimeRef.current;
          const calculatedProgress = Math.min(95, (elapsedTime / estimatedDuration) * 100);
          setProgress(calculatedProgress);
        }
      }, 200);

    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (startTimeRef.current !== null) {
        setProgress(100);
        setTimeout(() => setProgress(0), 500);
        startTimeRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading]);
  
  const handleSubmit = useCallback(async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate a roadmap.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    try {
      const sanitizedAnswers = { 
        ...userAnswers,
        contentPreference: (() => {
          const validTypes = ['video', 'article', 'interactive', 'pdf', 'podcast', 'thread'];
          return validTypes.includes(userAnswers.contentPreference) 
            ? userAnswers.contentPreference 
            : 'article';
        })()
      };
      
      if (isTestMode) {
        console.log('Generating placeholder roadmap in test mode');
        const placeholderRoadmap = Array.from({ length: 5 }, (_, i) => ({
          id: `test-step-${i + 1}-${Date.now()}`,
          stepNumber: i + 1,
          title: `Placeholder Step ${i + 1}`,
          description: `This is a placeholder description for step ${i + 1}. AI generation was skipped. This should contain enough text to appear realistic and match the layout of a normally generated roadmap step. It should show how the component handles multi-line text without revealing too much emptiness.`,
          resources: [
            {
              id: `test-resource-${i + 1}-${Date.now()}`,
              title: `Placeholder Video Resource for Step ${i + 1}`,
              type: 'video' as ResourceType,
              link: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
              timeEstimate: '15 min',
              source: 'Test Source',
              description: 'This is a placeholder video resource for testing the UI layout without making actual API calls.',
              completed: false,
              isFallback: true
            },
            {
              id: `test-resource-article-${i + 1}-${Date.now()}`,
              title: `Placeholder Article Resource for Step ${i + 1}`,
              type: 'article' as ResourceType,
              link: 'https://example.com/test-article',
              timeEstimate: '10 min',
              source: 'Test Blog',
              description: 'This is a placeholder article resource to ensure the resource list appears correctly.',
              completed: false,
              isFallback: true
            }
          ],
          completed: false,
          timeEstimate: '25 min',
          connectionText: i > 0 ? `This step builds on concepts from step ${i}.` : 'This is the foundation of your learning journey.'
        }));

        setRoadmap(placeholderRoadmap);

        try {
          const roadmapDoc = {
            userId: currentUser.uid,
            topic: sanitizedAnswers.topic,
            userAnswers: sanitizedAnswers,
            steps: placeholderRoadmap,
            createdAt: serverTimestamp(),
            lastUpdatedAt: serverTimestamp(),
            progress: 0,
          };
          const docRef = await addDoc(collection(db, "roadmaps"), roadmapDoc);
          toast({
            title: "Test Roadmap Created",
            description: `A placeholder roadmap for ${userAnswers.topic} is ready.`,
          });
        } catch (firestoreError) {
          console.error('Error saving test roadmap to Firestore:', firestoreError);
        }
      } else {
        console.log('Submitting with enhanced roadmap generation');
        const roadmapData = await generateRoadmap(sanitizedAnswers, 'enhanced');
        setRoadmap(roadmapData);

        try {
          const roadmapDoc = {
            userId: currentUser.uid,
            topic: sanitizedAnswers.topic,
            userAnswers: sanitizedAnswers,
            steps: roadmapData,
            createdAt: serverTimestamp(),
            lastUpdatedAt: serverTimestamp(),
            progress: 0,
          };
          const docRef = await addDoc(collection(db, "roadmaps"), roadmapDoc);
          toast({
            title: "Roadmap Generated & Saved",
            description: `Your personalized learning roadmap for ${userAnswers.topic} is ready!`,
          });
        } catch (firestoreError) {
          console.error('Error saving roadmap to Firestore:', firestoreError);
          toast({
            title: "Roadmap Generated (Save Failed)",
            description: "Your roadmap was generated but failed to save. You can still view it now.",
          });
        }
      }

      navigate('/roadmap');
    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      
      toast({
        title: "Error generating roadmap",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userAnswers, selectedEngine, setIsLoading, setRoadmap, navigate, isTestMode]);
  
  const handleTestModeSubmit = useCallback(() => {
    if (!currentUser) {
      toast({ title: "Authentication Required", description: "Please log in first.", variant: "destructive" });
      navigate('/login');
      return;
    }
    
    console.log('Activating Test Mode');
    
    setIsTestMode(true);
    
    toast({
      title: "Test Mode Activated",
      description: "Continue through all questions. A placeholder roadmap will be created at the end.",
      variant: "default",
    });
    
    if (currentQuestion < 6) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentUser, setIsTestMode, toast, currentQuestion, setCurrentQuestion, handleSubmit, navigate]);
  
  const handleBack = useCallback(() => {
    if (currentQuestion > 1) {
      setCurrentQuestion(prev => prev - 1);
    } else {
      navigate('/');
    }
  }, [currentQuestion, navigate]);
  
  const handleNext = useCallback(() => {
    if (currentQuestion < 6) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentQuestion, handleSubmit]);
  
  const canProceed = () => {
    return true;
  };
  
  const renderQuestion = () => {
    const totalQuestions = 6;
    
    switch (currentQuestion) {
      case 1:
        return (
          <OnboardingQuestion
            title={`What do you already know about ${userAnswers.topic}?`}
            description="This helps us avoid covering material you already understand."
            questionNumber={1}
            totalQuestions={totalQuestions}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceed()}
          >
            <Textarea
              placeholder="I have basic knowledge of..."
              className="min-h-[150px]"
              value={userAnswers.existingKnowledge}
              onChange={e => setUserAnswers({
                ...userAnswers,
                existingKnowledge: e.target.value
              })}
            />
          </OnboardingQuestion>
        );
        
      case 2:
        return (
          <OnboardingQuestion
            title="What's your background or experience level?"
            description="Tell us about your general experience level and background."
            questionNumber={2}
            totalQuestions={totalQuestions}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceed()}
          >
            <Select
              value={userAnswers.background}
              onValueChange={value => setUserAnswers({
                ...userAnswers,
                background: value
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete_beginner">Complete Beginner</SelectItem>
                <SelectItem value="some_exposure">Some Exposure</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert Looking to Specialize</SelectItem>
              </SelectContent>
            </Select>
          </OnboardingQuestion>
        );
        
      case 3:
        return (
          <OnboardingQuestion
            title="How fast do you want to learn?"
            description="Choose the learning pace that works best for you."
            questionNumber={3}
            totalQuestions={totalQuestions}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceed()}
          >
            <RadioGroup
              value={userAnswers.pace}
              onValueChange={value => setUserAnswers({
                ...userAnswers,
                pace: value
              })}
              className="grid gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual" className="font-normal text-base">
                  Casual - I'm learning for fun, no rush
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="steady" id="steady" />
                <Label htmlFor="steady" className="font-normal text-base">
                  Steady - Regular progress at a comfortable pace
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intensive" id="intensive" />
                <Label htmlFor="intensive" className="font-normal text-base">
                  Intensive - I want to learn as quickly as possible
                </Label>
              </div>
            </RadioGroup>
          </OnboardingQuestion>
        );
        
      case 4:
        return (
          <OnboardingQuestion
            title="How do you prefer to learn?"
            description="Select your preferred learning format(s)."
            questionNumber={4}
            totalQuestions={totalQuestions}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceed()}
            onTestModeSubmit={handleTestModeSubmit}
          >
            <RadioGroup
              value={userAnswers.contentPreference}
              onValueChange={value => setUserAnswers({
                ...userAnswers,
                contentPreference: value
              })}
              className="grid gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video" id="video" />
                <Label htmlFor="video" className="font-normal text-base">
                  Videos - I learn best by watching tutorials and explanations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="article" id="article" />
                <Label htmlFor="article" className="font-normal text-base">
                  Articles - I prefer reading and text-based learning
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="interactive" id="interactive" />
                <Label htmlFor="interactive" className="font-normal text-base">
                  Interactive - I learn by doing and practicing
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mixed" id="mixed" />
                <Label htmlFor="mixed" className="font-normal text-base">
                  Mixed - I enjoy a variety of resource types
                </Label>
              </div>
            </RadioGroup>
          </OnboardingQuestion>
        );
        
      case 5:
        return (
          <OnboardingQuestion
            title="How much time can you dedicate weekly?"
            description="This helps us create a roadmap that fits your schedule."
            questionNumber={5}
            totalQuestions={totalQuestions}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceed()}
          >
            <Select
              value={userAnswers.availableTime}
              onValueChange={value => setUserAnswers({
                ...userAnswers,
                availableTime: value
              })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select available time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2 hours">1-2 hours per week</SelectItem>
                <SelectItem value="3-5 hours">3-5 hours per week</SelectItem>
                <SelectItem value="5-10 hours">5-10 hours per week</SelectItem>
                <SelectItem value="10+ hours">10+ hours per week</SelectItem>
              </SelectContent>
            </Select>
          </OnboardingQuestion>
        );
        
      case 6:
        return (
          <OnboardingQuestion
            title="What's your learning goal?"
            description={`Why do you want to learn ${userAnswers.topic}?`}
            questionNumber={6}
            totalQuestions={totalQuestions}
            onBack={handleBack}
            onNext={handleSubmit}
            canProceed={canProceed()}
          >
            <Textarea
              placeholder="I want to learn this because..."
              className="min-h-[150px]"
              value={userAnswers.goal}
              onChange={e => setUserAnswers({
                ...userAnswers,
                goal: e.target.value
              })}
            />
          </OnboardingQuestion>
        );
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Generating Your Roadmap...</h2>
          <p className="text-gray-600 mb-6">Please wait while our AI crafts your personalized learning path. This may take a moment.</p>
          <ProgressBar progress={progress} className="w-full mb-4" />
          <p className="text-sm text-gray-500">Estimated time: ~30 seconds</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 pt-20">
      <div className="container mx-auto">
        <main className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-lwai-deepBlue">
              Personalizing Your {userAnswers.topic} Learning Roadmap
            </h1>
            <p className="text-gray-600 mt-2">
              Answer a few questions to help us create your tailored learning journey.
            </p>
          </div>
          
          {renderQuestion()}
        </main>
      </div>
    </div>
  );
};

export default QuestionsPage;

