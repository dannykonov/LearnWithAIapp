import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Brain, Lightbulb, GraduationCap, ArrowDown, Check, X, Target, BookOpen, Rocket, ChevronDown, ChevronUp, Map, Search, Shapes, CheckSquare, Clock, Repeat, Briefcase, Star, ArrowUp, Users, Library, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useAuth } from '@/contexts/AuthContext';

// --- Avatar SVG Components ---
const AvatarSarah = () => (
  <svg viewBox="0 0 100 100" className="h-14 w-14 text-blue-500">
    <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.2"></circle>
    <ellipse cx="50" cy="42" rx="24" ry="26" fill="currentColor"></ellipse>
    <path d="M26,42 C26,25 38,16 50,16 C62,16 74,25 74,42 L74,50 C74,40 72,40 72,40 L28,40 C28,40 26,40 26,50 L26,42" fill="currentColor" opacity="0.8"></path>
    <path d="M42,65 L58,65 L58,72 L42,72 Z" fill="currentColor" opacity="0.9"></path>
    <path d="M35,72 C35,72 42,75 50,75 C58,75 65,72 65,72 L65,85 L35,85 Z" fill="currentColor" opacity="0.7"></path>
    <ellipse cx="40" cy="38" rx="3.5" ry="3" fill="white"></ellipse>
    <ellipse cx="60" cy="38" rx="3.5" ry="3" fill="white"></ellipse>
    <circle cx="40" cy="38" r="1.5" fill="#333"></circle>
    <circle cx="60" cy="38" r="1.5" fill="#333"></circle>
    <path d="M36.5,35 Q40,33 43.5,35" stroke="currentColor" fill="none" strokeWidth="0.8" opacity="0.7"></path>
    <path d="M56.5,35 Q60,33 63.5,35" stroke="currentColor" fill="none" strokeWidth="0.8" opacity="0.7"></path>
    <path d="M40,48 C40,48 45,54 50,54 C55,54 60,48 60,48" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"></path>
  </svg>
);

const AvatarMichael = () => (
  <svg viewBox="0 0 100 100" className="h-14 w-14 text-blue-500">
    <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.2"></circle>
    <ellipse cx="50" cy="45" rx="26" ry="28" fill="currentColor"></ellipse>
    <path d="M26,30 C26,22 36,17 50,17 C64,17 74,22 74,30 L74,40 L26,40 L26,30" fill="currentColor" opacity="0.85"></path>
    <path d="M42,70 L58,70 L58,77 L42,77 Z" fill="currentColor" opacity="0.9"></path>
    <path d="M32,77 C32,77 40,81 50,81 C60,81 68,77 68,77 L68,90 L32,90 Z" fill="currentColor" opacity="0.7"></path>
    <ellipse cx="40" cy="42" rx="3.5" ry="3" fill="white"></ellipse>
    <ellipse cx="60" cy="42" rx="3.5" ry="3" fill="white"></ellipse>
    <circle cx="40" cy="42" r="1.5" fill="#333"></circle>
    <circle cx="60" cy="42" r="1.5" fill="#333"></circle>
    <path d="M36.5,39 Q40,37 43.5,39" stroke="currentColor" fill="none" strokeWidth="0.8" opacity="0.7"></path>
    <path d="M56.5,39 Q60,37 63.5,39" stroke="currentColor" fill="none" strokeWidth="0.8" opacity="0.7"></path>
    <path d="M40,52 C40,52 45,57 50,57 C55,57 60,52 60,52" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"></path>
    <path d="M36,39 Q40,37 44,39 Q40,41 36,39" fill="white" opacity="0.9"></path>
    <path d="M56,39 Q60,37 64,39 Q60,41 56,39" fill="white" opacity="0.9"></path>
    <path d="M44,39 L56,39" stroke="white" strokeWidth="1"></path>
  </svg>
);

