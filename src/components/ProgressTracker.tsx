import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BarChart2, 
  CheckCircle, 
  Clock, 
  Award, 
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  GraduationCap,
  Flag
} from 'lucide-react';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { cn } from '@/lib/utils';

const ProgressTracker = () => {
  const { 
    progress, 
    totalSteps, 
    completedSteps, 
    completedResources, 
    totalResources,
    userAnswers
  } = useRoadmap();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Show animation when milestones are reached
  useEffect(() => {
    if (progress === 25 || progress === 50 || progress === 75 || progress === 100) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 3000);
    }
  }, [progress]);
  
  // Calculate milestones and set their positions on the progress track
  const milestones = [
    { value: 25, icon: <Flag className="h-3 w-3" />, label: "25%" },
    { value: 50, icon: <Star className="h-3 w-3" />, label: "50%" },
    { value: 75, icon: <Award className="h-3 w-3" />, label: "75%" },
    { value: 100, icon: <GraduationCap className="h-3 w-3" />, label: "100%" },
  ];
  
  // Get learning streak (placeholder for now)
  const learningStreak = completedSteps > 0 ? completedSteps : 0;
  
  return (
    <div className="glass-card p-5 mb-8 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart2 className="h-5 w-5 text-lwai-deepBlue mr-2" />
          <h2 className="text-lg font-bold text-lwai-deepBlue">Your Learning Journey</h2>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-lwai-skyBlue hover:text-lwai-deepBlue"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> 
              Hide Stats
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> 
              Show Stats
            </>
          )}
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Your Progress in {userAnswers.topic}</span>
          <span className={cn(
            "text-sm font-medium transition-all",
            progress === 100 ? "text-green-600 font-bold" : "text-lwai-deepBlue"
          )}>
            {progress}% Complete
          </span>
        </div>
        
        {/* Enhanced progress bar with milestone markers */}
        <div className="relative pt-1">
          <Progress value={progress} className="h-3 rounded-full bg-gray-200" />
          
          {/* Milestone markers on the progress bar */}
          {milestones.map((milestone) => (
            <div 
              key={milestone.value}
              className={cn(
                "absolute -top-1 w-5 h-5 rounded-full flex items-center justify-center transform -translate-x-1/2",
                progress >= milestone.value 
                  ? "bg-lwai-deepBlue text-white" 
                  : "bg-gray-300 text-gray-500"
              )}
              style={{ left: `${milestone.value}%` }}
              title={`${milestone.label} milestone`}
            >
              {milestone.icon}
            </div>
          ))}
          
          {/* Current position marker on the progress bar */}
          {progress > 0 && progress < 100 && (
            <div 
              className="absolute -top-2 w-6 h-6 bg-lwai-accent rounded-full flex items-center justify-center text-white transform -translate-x-1/2"
              style={{ left: `${progress}%` }}
            >
              <span className="text-[10px] font-bold">{progress}%</span>
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="animate-fade-in">
          <h3 className="text-md font-medium text-lwai-deepBlue mb-3 flex items-center">
            <span>Learning {userAnswers.topic}</span>
            {showAnimation && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs animate-pulse flex items-center">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                Milestone Reached!
              </span>
            )}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center p-3 bg-white/70 rounded-lg hover:shadow-md transition-all">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">Steps Completed</p>
                <p className="text-lg font-medium">{completedSteps} of {totalSteps}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-white/70 rounded-lg hover:shadow-md transition-all">
              <div className="w-10 h-10 flex items-center justify-center bg-green-100 rounded-full text-green-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">Resources Completed</p>
                <p className="text-lg font-medium">{completedResources} of {totalResources}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-white/70 rounded-lg hover:shadow-md transition-all">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-100 rounded-full text-purple-600">
                <Clock className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">Your Learning Pace</p>
                <p className="text-lg font-medium capitalize">{userAnswers.pace || "Standard"}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-white/70 rounded-lg hover:shadow-md transition-all">
              <div className="w-10 h-10 flex items-center justify-center bg-orange-100 rounded-full text-orange-600">
                <Award className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-xs text-gray-500">Learning Streak</p>
                <div className="flex items-center">
                  <p className="text-lg font-medium">{learningStreak} {learningStreak === 1 ? 'step' : 'steps'}</p>
                  <span className="ml-2 text-orange-500">🔥</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Learning stats and fun facts */}
          <div className="bg-gradient-to-r from-lwai-deepBlue/5 to-lwai-skyBlue/5 p-4 rounded-lg border border-lwai-skyBlue/20">
            <h4 className="font-medium text-lwai-deepBlue mb-2 flex items-center">
              <Star className="h-4 w-4 mr-2 text-lwai-accent" />
              Journey Stats
            </h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-lwai-skyBlue mr-2"></div>
                <span className="text-gray-600">Total learning time:</span>
                <span className="ml-1 font-medium">
                  {totalResources * 10} minutes
                </span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-lwai-skyBlue mr-2"></div>
                <span className="text-gray-600">Resources completed:</span>
                <span className="ml-1 font-medium">{Math.round((completedResources / Math.max(totalResources, 1)) * 100)}%</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-lwai-skyBlue mr-2"></div>
                <span className="text-gray-600">Progress rate:</span>
                <span className="ml-1 font-medium">
                  {completedSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}% of roadmap
                </span>
              </div>
              
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-lwai-skyBlue mr-2"></div>
                <span className="text-gray-600">Learning goal:</span>
                <span className="ml-1 font-medium truncate max-w-[100px]">
                  {userAnswers.goal ? userAnswers.goal.split(' ').slice(0, 3).join(' ') + '...' : "Mastery"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Motivational message based on progress */}
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-lwai-deepBlue" />
              {progress === 0 && "Ready to start your learning journey! The path is laid out for you."}
              {progress > 0 && progress < 25 && "Great start! You're taking the first steps on your learning journey."}
              {progress >= 25 && progress < 50 && "You've reached the 25% milestone! Keep up the good work."}
              {progress >= 50 && progress < 75 && "Halfway there! You've learned so much already."}
              {progress >= 75 && progress < 100 && "Almost there! Just a few more steps to complete your roadmap."}
              {progress === 100 && "Congratulations! You've mastered your learning roadmap. 🎉"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
