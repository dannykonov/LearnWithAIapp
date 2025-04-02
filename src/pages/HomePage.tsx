import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';
import { ArrowRight, Brain, Lightbulb, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRoadmap } from '@/contexts/RoadmapContext';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const [topic, setTopic] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();
  const { setUserAnswers } = useRoadmap();
  const { currentUser } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTopic = topic.trim();
    if (trimmedTopic) {
      if (currentUser) {
        setUserAnswers({
          topic: trimmedTopic,
          existingKnowledge: '',
          background: '',
          pace: '',
          contentPreference: '',
          availableTime: '',
          goal: ''
        });
        navigate('/questions');
      } else {
        sessionStorage.setItem('topicBeforeLogin', trimmedTopic);
        navigate('/login');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container px-4 py-8 mx-auto">
        <header className="mb-12 flex justify-center">
          <Logo size="lg" />
        </header>

        <main className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-lwai-deepBlue mb-6">
            Learn anything with the help of AI
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Get a personalized learning roadmap with curated resources tailored to your goals and preferences.
          </p>

          <div className="mb-12">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className={`relative transition-all duration-300 ${isInputFocused ? 'transform scale-105' : ''}`}>
                <Input
                  type="text"
                  placeholder="What do you want to learn?"
                  className="bg-white h-16 text-lg px-6 rounded-xl shadow-md"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lwai-deepBlue mx-auto mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">Personalized Learning</h3>
              <p className="text-gray-600">
                Customized roadmaps based on your background, pace, and learning style.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-lwai-deepBlue mx-auto mb-4">
                <Lightbulb className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-lwai-deepBlue mb-2">Learn In-App</h3>
              <p className="text-gray-600">
                Watch videos, read articles, and try interactive tools without leaving the platform.
              </p>
            </div>
            
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
          
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-lwai-deepBlue mb-4">How It Works</h2>
            <ol className="flex flex-col md:flex-row justify-around text-left md:text-center max-w-4xl mx-auto">
              <li className="mb-4 md:mb-0 flex md:block items-start">
                <div className="w-8 h-8 bg-lwai-deepBlue rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 mr-3 md:mx-auto md:mb-3">1</div>
                <div>
                  <h3 className="font-bold text-lwai-deepBlue mb-1">Tell us what you want to learn</h3>
                  <p className="text-gray-600 text-sm">Enter any topic or skill you're interested in</p>
                </div>
              </li>
              
              <li className="mb-4 md:mb-0 flex md:block items-start">
                <div className="w-8 h-8 bg-lwai-deepBlue rounded-full text-white flex items-center justify-center font-bold flex-shrink-0 mr-3 md:mx-auto md:mb-3">2</div>
                <div>
                  <h3 className="font-bold text-lwai-deepBlue mb-1">Answer a few questions</h3>
                  <p className="text-gray-600 text-sm">Help us understand your goals and preferences</p>
                </div>
              </li>
              
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
    </div>
  );
};

export default HomePage;

