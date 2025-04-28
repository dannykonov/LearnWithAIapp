import React, { useState } from 'react';
import { TestQuestion } from '@/contexts/RoadmapContext';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { generateTestQuestions } from '@/services/roadmapService';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PodcastTestProps {
  stepTitle: string;
  stepDescription: string;
  podcastTitle: string;
}

const PodcastTest: React.FC<PodcastTestProps> = ({ 
  stepTitle, 
  stepDescription, 
  podcastTitle 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [score, setScore] = useState(0);

  const handleGenerateTest = async () => {
    setIsGenerating(true);
    try {
      const questions = await generateTestQuestions(stepTitle, stepDescription, podcastTitle);
      setTestQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswerIndex(null);
      setFeedback(null);
      setIsTestComplete(false);
      setScore(0);
    } catch (error) {
      console.error('Error generating test questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate test questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (feedback) return; // Prevent changing answer after submission
    setSelectedAnswerIndex(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIndex === null || !testQuestions) return;

    const currentQuestion = testQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswerIndex === currentQuestion.correctAnswerIndex;

    setFeedback({
      isCorrect,
      message: isCorrect 
        ? 'Correct! Well done!' 
        : `Incorrect. The correct answer is: ${currentQuestion.options[currentQuestion.correctAnswerIndex]}`
    });

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!testQuestions) return;

    // If we're on the last question, complete the test
    if (currentQuestionIndex === testQuestions.length - 1) {
      setIsTestComplete(true);
    } else {
      // Move to the next question
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setFeedback(null);
    }
  };

  const handleRetakeTest = () => {
    if (!testQuestions) return;
    
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setFeedback(null);
    setIsTestComplete(false);
    setScore(0);
  };

  return (
    <div className="mt-6 p-4 border-2 border-blue-400 rounded-lg bg-blue-50 shadow-md">
      {!testQuestions ? (
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold text-blue-700 mb-3">Test Your Understanding</h3>
          <Button
            variant="outline"
            onClick={handleGenerateTest}
            disabled={isGenerating}
            className="bg-blue-600 text-white hover:bg-blue-700 border-blue-400 hover:text-white transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Test...
              </>
            ) : (
              <>Generate Quiz Questions</>
            )}
          </Button>
        </div>
      ) : isTestComplete ? (
        <div className="flex flex-col items-center py-4">
          <h3 className="text-xl font-semibold text-lwai-deepBlue mb-4">Test Complete!</h3>
          <div className="text-2xl font-bold mb-4">
            Score: {score}/{testQuestions.length}
          </div>
          <p className="text-gray-600 mb-6 text-center">
            {score === testQuestions.length
              ? "Perfect score! You've mastered this content."
              : "Great effort! Consider reviewing the podcast to reinforce your understanding."}
          </p>
          <Button
            variant="outline"
            onClick={handleRetakeTest}
            className="bg-blue-500 text-white hover:bg-blue-600"
          >
            Retake Test
          </Button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold text-lwai-deepBlue mb-4">
            Question {currentQuestionIndex + 1} of {testQuestions.length}
          </h3>
          
          <div className="mb-6">
            <p className="font-medium mb-4">{testQuestions[currentQuestionIndex].question}</p>
            
            <div className="space-y-3">
              {testQuestions[currentQuestionIndex].options.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedAnswerIndex === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50",
                    feedback && index === testQuestions[currentQuestionIndex].correctAnswerIndex
                      ? "border-green-500 bg-green-50"
                      : "",
                    feedback && 
                      selectedAnswerIndex === index && 
                      index !== testQuestions[currentQuestionIndex].correctAnswerIndex
                      ? "border-red-500 bg-red-50"
                      : ""
                  )}
                >
                  <div className="flex items-center">
                    <div className="mr-3 flex-shrink-0">
                      {feedback && index === testQuestions[currentQuestionIndex].correctAnswerIndex ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : feedback && selectedAnswerIndex === index ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <div className={cn(
                          "h-5 w-5 rounded-full border flex items-center justify-center",
                          selectedAnswerIndex === index
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-gray-300"
                        )}>
                          {String.fromCharCode(65 + index)}
                        </div>
                      )}
                    </div>
                    <div>{option}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {feedback ? (
            <div className="flex flex-col items-center space-y-4">
              <div className={cn(
                "p-3 rounded-lg w-full text-center",
                feedback.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              )}>
                {feedback.message}
              </div>
              <Button
                variant="outline"
                onClick={handleNextQuestion}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {currentQuestionIndex === testQuestions.length - 1 ? 'View Results' : 'Next Question'}
              </Button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleSubmitAnswer}
                disabled={selectedAnswerIndex === null}
                className="bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300"
              >
                Check Answer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PodcastTest; 