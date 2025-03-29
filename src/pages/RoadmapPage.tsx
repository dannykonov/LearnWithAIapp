
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';
import RoadmapStep from '@/components/RoadmapStep';
import ProgressTracker from '@/components/ProgressTracker';
import CelebrationConfetti from '@/components/CelebrationConfetti';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { 
  Loader2, 
  Plus, 
  ArrowLeft, 
  Share2, 
  Download, 
  GraduationCap,
  Award,
  Lightbulb
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { roadmap, userAnswers, progress, generateMoreSteps, isLoading } = useRoadmap();
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevProgress, setPrevProgress] = useState(0);
  
  // Check if we have roadmap data, if not redirect to home
  useEffect(() => {
    if (!roadmap.length && !isLoading) {
      navigate('/');
    }
  }, [roadmap, navigate, isLoading]);
  
  // Show confetti when progress reaches 100% or crosses major milestones
  useEffect(() => {
    const milestones = [25, 50, 75, 100];
    
    // Check if we crossed a milestone
    milestones.forEach(milestone => {
      if (prevProgress < milestone && progress >= milestone) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
        if (milestone === 100) {
          toast({
            title: "🎉 Congratulations!",
            description: `You've completed your ${userAnswers.topic} learning roadmap!`,
            variant: "default",
          });
        } else {
          toast({
            title: `🌟 ${milestone}% Complete!`,
            description: `You've reached a major milestone in your learning journey!`,
            variant: "default",
          });
        }
      }
    });
    
    setPrevProgress(progress);
  }, [progress, prevProgress, userAnswers.topic]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <CelebrationConfetti show={showConfetti} />
      
      <div className="container mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <Logo />
            <div className="ml-4 bg-lwai-deepBlue/10 px-3 py-1 rounded-full flex items-center">
              <span className="text-sm font-medium text-lwai-deepBlue">Learning: {userAnswers.topic}</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Roadmap
          </Button>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-lwai-deepBlue bg-clip-text text-transparent bg-gradient-to-r from-lwai-deepBlue to-lwai-skyBlue">
              Your Learning Roadmap
            </h1>
            <p className="text-gray-600 mt-2">
              Follow this personalized path to master {userAnswers.topic}.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share Roadmap
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
          
          <ProgressTracker />
          
          {/* Learning strategy based on user preferences */}
          <div className="glass-card p-5 mb-8 max-w-3xl mx-auto">
            <div className="flex items-center mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-bold text-lwai-deepBlue">Your Learning Strategy</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  <span className="font-medium text-lwai-deepBlue">Pace:</span> {userAnswers.pace || "Standard"}
                </p>
              </div>
              
              <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  <span className="font-medium text-lwai-deepBlue">Content Preference:</span> {userAnswers.contentPreference || "Mixed"}
                </p>
              </div>
              
              <div className="bg-white/70 p-3 rounded-lg border border-gray-200">
                <p className="text-gray-600">
                  <span className="font-medium text-lwai-deepBlue">Time Available:</span> {userAnswers.availableTime || "Flexible"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Roadmap visual journey with better alignment and spacing */}
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute top-0 bottom-0 left-[29px] w-1 bg-lwai-lightBlue/40 rounded-full -z-10"></div>
            
            {roadmap.map((step) => (
              <RoadmapStep 
                key={step.id} 
                step={step} 
                totalSteps={roadmap.length}
              />
            ))}
            
            <div className="flex justify-center mt-8 mb-12">
              <Button
                onClick={generateMoreSteps}
                disabled={isLoading}
                className="bg-lwai-deepBlue hover:bg-lwai-deepBlue/90 text-white flex items-center shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating more content...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate More Learning Steps
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Section for completed roadmap celebration */}
          {progress === 100 && (
            <div className="mt-12 p-8 bg-gradient-to-r from-lwai-deepBlue/10 to-lwai-skyBlue/20 rounded-xl border border-lwai-skyBlue/30 text-center max-w-3xl mx-auto">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-lwai-deepBlue to-lwai-skyBlue flex items-center justify-center mb-4 shadow-lg">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-lwai-deepBlue mb-2">
                Congratulations on Mastering {userAnswers.topic}!
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You've completed all the steps in your personalized learning roadmap. Ready for a new challenge?
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  onClick={() => navigate('/')}
                  className="bg-lwai-deepBlue hover:bg-lwai-deepBlue/90 text-white"
                >
                  Start a New Learning Journey
                </Button>
                
                <Button
                  onClick={generateMoreSteps}
                  variant="outline"
                  className="border-lwai-skyBlue text-lwai-deepBlue hover:bg-lwai-skyBlue/10"
                >
                  <Award className="mr-2 h-4 w-4" />
                  Advanced Topics
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RoadmapPage;
