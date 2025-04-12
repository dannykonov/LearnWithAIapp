import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Lightbulb,
  List
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { getRoadmapById, updateRoadmapProgress } from '@/services/roadmapService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { 
    roadmap, 
    setRoadmap, 
    userAnswers, 
    setUserAnswers, 
    progress, 
    setProgress, 
    generateMoreSteps, 
    isLoading, 
    setIsLoading 
  } = useRoadmap();
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevProgress, setPrevProgress] = useState(0);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  
  // Fetch roadmap by ID if provided in URL
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!id) return;
      
      try {
        setIsLoadingRoadmap(true);
        console.log("Fetching roadmap with ID:", id);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Roadmap fetch timed out after 10 seconds")), 10000)
        );
        
        const roadmapData = await Promise.race([
          getRoadmapById(id),
          timeoutPromise
        ]) as any;
        
        console.log("Raw roadmap data received:", JSON.stringify(roadmapData));
        
        if (roadmapData && roadmapData.steps && Array.isArray(roadmapData.steps)) {
          console.log("Roadmap data loaded successfully:", roadmapData);
          console.log("Steps count:", roadmapData.steps.length);
          console.log("Step structure sample:", JSON.stringify(roadmapData.steps[0]));
          
          const normalizedSteps = roadmapData.steps.map((step: any, index: number) => ({
            id: step.id || `step-${index}-${Date.now()}`,
            stepNumber: step.stepNumber || index + 1,
            title: step.title || `Step ${index + 1}`,
            description: step.description || '',
            resources: Array.isArray(step.resources) 
              ? step.resources.map((resource: any, rIndex: number) => ({
                  id: resource.id || `resource-${rIndex}-${Date.now()}`,
                  title: resource.title || 'Resource',
                  type: resource.type || 'article',
                  link: resource.link || '#',
                  timeEstimate: resource.timeEstimate || '30 min',
                  source: resource.source || 'Unknown',
                  description: resource.description || '',
                  completed: Boolean(resource.completed)
                }))
              : [],
            completed: Boolean(step.completed),
            timeEstimate: step.timeEstimate || '30 min'
          }));
          
          console.log("Normalized steps:", normalizedSteps.length);
          setRoadmap(normalizedSteps);
          setUserAnswers(roadmapData.userAnswers || { 
            topic: roadmapData.topic || 'Unknown Topic', 
            existingKnowledge: '', 
            background: '', 
            pace: '', 
            contentPreference: '', 
            availableTime: '', 
            goal: '' 
          });
          setProgress(roadmapData.progress || 0);
        } else {
          console.error("Roadmap data is incomplete:", roadmapData);
          console.error("roadmapData.steps exists:", Boolean(roadmapData?.steps));
          console.error("roadmapData.steps is array:", Array.isArray(roadmapData?.steps));
          toast({
            title: "Roadmap data incomplete",
            description: "The requested roadmap data is malformed or incomplete.",
            variant: "destructive",
          });
          navigate('/roadmaps');
        }
      } catch (error) {
        console.error("Error fetching roadmap:", error);
        toast({
          title: "Error loading roadmap",
          description: error instanceof Error ? error.message : "There was a problem loading this roadmap. Please try again.",
          variant: "destructive",
        });
        navigate('/roadmaps');
      } finally {
        setIsLoadingRoadmap(false);
      }
    };

    if (id) {
      fetchRoadmap();
    } else if (!roadmap.length && !isLoading) {
      // Redirect if no ID and no roadmap in context (and not generating one)
      navigate('/');
    }
  }, [id, setRoadmap, setUserAnswers, setProgress, navigate]);
  
  // Update progress in Firestore when it changes (if we have an ID)
  useEffect(() => {
    const updateProgress = async () => {
      if (!id || prevProgress === progress) return;
      
      try {
        await updateRoadmapProgress(id, progress);
      } catch (error) {
        console.error("Error updating roadmap progress:", error);
      }
    };
    
    updateProgress();
  }, [id, progress, prevProgress]);
  
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

  // Add this simple defensive timestamp handling
  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'Unknown date';
    try {
      return timestamp.toDate().toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };

  useEffect(() => {
    // Add a safeguard timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoadingRoadmap) {
        console.error("Roadmap loading timeout reached - forcing exit from loading state");
        setIsLoadingRoadmap(false);
        toast({
          title: "Loading timeout",
          description: "Unable to load roadmap. Please try refreshing the page.",
          variant: "destructive",
        });
        navigate('/roadmaps');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [isLoadingRoadmap, navigate]);

  if (isLoadingRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-lwai-deepBlue mb-4" />
          <h2 className="text-2xl font-bold text-lwai-deepBlue mb-2">Loading Roadmap</h2>
          <p className="text-gray-600">Please wait while we load your learning roadmap...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 pt-20">
      <CelebrationConfetti show={showConfetti} />
      
      <div className="container mx-auto">
        <main className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <div className="inline-block bg-lwai-deepBlue/10 px-4 py-2 rounded-full mb-4">
              <span className="font-medium text-lwai-deepBlue">Learning: {userAnswers.topic}</span>
            </div>
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
              {id ? (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/roadmaps')}
                  className="flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  All Roadmaps
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  New Roadmap
                </Button>
              )}
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
