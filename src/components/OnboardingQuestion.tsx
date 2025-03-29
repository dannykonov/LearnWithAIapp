
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingQuestionProps {
  title: string;
  description?: string;
  questionNumber: number;
  totalQuestions: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  canProceed?: boolean;
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
}) => {
  return (
    <div className="animate-scale-in">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Question {questionNumber} of {totalQuestions}</span>
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
        </CardHeader>
        
        <CardContent>
          {children}
        </CardContent>
        
        <CardFooter className="flex justify-between">
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
