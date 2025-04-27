import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoadmap } from '@/contexts/RoadmapContext';

interface OnboardingQuestionProps {
  title: string;
  description?: string;
  questionNumber: number;
  totalQuestions: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  canProceed?: boolean;
  onTestModeSubmit?: () => void;
}

const OnboardingQuestion: React.FC<OnboardingQuestionProps> = ({
  title,
  description,
  questionNumber,
  totalQuestions,
  children,
  onBack,
  onNext,
  canProceed = true,
  onTestModeSubmit,
}) => {
  // Get isTestMode from context
  const { isTestMode } = useRoadmap();
  
  // Add keyboard event listener for Command+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Command (Meta) key and Enter are pressed
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (onNext && canProceed) {
          onNext();
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onNext, canProceed]);

  return (
    <div className="animate-scale-in">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Question {questionNumber} of {totalQuestions}</span>
              {isTestMode && (
                <span className="ml-2 inline-flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                  <FlaskConical className="h-3 w-3 mr-1" /> Test Mode
                </span>
              )}
            </div>
            <span className="text-sm text-lwai-skyBlue font-medium">{Math.round((questionNumber / totalQuestions) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-lwai-skyBlue transition-all duration-300" 
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            ></div>
          </div>
          <CardTitle className="text-xl font-bold text-lwai-deepBlue mt-4">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          {isTestMode && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              <p className="flex items-center">
                <FlaskConical className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Test Mode is active. You're creating a placeholder roadmap.</span>
              </p>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {children}
        </CardContent>
        
        <CardFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={!onBack}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <Button
            onClick={onNext}
            disabled={!canProceed || !onNext}
            className="bg-lwai-deepBlue hover:bg-lwai-deepBlue/90 text-white flex items-center"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingQuestion;
