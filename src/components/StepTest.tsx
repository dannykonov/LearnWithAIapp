import React, { useState, useEffect } from 'react';
import { TestQuestion } from '@/contexts/RoadmapContext';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { 
  fetchTestQuestionsFromBackend,
  generateTestQuestionsOnFrontend,
  saveTestQuestionsToBackend 
} from '@/services/roadmapService';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface StepTestProps {
  stepTitle: string;
  stepDescription: string;
  roadmapId: string;
  stepId: string;
}

// New type for storing selected answers
type SelectedAnswersMap = { [questionId: string]: number };

const StepTest: React.FC<StepTestProps> = ({ 
  stepTitle, 
  stepDescription,
  roadmapId,
  stepId
}) => {
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswersMap>({});
  const [feedback, setFeedback] = useState<{ [questionId: string]: { isCorrect: boolean; message: string } }>({});
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);

  // Effect to fetch existing questions on load
  useEffect(() => {
    const loadQuestions = async () => {
      if (!roadmapId || !stepId) {
        console.error("Missing roadmapId or stepId in StepTest");
        setIsLoadingExisting(false);
        return;
      }
      
      setIsLoadingExisting(true);
      try {
        const existingQuestions = await fetchTestQuestionsFromBackend(roadmapId, stepId);
        if (existingQuestions && existingQuestions.length > 0) {
          console.log("Found existing test questions:", existingQuestions);
          setTestQuestions(existingQuestions);
          // Reset other states if loading existing questions
          setSelectedAnswers({});
          setFeedback({});
          setIsTestComplete(false);
          setScore(0);
          setAllAnswered(false);
        } else {
          console.log("No existing questions found for this step.");
          setTestQuestions(null); // Ensure it's null if none found
        }
      } catch (error) {
        console.error('Error fetching existing test questions:', error);
        toast({
          title: 'Error',
          description: 'Could not load existing quiz questions.',
          variant: 'destructive',
        });
         setTestQuestions(null); // Set to null on error
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadQuestions();
  }, [roadmapId, stepId]); // Depend on roadmapId and stepId

  const handleGenerateTest = async () => {
    // Prevent generation if questions already exist or are loading/generating
    if (testQuestions || isLoadingExisting || isGenerating) return; 
    
    setIsGenerating(true);
    try {
      console.log("Generating questions via frontend...");
      // Call frontend generation function
      const newQuestions = await generateTestQuestionsOnFrontend(stepTitle, stepDescription, stepId);
      
      if (newQuestions && newQuestions.length > 0) {
         console.log("Frontend generation successful, attempting to save...");
         // Save the newly generated questions to the backend
         const saveSuccess = await saveTestQuestionsToBackend(roadmapId, stepId, newQuestions);
         
         if (saveSuccess) {
           console.log("Successfully saved generated questions.");
           setTestQuestions(newQuestions);
           // Reset other states
           setSelectedAnswers({});
           setFeedback({});
           setIsTestComplete(false);
           setScore(0);
           setAllAnswered(false);
           toast({
             title: 'Quiz Generated',
             description: 'Your quiz questions are ready!',
           });
         } else {
           console.error("Failed to save generated questions to backend.");
           throw new Error("Failed to save generated questions.");
         }
      } else {
        throw new Error("No questions were generated.");
      }
    } catch (error: any) {
      console.error('Error during test generation or saving:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate or save test questions. Please try again.',
        variant: 'destructive',
      });
       setTestQuestions(null); // Reset on error
    } finally {
      setIsGenerating(false);
    }
  };

  // Updated to handle answer selection for a specific question ID
  const handleAnswerSelect = (questionId: string, selectedIndex: number) => {
    // Allow changing answer only if the test is not complete
    if (isTestComplete) return; 
    
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: selectedIndex
    }));
  };

  // Check if all questions are answered whenever selectedAnswers changes
  useEffect(() => {
    if (testQuestions && Object.keys(selectedAnswers).length === testQuestions.length) {
      setAllAnswered(true);
    } else {
      setAllAnswered(false);
    }
  }, [selectedAnswers, testQuestions]);

  // Combined submit logic
  const handleSubmitAnswers = () => {
    if (!testQuestions || !allAnswered || isTestComplete) return;

    let currentScore = 0;
    const newFeedback: { [questionId: string]: { isCorrect: boolean; message: string } } = {};

    testQuestions.forEach(question => {
      const selectedIndex = selectedAnswers[question.id];
      const isCorrect = selectedIndex === question.correctAnswerIndex;
      
      if (isCorrect) {
        currentScore += 1;
      }
      
      newFeedback[question.id] = {
        isCorrect,
        message: isCorrect 
          ? 'Correct! Well done!' 
          : `Incorrect. The correct answer is: ${question.options[question.correctAnswerIndex]}`
      };
    });

    setScore(currentScore);
    setFeedback(newFeedback);
    setIsTestComplete(true); // Mark test as complete after submission
  };

  // Removed handleNextQuestion

  const handleRetakeTest = () => {
    if (!testQuestions) return;
    
    // Reset states
    setSelectedAnswers({});
    setFeedback({});
    setIsTestComplete(false);
    setScore(0);
    setAllAnswered(false);
  };

  return (
    <div>
      <h3 className="font-medium mt-1">Test your knowledge</h3>
      
      {isLoadingExisting ? (
        // Show loading state while checking for existing questions
        <div className="mt-3 flex items-center text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading Quiz...
        </div>
      ) : !testQuestions ? (
        // Show generate button only if no questions exist and not loading
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-3">
            Generate a quick quiz to test your understanding of this learning step.
          </p>
          <Button
            variant="outline"
            onClick={handleGenerateTest}
            disabled={isGenerating}
            className="bg-blue-600 text-white hover:bg-blue-700 border-blue-400 hover:text-white transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Quiz...
              </>
            ) : (
              <>Generate Quiz Questions</>
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-3 bg-blue-50 p-4 rounded-lg">
          {/* Loop through all questions */}
          {testQuestions.map((question, questionIndex) => {
            const questionId = question.id;
            const currentFeedback = feedback[questionId];
            const currentSelectedAnswer = selectedAnswers[questionId];

            return (
              <div key={questionId} className="mb-8 pb-4 border-b last:border-b-0 last:mb-0">
                <h4 className="text-lg font-semibold text-blue-700 mb-4">
                  Question {questionIndex + 1} of {testQuestions.length}
                </h4>
                
                <div className="mb-6">
                  <p className="font-medium mb-4">{question.question}</p>
                  
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        onClick={() => handleAnswerSelect(questionId, index)}
                        className={cn(
                          "p-3 rounded-lg border transition-all",
                          isTestComplete ? "cursor-not-allowed" : "cursor-pointer", // Disable click after completion
                          currentSelectedAnswer === index && !isTestComplete
                            ? "border-blue-500 bg-white" // Selected before submit
                            : "border-gray-200 bg-white",
                          !isTestComplete && currentSelectedAnswer !== index ? "hover:border-blue-300 hover:bg-blue-50/50" : "", // Hover only if not selected or test complete
                          currentFeedback && index === question.correctAnswerIndex
                            ? "border-green-500 bg-green-50" // Correct answer after submit
                            : "",
                          currentFeedback && 
                            currentSelectedAnswer === index && 
                            index !== question.correctAnswerIndex
                            ? "border-red-500 bg-red-50" // Incorrect selected answer after submit
                            : ""
                        )}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 flex-shrink-0">
                            {currentFeedback && index === question.correctAnswerIndex ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : currentFeedback && currentSelectedAnswer === index ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <div className={cn(
                                "h-5 w-5 rounded-full border flex items-center justify-center",
                                currentSelectedAnswer === index && !isTestComplete
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
                
                {/* Display feedback for this specific question if available */}
                {currentFeedback && (
                   <div className={cn(
                     "p-3 rounded-lg w-full text-center mt-4",
                     currentFeedback.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                   )}>
                     {currentFeedback.message}
                   </div>
                )}
              </div>
            );
          })}

          {/* Show Submit or Results/Retake button */}
          {isTestComplete ? (
            <div className="mt-6 text-center">
              <h4 className="text-xl font-semibold text-blue-700 mb-4">Test Complete!</h4>
              <div className="text-2xl font-bold mb-4 text-center">
                Score: {score}/{testQuestions.length}
              </div>
              <p className="text-gray-600 mb-6 text-center">
                {score === testQuestions.length
                  ? "Perfect score! You've mastered this content."
                  : "Great effort! Consider reviewing the material to reinforce your understanding."}
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
             <div className="mt-6 flex justify-center">
               <Button 
                  onClick={handleSubmitAnswers} 
                  disabled={!allAnswered}
                  className="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
               >
                 Submit Answers
               </Button>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepTest; 