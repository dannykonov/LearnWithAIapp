import React, { useState, useEffect } from 'react';
import { RoadmapStep as RoadmapStepType, useRoadmap } from '../contexts/RoadmapContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Clock, Star, Flag, Award, Headphones, Loader2 } from 'lucide-react';
import ResourceCard from './ResourceCard';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { generatePodcastText, convertTextToSpeech, storeAudioInFirebase } from '@/services/podcastService';
import { useAuth } from '@/contexts/AuthContext';

interface RoadmapStepProps {
  step: RoadmapStepType;
  totalSteps: number;
}

const RoadmapStep: React.FC<RoadmapStepProps> = ({ step, totalSteps }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [podcastGenerated, setPodcastGenerated] = useState(false);
  const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const { toggleStepCompleted, toggleResourceCompleted } = useRoadmap();
  const { currentUser } = useAuth();
  
  // Determine if this is a milestone step (every third step)
  const isMilestone = step.stepNumber % 3 === 0;
  
  // Check local storage on component mount to see if podcast was already generated
  useEffect(() => {
    const storedPodcastState = localStorage.getItem(`podcast-${step.id}`);
    const storedPodcastUrl = localStorage.getItem(`podcast-url-${step.id}`);
    if (storedPodcastState === 'generated' && storedPodcastUrl) {
      setPodcastGenerated(true);
      setPodcastUrl(storedPodcastUrl);
    }
  }, [step.id]);
  
  const handleToggleStep = () => {
    const wasCompleted = step.completed;
    toggleStepCompleted(step.id);
    
    // Show level up animation when completing a step
    if (!wasCompleted) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
      
      // Show celebration toast for milestones
      if (isMilestone) {
        toast({
          title: "🌟 Milestone Achieved!",
          description: `You've reached a major milestone in your learning journey!`,
          variant: "default",
        });
      } else {
        toast({
          title: "✅ Step Completed!",
          description: "Great job! Keep up the good work.",
          variant: "default",
        });
      }
    }
  };
  
  const handleToggleResource = (resourceId: string) => {
    toggleResourceCompleted(step.id, resourceId);
  };

  const handleGeneratePodcast = async () => {
    // Check if currentUser exists and has a uid
    if (!currentUser?.uid) { 
      toast({
        title: "Authentication Error",
        description: "You must be logged in to generate a podcast.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingPodcast(true); // Set loading true
    try {
      const text = await generatePodcastText(step.description);
      const audioBlob = await convertTextToSpeech(text);
      const userId = currentUser.uid; // Use actual user ID from currentUser
      const url = await storeAudioInFirebase(audioBlob, step.id, userId);
      setPodcastGenerated(true);
      setPodcastUrl(url);
      localStorage.setItem(`podcast-${step.id}`, 'generated');
      localStorage.setItem(`podcast-url-${step.id}`, url);
      toast({
        title: "Podcast Generated",
        description: "Your podcast for this step has been generated!",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error generating podcast:', error);
      toast({
        title: "Error Generating Podcast",
        description: error.message || "Failed to generate podcast. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPodcast(false); // Set loading false
    }
  };
  
  // Calculate completion percentage for this step
  const totalResources = step.resources.length;
  const completedResources = step.resources.filter(r => r.completed).length;
  const stepProgress = totalResources > 0 ? Math.round((completedResources / totalResources) * 100) : 0;
  
  return (
    <div className={cn(
      "roadmap-card mb-14 transition-all relative max-w-3xl mx-auto",
      step.completed && "completed",
      isExpanded && "z-10"
    )}>
      {/* Road connection line - improved visibility */}
      {step.stepNumber < totalSteps && (
        <div className="roadmap-connection" style={{ opacity: 0.9 }}></div>
      )}
      
      {/* Milestone marker with better positioning */}
      {isMilestone && (
        <div className="road-milestone" style={{ top: "-20px" }}>
          <Star className="h-4 w-4" />
        </div>
      )}
      
      {/* Road sign number - improved positioning and sizing */}
      <div className="road-sign shadow-lg">
        {step.stepNumber}
      </div>
      
      {/* Level up animation */}
      {showLevelUp && (
        <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-lwai-deepBlue text-white px-4 py-2 rounded-lg shadow-lg z-30 animate-float">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-yellow-300" />
            <span className="font-bold">Level Up!</span>
          </div>
        </div>
      )}
      
      {/* Step header with improved layout */}
      <div className="flex items-start">
        <div className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full text-white font-bold text-xl shrink-0 shadow-md transition-all duration-500",
          step.completed 
            ? "bg-gradient-to-br from-green-500 to-green-600" 
            : "bg-gradient-to-br from-lwai-deepBlue to-lwai-skyBlue"
        )}>
          {step.stepNumber}
        </div>
        
        <div className="ml-5 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-lwai-deepBlue mb-1 sm:mb-0">{step.title}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center">
                <Clock size={14} className="mr-1" />
                {step.timeEstimate}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>
                Step {step.stepNumber} of {totalSteps}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 mt-2">{step.description}</p>
          
          {/* Progress indicator for resources in this step - improved styling */}
          <div className="mt-3 mb-3">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>Resource progress</span>
              <span>{completedResources}/{totalResources} completed</span>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-lwai-skyBlue to-lwai-lightBlue road-progress-animation" 
                style={{ width: `${stepProgress}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 mt-4">
            <div className="flex items-center">
              <Checkbox 
                id={`step-${step.id}`}
                checked={step.completed}
                onCheckedChange={handleToggleStep}
                className={cn(
                  "transition-all duration-300 h-5 w-5", 
                  step.completed && "bg-green-500 text-white"
                )}
              />
              <label 
                htmlFor={`step-${step.id}`}
                className="ml-2 text-sm font-medium cursor-pointer"
              >
                {step.completed ? "Completed! 🎉" : "Mark as completed"}
              </label>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-lwai-skyBlue hover:text-lwai-deepBlue transition-all"
            >
              {isExpanded ? (
                <>Hide Resources <ChevronUp className="ml-1 h-4 w-4" /></>
              ) : (
                <>View Resources <ChevronDown className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Resources - improved alignment and spacing */}
      {isExpanded && (
        <div className="ml-14 mt-5 relative">
          {/* Add decorative path element with improved visibility */}
          <div className="roadmap-path" style={{ opacity: 0.8 }}></div>
          
          <h4 className="font-medium text-lwai-deepBlue mb-3 pl-1">Learning Resources:</h4>
          <div className="space-y-4">
            {step.resources.map((resource, index) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onToggleCompleted={() => handleToggleResource(resource.id)}
                isLast={index === step.resources.length - 1}
              />
            ))}
          </div>
          
          {/* Only show Generate Podcast button if podcast hasn't been generated yet */}
          {!podcastGenerated && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePodcast}
                disabled={isGeneratingPodcast}
                className="text-yellow-600 hover:text-yellow-700 border-yellow-400 hover:bg-yellow-50 transition-all"
              >
                {isGeneratingPodcast ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Headphones className="mr-1 h-4 w-4" /> Generate Podcast
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Podcast Player - Styling updated for consistency */}
          {podcastGenerated && podcastUrl && (
            <div className="mt-6">
              {/* Use similar card styling as resources */}
              <div className="p-4 border rounded-lg bg-white shadow-sm transition-all hover:shadow-md">
                <h4 className="font-medium text-lwai-deepBlue mb-3 flex items-center">
                  <Headphones className="mr-2 h-5 w-5 text-lwai-skyBlue" /> {/* Adjusted icon color */}
                  Podcast: {step.title}
                </h4>
                <div className="w-full rounded-lg">
                  {/* Standard HTML5 audio player - styling is browser-dependent but container is styled */}
                  <audio
                    className="w-full h-10" // Adjusted height slightly
                    controls
                    src={podcastUrl}
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-xs text-gray-500 mt-2 pl-1">
                    This podcast was generated based on the learning step content.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Visual indicators of progress along the roadmap */}
      {step.completed && (
        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md">
            <Flag className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapStep;