const AvatarPriya = () => (
  <svg viewBox="0 0 100 100" className="h-14 w-14 text-blue-500">
    <circle cx="50" cy="50" r="40" fill="currentColor" opacity="0.2"></circle>
    <ellipse cx="50" cy="42" rx="24" ry="26" fill="currentColor"></ellipse>
    <path d="M20,42 C20,25 35,16 50,16 C65,16 80,25 80,42 C80,52 78,55 76,60 L24,60 C22,55 20,52 20,42" fill="currentColor" opacity="0.8"></path>
    <path d="M42,65 L58,65 L58,72 L42,72 Z" fill="currentColor" opacity="0.9"></path>
    <path d="M35,72 C35,72 42,76 50,76 C58,76 65,72 65,72 L65,85 L35,85 Z" fill="currentColor" opacity="0.7"></path>
    <ellipse cx="40" cy="38" rx="3.5" ry="3" fill="white"></ellipse>
    <ellipse cx="60" cy="38" rx="3.5" ry="3" fill="white"></ellipse>
    <circle cx="40" cy="38" r="1.5" fill="#333"></circle>
    <circle cx="60" cy="38" r="1.5" fill="#333"></circle>
    <path d="M36.5,35 Q40,33 43.5,35" stroke="currentColor" fill="none" strokeWidth="0.8" opacity="0.7"></path>
    <path d="M56.5,35 Q60,33 63.5,35" stroke="currentColor" fill="none" strokeWidth="0.8" opacity="0.7"></path>
    <path d="M40,48 C40,48 45,54 50,54 C55,54 60,48 60,48" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"></path>
    <circle cx="22" cy="42" r="1.5" fill="white"></circle>
    <circle cx="78" cy="42" r="1.5" fill="white"></circle>
  </svg>
);
// --- End Avatar SVG Components ---

