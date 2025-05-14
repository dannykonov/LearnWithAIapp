import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoadmapStep from '@/components/RoadmapStep';
import ProgressTracker from '@/components/ProgressTracker';
import CelebrationConfetti from '@/components/CelebrationConfetti';
import { Button } from '@/components/ui/button';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURES } from '@/config/features';
import { 
  Loader2, 
  Plus, 
  ArrowLeft, 
  Share2, 
  Download, 
  GraduationCap,
  Award,
  Lightbulb,
  List,
  FlaskConical
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getRoadmapById, updateRoadmapProgress, markRoadmapAsPaid } from '@/services/roadmapService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { verifyRoadmapPayment } from '@/services/paymentService';
import PaywallOverlay from '@/components/PaywallOverlay';

const RoadmapPage = () => {
  const navigate = useNavigate();
  const { id: roadmapId } = useParams();
  const { 
    roadmap, 
    setRoadmap, 
    userAnswers, 
    setUserAnswers, 
    progress, 
    setProgress, 
    generateMoreSteps, 
    isLoading, 
    setIsLoading,
    isTestMode,
    paymentStatus,
    setPaymentStatus
  } = useRoadmap();
  const { toast } = useToast();
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevProgress, setPrevProgress] = useState(0);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  
  // Fetch roadmap by ID if provided in URL
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (roadmapId) {
        setIsLoadingRoadmap(true);
        let fetchedRoadmapData: any = null;
        
        try {
          // Fetch the roadmap data first
          console.log(`[RoadmapPage Fetch Start] ID: ${roadmapId}`);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Roadmap fetch timed out after 10 seconds")), 10000)
          );
          
          fetchedRoadmapData = await Promise.race([
            getRoadmapById(roadmapId),
            timeoutPromise
          ]) as any;

          if (!fetchedRoadmapData) {
             throw new Error("Roadmap not found.");
          }
          if (!fetchedRoadmapData.steps || !Array.isArray(fetchedRoadmapData.steps)) {
            throw new Error("Roadmap data is incomplete or malformed.");
          }
          
          // Determine payment status logic:
          const firestorePaymentStatus = fetchedRoadmapData.paymentStatus || 'unpaid';
          const localPaidStatus = localStorage.getItem(`roadmap_payment_${roadmapId}`) === 'paid';
          
          console.log(`[RoadmapPage Fetch Data] ID: ${roadmapId}, Firestore: ${firestorePaymentStatus}, LocalPaid: ${localPaidStatus}`);
          
          let finalPaymentStatus: 'paid' | 'unpaid' = 'unpaid'; // Default to unpaid

          if (firestorePaymentStatus === 'paid' || localPaidStatus) {
            // If Firestore or localStorage says paid, it's paid.
            console.log("[RoadmapPage Fetch] Determined Status: PAID (Firestore or LocalStorage)");
            finalPaymentStatus = 'paid';
            // Ensure consistency if local storage was paid but firestore wasn't
            if (localPaidStatus && firestorePaymentStatus !== 'paid') {
                await markRoadmapAsPaid(roadmapId, false); 
            }
          } else {
             // If neither source says paid, it's unpaid.
             console.log("[RoadmapPage Fetch] Determined Status: UNPAID (Neither source is paid)");
             finalPaymentStatus = 'unpaid';
             // Ensure firestore is marked unpaid if needed (should have been done on creation)
             if (firestorePaymentStatus !== 'unpaid') {
                 console.warn("[RoadmapPage Fetch] Firestore status was not unpaid, correcting...");
                 await markRoadmapAsPaid(roadmapId, true); // true ensures unpaid
             }
          }
          
          // Set the final determined payment status
          console.log(`[RoadmapPage Fetch] Setting context paymentStatus to: ${finalPaymentStatus}`);
          setPaymentStatus(finalPaymentStatus);

          // --- Load Roadmap Data into Context --- 
          // Normalize steps and set basic roadmap/user data (only if needed)
          if (roadmap !== fetchedRoadmapData.steps) { 
             const normalizedSteps = fetchedRoadmapData.steps.map((step: any, index: number) => ({
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
                     completed: Boolean(resource.completed),
                     isFallback: Boolean(resource.isFallback)
                   }))
                 : [],
               completed: Boolean(step.completed),
               timeEstimate: step.timeEstimate || '30 min',
               connectionText: step.connectionText || ''
             }));
             console.log("[RoadmapPage Fetch] Updating roadmap steps in context");
             setRoadmap(normalizedSteps);
          }
         
          if (JSON.stringify(userAnswers) !== JSON.stringify(fetchedRoadmapData.userAnswers)) {
            console.log("[RoadmapPage Fetch] Updating userAnswers in context");
            setUserAnswers(fetchedRoadmapData.userAnswers || { 
              topic: fetchedRoadmapData.topic || 'Unknown Topic', 
              existingKnowledge: '', 
              background: '', 
              pace: '', 
              contentPreference: '', 
              availableTime: '', 
              goal: '' 
            });
          }
          
          if (progress !== fetchedRoadmapData.progress) {
             console.log("[RoadmapPage Fetch] Updating progress in context");
             setProgress(fetchedRoadmapData.progress || 0);
          }
          // --- End Load Roadmap Data --- 

        } catch (error: any) {
          // Handle errors during the initial roadmap fetch or normalization
          console.error("Error fetching or processing roadmap data:", error);
          toast({
            title: "Error Loading Roadmap",
            description: error.message || "Could not load the requested roadmap.",
            variant: "destructive",
          });
          navigate('/roadmaps');
        }
      } else {
        console.error("Roadmap ID is missing!");
        navigate('/roadmaps');
      }
      setIsLoadingRoadmap(false);
    };

    fetchRoadmap();
  }, [roadmapId, navigate, setRoadmap, setUserAnswers, setProgress, setPaymentStatus, toast]);
  
  // Update progress in Firestore when it changes (if we have an ID)
  useEffect(() => {
    const updateProgress = async () => {
      if (!roadmapId || prevProgress === progress) return;
      
      try {
        await updateRoadmapProgress(roadmapId, progress);
        
        // If we're updating progress, this is the user's roadmap
        // Mark as paid to ensure no paywall is shown
        if (roadmapId) {
          localStorage.setItem(`roadmap_payment_${roadmapId}`, 'paid');
          setPaymentStatus('paid');
        }
      } catch (error) {
        console.error("Error updating roadmap progress:", error);
      }
    };
    
    updateProgress();
  }, [roadmapId, progress, prevProgress, setPaymentStatus]);
  
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

  // ADDED: Reset loading state when in test mode
  useEffect(() => {
    if (isTestMode && isLoading) {
      console.log('Test mode detected with active loading state - forcing reset');
      setIsLoading(false);
    }
  }, [isTestMode, isLoading, setIsLoading]);

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
  
  // Conditionally show paywall overlay if not paid
  console.log("[RoadmapPage] Current payment status before rendering:", paymentStatus);
  
  // The paymentStatus from the context should now be the source of truth
  const shouldShowPaywall = FEATURES.REQUIRE_PAYMENT && paymentStatus === 'unpaid';
  
  console.log("[RoadmapPage] Should show paywall based on context status:", shouldShowPaywall);

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoadingRoadmap ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-lwai-deepBlue mb-4" />
          <h2 className="text-xl font-semibold text-lwai-deepBlue">Loading your roadmap...</h2>
        </div>
      ) : (
        <>
          {/* Show confetti when progress reaches milestones */}
          {showConfetti && <CelebrationConfetti show={showConfetti} />}
          
          {/* Conditionally show paywall overlay if not paid */}
          {shouldShowPaywall && roadmapId && (
            <PaywallOverlay 
              roadmapId={roadmapId} 
              topic={userAnswers.topic} 
            />
          )}
          
          <div className={`${shouldShowPaywall ? 'roadmap-blurred' : ''}`}>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4 pt-20">
              <div className="container mx-auto">
                <main className="max-w-4xl mx-auto">
                  <div className="mb-8 text-center">
                    <div className="inline-block bg-lwai-deepBlue/10 px-4 py-2 rounded-full mb-4">
                      <span className="font-medium text-lwai-deepBlue">Learning: {userAnswers.topic}</span>
                      
                      {/* Test mode indicator */}
                      {isTestMode && (
                        <span className="ml-2 inline-flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                          <FlaskConical className="h-3 w-3 mr-1" /> Test Mode
                        </span>
                      )}
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
                      {roadmapId ? (
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
                    
                    {/* Test mode warning if active */}
                    {isTestMode && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        <p className="flex items-center">
                          <FlaskConical className="h-4 w-4 mr-2" />
                          <strong>Test Mode Active:</strong> 
                          <span className="ml-1">
                            This is a placeholder roadmap for testing. AI generation features are disabled.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Roadmap visual journey with better alignment and spacing */}
                  <div className="relative max-w-3xl mx-auto">
                    <div className="absolute top-0 bottom-0 left-[29px] w-1 bg-lwai-lightBlue/40 rounded-full -z-10"></div>
                    
                    {roadmap.map((step, index) => (
                      <React.Fragment key={step.id}>
                        <RoadmapStep 
                          step={step} 
                          totalSteps={roadmap.length}
                          roadmapId={roadmapId || ''}
                        />
                        {index > 0 && step.connectionText && (
                          <div className="mb-4 text-sm text-gray-600 italic bg-gray-50 p-3 rounded-md border-l-4 border-blue-400">
                            {step.connectionText}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    
                    <div className="flex justify-center mt-8 mb-12">
                      <Button
                        onClick={generateMoreSteps}
                        disabled={isLoading || isTestMode}
                        className="bg-lwai-deepBlue hover:bg-lwai-deepBlue/90 text-white flex items-center shadow-lg hover:shadow-xl transition-all"
                        title={isTestMode ? "Cannot generate more steps in Test Mode" : "Generate next learning step"}
                      >
                        {isLoading && !isTestMode ? (
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
          </div>
        </>
      )}
    </div>
  );
};

export default RoadmapPage;
