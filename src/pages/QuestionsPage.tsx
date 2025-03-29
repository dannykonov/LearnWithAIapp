import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import OnboardingQuestion from '@/components/OnboardingQuestion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRoadmap } from '@/contexts/RoadmapContext';
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
import { Loader2 } from 'lucide-react';
import { generateRoadmap } from '@/services/roadmapService';
import { toast } from '@/components/ui/use-toast';

const QuestionsPage = () => {
  const navigate = useNavigate();
  const { userAnswers, setUserAnswers, setRoadmap, setIsLoading, isLoading } = useRoadmap();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  
  // Check if we have a topic, if not redirect to home
  if (!userAnswers.topic) {
    navigate('/');
  }
  
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
  }, [currentQuestion]);
  
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Sanitize inputs before submission to ensure they match expected patterns
      const sanitizedAnswers = { 
        ...userAnswers,
        // Ensure contentPreference is one of the valid types
        contentPreference: (() => {
          const validTypes = ['video', 'article', 'interactive', 'pdf', 'podcast', 'thread'];
          return validTypes.includes(userAnswers.contentPreference) 
            ? userAnswers.contentPreference 
            : 'article';
        })()
      };
      
      // Use sanitized answers for the API call
      const roadmapData = await generateRoadmap(sanitizedAnswers);
      setRoadmap(roadmapData);
      navigate('/roadmap');
      
      // Show success toast
      toast({
        title: "Roadmap Generated",
        description: `Your personalized learning roadmap for ${userAnswers.topic} is ready!`,
      });
    } catch (error: any) {
      console.error('Error generating roadmap:', error);
      
      // Show error toast with better UX
      toast({
        title: "Error generating roadmap",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if current question has an answer
  const canProceed = () => {
    switch (currentQuestion) {
      case 1:
        return !!userAnswers.existingKnowledge;
      case 2:
        return !!userAnswers.background;
      case 3:
        return !!userAnswers.pace;
      case 4:
        return !!userAnswers.contentPreference;
      case 5:
        return !!userAnswers.availableTime;
      case 6:
        return !!userAnswers.goal;
      default:
        return false;
    }
  };
  
  // Render the current question
  const renderQuestion = () => {
    switch (currentQuestion) {
      case 1:
        return (
          <OnboardingQuestion
            title={`What do you already know about ${userAnswers.topic}?`}
            description="This helps us avoid covering material you already understand."
            questionNumber={1}
            totalQuestions={6}
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
            totalQuestions={6}
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
            totalQuestions={6}
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
            totalQuestions={6}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceed()}
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
            totalQuestions={6}
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
            totalQuestions={6}
            onBack={handleBack}
            onNext={handleNext}
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
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <div className="container mx-auto">
        <header className="flex justify-center mb-12">
          <Logo />
        </header>
        
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
          
          {isLoading && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-xl max-w-md w-full text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-lwai-deepBlue mb-4" />
                <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">
                  Creating Your Roadmap
                </h3>
                <p className="text-gray-600">
                  Our AI is crafting a personalized learning journey for {userAnswers.topic} based on your responses.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuestionsPage;