const HomePage = () => {
  const [topic, setTopic] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  
  // --- State for Typing Effect ---
  const placeholderTexts = [
    "What do you want to learn?"
  ];
  const [subIndex, setSubIndex] = useState(0);
  const [currentPlaceholder, setCurrentPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseDuration = 1500; // Pause after typing/deleting
  // --- End State for Typing Effect ---

  const navigate = useNavigate();
  const { setUserAnswers, setRoadmap, setPaymentStatus } = useRoadmap();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset roadmap state when coming to homepage
    setRoadmap([]);
    // Reset payment status to unpaid
    setPaymentStatus('unpaid');
  }, [setRoadmap, setPaymentStatus]);

  // --- useEffect for Continuous Typing Animation ---
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const currentText = placeholderTexts[0]; // Always use the first (only) text

    // Typing logic
    if (!isDeleting && subIndex < currentText.length) {
      timeoutId = setTimeout(() => {
        setCurrentPlaceholder(prev => prev + currentText[subIndex]);
        setSubIndex(prev => prev + 1);
      }, typingSpeed);
    }
    // Pause at end of word before deleting
    else if (!isDeleting && subIndex === currentText.length) {
      timeoutId = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    }
    // Deleting logic
    else if (isDeleting && subIndex > 0) {
      timeoutId = setTimeout(() => {
        setCurrentPlaceholder(prev => prev.slice(0, -1));
        setSubIndex(prev => prev - 1);
      }, deletingSpeed);
    }
    // Pause after deleting, then restart typing
    else if (isDeleting && subIndex === 0) {
       timeoutId = setTimeout(() => {
         setIsDeleting(false); 
         // No need to change placeholderIndex as there's only one phrase
       }, pauseDuration / 2); // Shorter pause after deleting
    }

    return () => clearTimeout(timeoutId);
  }, [subIndex, isDeleting]); // Dependencies are subIndex and isDeleting
  // --- End useEffect for Typing Animation ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    
    if (!trimmedTopic) {
      return;
    }
    
    // Reset any existing roadmap data
    setRoadmap([]);
    
    // Explicitly set payment status to unpaid for new roadmap
    setPaymentStatus('unpaid');
    
    if (currentUser) {
      // Set initial user answers with the topic
      setUserAnswers({
        topic: trimmedTopic,
        existingKnowledge: '',
        background: '',
        pace: '',
        contentPreference: '',
        availableTime: '',
        goal: ''
      });
      
      // Navigate to questions page
      navigate('/questions');
    } else {
      // Store topic for after login
      sessionStorage.setItem('topicBeforeLogin', trimmedTopic);
      navigate('/login');
    }
  };

  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };

  const steps = [
    { 
      icon: <Target className="h-8 w-8 text-lwai-deepBlue" />, 
      title: "Choose Your Learning Goal", 
      details: "Select the skill or subject you want to master. No more wondering what to learn." 
    },
    { 
      icon: <Brain className="h-8 w-8 text-lwai-deepBlue" />, 
      title: "AI Assesses Your Knowledge", 
      details: "Take a quick test or tell us about your background to identify your current level and knowledge gaps." 
    },
    { 
      icon: <GraduationCap className="h-8 w-8 text-lwai-deepBlue" />, 
      title: "Get Your Learning Roadmap", 
      details: "Receive a personalized, step-by-step plan outlining exactly what to learn and in what order." 
    },
    { 
      icon: <BookOpen className="h-8 w-8 text-lwai-deepBlue" />, 
      title: "Access Curated Resources", 
      details: "Get links to articles, videos, and interactive exercises matched to each step of your roadmap." 
    },
    { 
      icon: <Lightbulb className="h-8 w-8 text-lwai-deepBlue" />, 
      title: "Practice & Apply Skills", 
      details: "Solidify your understanding with quizzes, coding challenges, or project ideas relevant to your goal." 
    },
    { 
      icon: <Rocket className="h-8 w-8 text-lwai-deepBlue" />, 
      title: "Track Progress & Adapt", 
      details: "Mark steps as complete, see your progress, and adjust your roadmap as you learn and grow." 
    },
  ];

  const testimonials = [
    {
      name: "Sarah J.",
      title: "Data Scientist",
      quote: "I was jumping between tutorials without making real progress. Learn With AI's structured approach showed me exactly how to build on concepts step-by-step. Now I understand the 'why' behind everything I learn.",
      rating: 5,
      avatar: <AvatarSarah />
    },
    {
      name: "Michael T.",
      title: "Software Engineer",
      quote: "The structured learning path was a game-changer. Instead of wasting time figuring out what to learn next, I followed Learn With AI's roadmap and mastered Python in half the time I expected.",
      rating: 5,
      avatar: <AvatarMichael />
    },
    {
      name: "Priya K.",
      title: "Marketing Director",
      quote: "As a busy professional, I needed an efficient way to learn new skills. Learn With AI's structured approach eliminated wasted time and kept me focused on exactly what I needed to learn next.",
      rating: 5,
      avatar: <AvatarPriya />
    }
  ];

  const renderStars = (rating: number) => {
    return Array(rating).fill(0).map((_, i) => (
      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
    ));
  };

  const miniQuotes = [
    {
      text: "Learn With AI's structured approach changed everything—I've learned more in 3 weeks than in 6 months of self-study.",
      author: "Alex K., Software Developer"
    },
    {
      text: "The personalized roadmap eliminated all guesswork. I'm actually making progress instead of feeling overwhelmed by options.",
      author: "Maria L., UX Designer"
    },
    {
      text: "After trying countless courses, this actually worked for me. The step-by-step approach makes complex topics approachable.",
      author: "James R., Data Analyst"
    },
    {
      text: "I was stuck in tutorial hell before this. Now I have clear direction and can see myself improving each week.",
      author: "Sophia T., Web Developer"
    }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section Area - Light Theme */}
      <div className="bg-gradient-to-b from-blue-50 to-blue-100 py-24 overflow-x-hidden"> 
        <div className="container px-4 mx-auto">
          <main className="max-w-5xl mx-auto text-center">
            {/* === Hero Content (H1, P, Input) === */}
            <h1 className="text-4xl md:text-5xl font-bold text-lwai-deepBlue mb-6">
              Learn anything with the help of AI
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Get a personalized learning roadmap with curated resources tailored to your goals and preferences.
            </p>
            <div className="mb-16">
              <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                <div className={`relative transition-all duration-300 ${isInputFocused ? 'transform scale-105' : ''}`}>
                  <Input
                    type="text"
                    placeholder={currentPlaceholder + (isInputFocused ? '' : '|')}
                    className="bg-white h-16 text-lg px-6 rounded-xl shadow-md border border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-800 placeholder-gray-500"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                  <Button 
                    type="submit" 
                    disabled={!topic.trim()}
                    className="absolute right-2 top-2 bg-lwai-deepBlue hover:bg-lwai-deepBlue/90 text-white h-12 px-6 rounded-lg"
                  >
                    <span className="mr-2 hidden md:inline">Get Started</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </div>

            {/* === Key Benefits (3 cards) === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lwai-deepBlue mx-auto mb-4">
                  <Brain className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">Personalized Learning</h3>
                <p className="text-gray-600">
                  Customized roadmaps based on your background, pace, and learning style.
                </p>
              </div>
              {/* Card 2 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lwai-deepBlue mx-auto mb-4">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">Learn In-App</h3>
                <p className="text-gray-600">
                  Watch videos, read articles, and try interactive tools without leaving the platform.
                </p>
              </div>
              {/* Card 3 */}
              <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lwai-deepBlue mx-auto mb-4">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">Track Progress</h3>
                <p className="text-gray-600">
                  Monitor your learning journey with progress tracking and celebration milestones.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* === How It Works Section === */}
      <section className="bg-white py-16">
        <div className="container px-4 mx-auto">
          {/* Using main tag semantically for primary content block within section */}
          <main className="max-w-5xl mx-auto text-center">
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-4xl mx-auto border border-gray-100"> {/* Keep card white, add border */} 
               <h2 className="text-2xl font-bold text-lwai-deepBlue mb-4">How It Works</h2>
               <ol className="flex flex-col md:flex-row justify-around text-left md:text-center max-w-4xl mx-auto">
                 {/* Step 1 */}
                 <li className="mb-4 md:mb-0 flex md:block items-start">
                   <div className="w-8 h-8 bg-lwai-deepBlue rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 mr-3 md:mx-auto md:mb-3">1</div>
                   <div>
                     <h3 className="font-bold text-lwai-deepBlue mb-1">Tell us what you want to learn</h3>
                     <p className="text-gray-600 text-sm">Enter any topic or skill you're interested in</p>
                   </div>
                 </li>
                 {/* Step 2 */}
                 <li className="mb-4 md:mb-0 flex md:block items-start">
                   <div className="w-8 h-8 bg-lwai-deepBlue rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 mr-3 md:mx-auto md:mb-3">2</div>
                   <div>
                     <h3 className="font-bold text-lwai-deepBlue mb-1">Answer a few questions</h3>
                     <p className="text-gray-600 text-sm">Help us understand your goals and preferences</p>
                   </div>
                 </li>
                 {/* Step 3 */}
                 <li className="flex md:block items-start">
                   <div className="w-8 h-8 bg-lwai-deepBlue rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 mr-3 md:mx-auto md:mb-3">3</div>
                   <div>
                     <h3 className="font-bold text-lwai-deepBlue mb-1">Get your learning roadmap</h3>
                     <p className="text-gray-600 text-sm">Start learning with curated resources right away</p>
                   </div>
                 </li>
               </ol>
            </div>
          </main>
        </div>
      </section>

      {/* === See the Difference Section === */}
       <section className="bg-blue-50/60 py-16"> {/* Use lighter blue */} 
        <div className="container px-4 mx-auto">
          <main className="max-w-5xl mx-auto text-center">
             <h2 className="text-2xl md:text-3xl font-bold text-lwai-deepBlue mb-2">
               See the Difference
             </h2>
             <p className="text-lg text-gray-600 mb-8">
               How our structured approach transforms your learning journey
             </p>
             <div className="relative max-w-4xl mx-auto">
               {/* Card remains bg-white */} 
               <div className="grid md:grid-cols-2 gap-4 bg-white rounded-xl shadow-xl overflow-hidden p-4 md:p-6 relative">
                 {/* Before Column */}
                 <div className="bg-red-50/50 rounded-lg p-4 relative flex flex-col h-full border border-red-100">
                   <div className="absolute top-3 left-3 bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-md shadow-sm">BEFORE</div>
                   <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4 text-center">Unstructured Learning</h3>
                   <div className="space-y-3 flex-grow">
                     <div className="bg-white p-3 rounded-md border border-gray-200 text-sm flex items-center shadow-sm min-h-[50px]">
                       <span className="text-xl w-7 h-7 flex items-center justify-center mr-3">😵‍💫</span>
                       <span className="font-medium">
                         Too many resources <span className="font-normal text-xs text-red-500">— no structure</span>
                       </span>
                     </div>
                     <div className="bg-white p-3 rounded-md border border-gray-200 text-sm flex items-center shadow-sm min-h-[50px]">
                       <span className="text-xl w-7 h-7 flex items-center justify-center mr-3">⌛</span>
                       <span className="font-medium">
                         Wasting time <span className="font-normal text-xs text-red-500">— on random content</span>
                       </span>
                     </div>
                     <div className="bg-white p-3 rounded-md border border-gray-200 text-sm flex items-center shadow-sm min-h-[50px]">
                       <span className="text-xl w-7 h-7 flex items-center justify-center mr-3">❌</span>
                       <span className="font-medium">
                         No sense of progress <span className="font-normal text-xs text-red-500">— or achievement</span>
                       </span>
                     </div>                     
                   </div>
                   <div className="mt-5 text-center">
                     <div className="inline-block bg-red-100 text-red-700 text-sm px-4 py-2 rounded-full font-medium shadow-sm border border-red-200">Confusion, burnout & self-doubt 😣</div>
                   </div>
                 </div>
                 {/* Arrow Dividers */}
                 <div className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                   <div className="bg-gradient-to-r from-red-50 via-white to-green-50 p-2 rounded-full shadow-lg border border-gray-200">
                      <ArrowRight className="h-8 w-8 text-lwai-deepBlue" />
                   </div>
                 </div>
                 <div className="flex md:hidden justify-center items-center my-2">
                   <div className="bg-gradient-to-b from-red-50 via-white to-green-50 p-2 rounded-full shadow-lg border border-gray-200">
                      <ArrowDown className="h-8 w-8 text-lwai-deepBlue" />
                   </div>
                 </div>
                 {/* After Column */}
                 <div className="bg-green-50/50 rounded-lg p-4 relative flex flex-col h-full border border-green-100">
                   <div className="absolute top-3 left-3 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-md shadow-sm">AFTER</div>
                   <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4 text-center">Structured Learning Path</h3>
                   <div className="space-y-3 flex-grow">
                     <div className="bg-white p-3 rounded-md border border-green-200 text-sm flex items-center shadow-sm min-h-[50px]">
                       <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center mr-3 text-xs font-bold shadow-sm flex-shrink-0">1</div>
                       <span className="font-medium">Clear Foundations</span>
                       <span className="text-xs text-green-700 ml-1 hidden sm:inline">— get unstuck fast</span>
                     </div>
                      <div className="bg-white p-3 rounded-md border border-green-200 text-sm flex items-center shadow-sm min-h-[50px]">
                       <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center mr-3 text-xs font-bold shadow-sm flex-shrink-0">2</div>
                       <span className="font-medium">Core Concepts</span>
                        <span className="text-xs text-green-700 ml-1 hidden sm:inline">— build understanding</span>
                     </div>
                      <div className="bg-white p-3 rounded-md border border-green-200 text-sm flex items-center shadow-sm min-h-[50px]">
                        <div className="w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center mr-3 text-xs font-bold shadow-sm flex-shrink-0">3</div>
                       <span className="font-medium">Practical Application</span>
                        <span className="text-xs text-green-700 ml-1 hidden sm:inline">— apply & grow</span>
                     </div>                    
                   </div>
                   <div className="mt-5 text-center">
                     <div className="inline-block bg-green-100 text-green-700 text-sm px-4 py-2 rounded-full font-medium shadow-sm border border-green-200">Clarity, momentum & confidence 🚀</div>
                   </div>
                 </div>
               </div>
             </div>
          </main>
        </div>
      </section>

      {/* === AI-Powered Learning Section === */}
      <section className="bg-white py-16">
        <div className="container px-4 mx-auto">
          <main className="max-w-5xl mx-auto text-center">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-lwai-deepBlue">
                AI-Powered Learning <span className="text-blue-600">That Works</span>
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Your path from confusion to mastery in 6 simple steps
              </p>
            </div>
             {/* Challenge vs Solution Box */}
             <div className="max-w-3xl mx-auto mb-16 bg-white p-6 md:p-8 rounded-xl shadow-md relative border border-gray-100"> {/* Added border */} 
               <h3 className="text-xl font-semibold text-red-600 mb-3 flex items-center">
                 <X className="h-5 w-5 mr-2 text-red-500 flex-shrink-0"/> The Challenge
               </h3>
               <p className="text-gray-700 mb-6 ml-7">
                 Learning anything new often means drowning in endless resources with no clear starting point. Most learners waste time, lose momentum, and quit before seeing results.
               </p>
               <h3 className="text-xl font-semibold text-green-600 mb-3 flex items-center">
                  <Check className="h-5 w-5 mr-2 text-green-600 flex-shrink-0"/> Our Solution
               </h3>
               <p className="text-gray-700 ml-7">
                 A personalized AI roadmap that analyzes your goals and skill level, then delivers exactly what to learn, when to learn it, and how to apply it—transforming overwhelming subjects into achievable steps.
               </p>
             </div>

             {/* 6 Steps Grid */}
             <div className="relative max-w-5xl mx-auto">
               <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-700/50 transform -translate-y-1/2 z-0" style={{top: 'calc(50% - 80px)'}}></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                 {steps.map((step, index) => (
                   <div 
                     key={index} 
                     className={`bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 relative flex flex-col ${expandedStep === index ? 'min-h-[250px]' : 'h-[220px]'}`}
                   >
                     <div className="absolute -top-4 -left-4 flex items-center justify-center w-10 h-10 bg-lwai-deepBlue text-white rounded-full text-lg font-semibold shadow-md z-10">
                       {index + 1}
                     </div>
                     <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4 text-3xl mx-auto">
                       {step.icon}
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{step.title}</h3>
                     <div className={`flex-grow flex flex-col justify-between overflow-hidden transition-all duration-500 ease-in-out ${expandedStep === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                       <p className="text-gray-600 text-center text-sm mt-2">{step.details}</p>
                     </div>
                     <div className="mt-auto pt-2 text-center">
                       <button 
                         onClick={() => toggleStep(index)}
                         className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors focus:outline-none inline-flex items-center"
                       >
                         {expandedStep === index ? 'Hide details' : 'Read more'}
                         {expandedStep === index 
                           ? <ChevronUp className="h-4 w-4 ml-1" /> 
                           : <ChevronDown className="h-4 w-4 ml-1" />
                         }
                       </button>
                     </div>                    
                   </div>
                 ))}
               </div>
             </div>
          </main>
        </div>
      </section>

      {/* === Learn More Effectively (Features) Section === */}
      <section className="bg-blue-50/60 py-16"> {/* Use lighter blue */} 
         <div className="container px-4 mx-auto">
          <main className="max-w-5xl mx-auto text-center">
             <div className="text-center mb-12">
               <h2 className="text-3xl md:text-4xl font-bold text-lwai-deepBlue">
                 Learn More Effectively
               </h2>
               <p className="mt-4 text-xl text-gray-600">
                 Learn With AI transforms how you learn with these powerful features
               </p>
             </div>
             {/* Feature cards remain bg-white */} 
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Feature Card 1 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Map className="h-8 w-8 text-lwai-deepBlue" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Learning Paths</h3>
                  <p className="text-gray-600 text-sm">
                    Follow a clear, step-by-step roadmap tailored to your goals and current knowledge level.
                  </p>
                </div>
                {/* Feature Card 2 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-lwai-deepBlue" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Gap Analysis</h3>
                  <p className="text-gray-600 text-sm">
                    Identify exactly what to learn next based on your understanding, ensuring optimal progress.
                  </p>
                </div>
                {/* Feature Card 3 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Shapes className="h-8 w-8 text-lwai-deepBlue" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Progressive Learning System</h3>
                  <p className="text-gray-600 text-sm">
                    Master concepts in the optimal order, building on previous knowledge for better retention.
                  </p>
                </div>
                {/* Feature Card 4 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <CheckSquare className="h-8 w-8 text-lwai-deepBlue" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Curated Learning Materials</h3>
                  <p className="text-gray-600 text-sm">
                    Access the most effective resources for each concept—all in one place with no endless searching.
                  </p>
                </div>
                {/* Feature Card 5 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-lwai-deepBlue" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Time-Optimized Learning</h3>
                  <p className="text-gray-600 text-sm">
                    Learn efficiently with time estimates and structured challenges to keep you on track.
                  </p>
                </div>
                {/* Feature Card 6 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Repeat className="h-8 w-8 text-lwai-deepBlue" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative & Adaptive Learning</h3>
                  <p className="text-gray-600 text-sm">
                    Connect with peers while your roadmap evolves based on your progress for optimal learning.
                  </p>
                </div>
             </div>
          </main>
        </div>
      </section>

       {/* === Who Benefits Section === */}
      <section className="bg-white py-16">
        <div className="container px-4 mx-auto">
          <main className="max-w-5xl mx-auto text-center">
             <div className="text-center mb-12">
               <h2 className="text-2xl md:text-3xl font-bold text-lwai-deepBlue">
                 Who Benefits Most from Learn With AI?
               </h2>
             </div>
              {/* Benefit cards have bg-blue-50/70 */} 
             <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
               {/* Benefit Card 1 */}
               <div className="bg-blue-50/70 p-6 rounded-xl relative text-center flex flex-col items-center border border-blue-100">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                   <GraduationCap className="h-8 w-8 text-lwai-deepBlue" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Students & Career Changers</h3>
                 <p className="text-gray-700 text-sm">
                   Who need to learn efficiently with clear structure and guidance to achieve their goals faster.
                 </p>
               </div>
               {/* Benefit Card 2 */}
               <div className="bg-blue-50/70 p-6 rounded-xl relative text-center flex flex-col items-center border border-blue-100">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                   <Briefcase className="h-8 w-8 text-lwai-deepBlue" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Busy Professionals</h3>
                 <p className="text-gray-700 text-sm">
                   Who want to maximize learning in limited time with focused, structured approaches rather than random exploration.
                 </p>
               </div>
               {/* Benefit Card 3 */}
               <div className="bg-blue-50/70 p-6 rounded-xl relative text-center flex flex-col items-center border border-blue-100">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-blue-100">
                   <BookOpen className="h-8 w-8 text-lwai-deepBlue" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Self-Directed Learners</h3>
                 <p className="text-gray-700 text-sm">
                   Who know what they want to learn but need guidance on the most effective learning path and resources.
                 </p>
               </div>
             </div>
          </main>
        </div>
      </section>

       {/* === Testimonials Section === */}
       <section className="py-16 bg-blue-50/60"> 
        <div className="container px-4 mx-auto">
          <main className="max-w-5xl mx-auto text-center">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-lwai-deepBlue">
                Learning Transformed
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                See how our structured approach helps people learn more effectively
              </p>
            </div>
            {/* Testimonial cards remain bg-white */} 
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col text-left h-full">
                  <div className="flex items-center mb-4">
                    <div className="mr-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm border border-blue-200">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-lg text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-blue-600">{testimonial.title}</div>
                      <div className="flex mt-1">
                        {renderStars(testimonial.rating)}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic text-sm flex-grow">
                    &quot;{testimonial.quote}&quot;
                  </p>                  
                </div>
              ))}
            </div>
          </main>
        </div>
      </section>

      {/* === Final CTA Section === */}
      {/* Removed base dark BG from section tag */}
       <section className="py-16">
         <div className="container px-4 mx-auto">
           <main className="max-w-5xl mx-auto text-center">
             {/* Restyled the inner div for light theme */}
             <div className="py-16 md:py-20 bg-white text-gray-800 rounded-xl shadow-lg relative overflow-hidden border border-gray-200">
               <div className="max-w-3xl mx-auto text-center px-4 relative z-10">
                 {/* Updated text colors */}
                 <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-lwai-deepBlue">
                   From Overwhelmed to <span className="text-blue-600">Mastery</span> in Weeks
                 </h2>
                 <p className="text-lg md:text-xl text-gray-600 mb-8">
                   Your AI coach builds tailored learning paths that make complex subjects simple—so you achieve in days what used to take months.
                 </p>
                 {/* Updated Button style */}
                 <div className="mb-10">
                   <Button
                     onClick={scrollToTop}
                     size="lg"
                     className="bg-lwai-deepBlue text-white hover:bg-lwai-deepBlue/90 shadow-md text-lg px-8 py-3"
                   >
                     <ArrowUp className="mr-2 h-5 w-5" />
                     Start Your Learning Journey
                   </Button>
                 </div>
                 {/* Mini Quotes Grid - Updated card style */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {miniQuotes.map((quote, index) => (
                     <div key={index} className="bg-blue-50/70 p-5 rounded-lg relative text-left border border-blue-100">
                       <div className="flex items-start">
                         <Check className="h-5 w-5 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                         <div>
                           <p className="italic text-gray-700 mb-2 text-sm">&quot;{quote.text}&quot;</p>
                           <p className="font-medium text-sm text-gray-500">— {quote.author}</p>
                         </div>
                       </div>                       
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </main>
         </div>
       </section>

      {/* === Footer Section === */}
      <footer className="bg-white text-gray-700 py-12 relative overflow-hidden border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Learn With AI Info */}
            <div className="md:col-span-1">
              <h3 className="text-xl font-bold mb-4 text-lwai-deepBlue">Learn With AI</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Learn more effectively with structured, step-by-step learning paths tailored to your goals.
              </p>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1 text-gray-500" />
                  3,000+ Users
                </div>
                <div className="flex items-center">
                  <Library className="h-4 w-4 mr-1 text-gray-500" />
                  1,000+ Learning Paths
                </div>
              </div>
            </div>
            {/* Column 2 & 3 Merged: Contact Info */}
            <div className="md:col-span-2 flex flex-col md:items-end">
              <h4 className="text-lg font-semibold mb-4 text-lwai-deepBlue">Contact & Connect</h4>
              <div className="flex flex-col items-start md:items-end space-y-3">
                <a href="mailto:dannykonovalov@stern.nyu.edu" className="flex items-center text-gray-600 hover:text-lwai-deepBlue transition-colors text-sm">
                  <Mail className="h-4 w-4 mr-2 flex-shrink-0 text-gray-500" />
                  dannykonovalov@stern.nyu.edu
                </a>
                <div className="flex space-x-4 mt-2">
                   <a href="https://x.com/KonovalovDanny" target="_blank" rel="noopener noreferrer" aria-label="X Profile" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <img src="/images/x.png" alt="X Logo" className="h-5 w-5 filter grayscale hover:grayscale-0 transition duration-200" /> 
                  </a>
                  <a href="https://www.linkedin.com/in/danny-konovalov/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="text-gray-500 hover:text-gray-800 transition-colors">
                    <img src="/images/linkedin.png" alt="LinkedIn Logo" className="h-5 w-5 filter grayscale hover:grayscale-0 transition duration-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom Copyright */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Learn With AI. All rights reserved.</p>
            <p className="mt-1">Learn smarter, not harder. Master any skill with a structured approach.</p>
          </div>
        </div>
      </footer>
      {/* === End Footer Section === */}
    </>
  );
};

export default HomePage;

