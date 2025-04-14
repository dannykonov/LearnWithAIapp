import React, { useState, useEffect } from 'react';
import { Resource } from '../contexts/RoadmapContext';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Video, 
  Code, 
  FileType, 
  Headphones, 
  MessagesSquare, 
  Clock, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Youtube
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface ResourceCardProps {
  resource: Resource;
  onToggleCompleted: () => void;
  isLast?: boolean;
}

// Add a type for the video embed status
type VideoEmbedStatus = 'loading' | 'success' | 'error' | 'not-video';

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onToggleCompleted, isLast = false }) => {
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  const [videoEmbedStatus, setVideoEmbedStatus] = useState<VideoEmbedStatus>(
    resource.type === 'video' ? 'loading' : 'not-video'
  );
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);
  const [isCheckingEmbeddable, setIsCheckingEmbeddable] = useState(false);
  
  // Check if YouTube videos are embeddable on component mount
  useEffect(() => {
    const checkVideoEmbeddable = async () => {
      // Only check for YouTube video resources
      if (resource.type !== 'video' || !resource.link || isCheckingEmbeddable) {
        return;
      }
      
      try {
        setIsCheckingEmbeddable(true);
        
        // Get the base URL for API calls
        const getApiBaseUrl = () => {
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
          } else {
            return '';
          }
        };
        
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/check-youtube-video`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: resource.link
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to check video embeddability:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('Video embeddability check result:', data);
        
        // If the video is not embeddable, mark it as an error
        if (!data.embeddable) {
          console.log('Video is not embeddable, handling error:', resource.link);
          setVideoEmbedStatus('error');
          // No longer generating articles automatically
        }
      } catch (error) {
        console.error('Error checking video embeddability:', error);
      } finally {
        setIsCheckingEmbeddable(false);
      }
    };
    
    checkVideoEmbeddable();
  }, [resource.type, resource.link]);
  
  // Function to handle video loading errors
  const handleVideoError = () => {
    console.error(`Failed to load video: ${resource.link}`);
    setVideoEmbedStatus('error');
    // No longer generating articles automatically
  };
  
  // Function to handle video loading success
  const handleVideoLoad = () => {
    console.log(`Successfully loaded video: ${resource.link}`);
    setVideoEmbedStatus('success');
  };
  
  // Function to generate an article for the topic using OpenAI
  const generateArticleForTopic = async () => {
    if (isLoadingArticle) return;
    
    try {
      setIsLoadingArticle(true);
      
      // Get the base URL for API calls
      const getApiBaseUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:3001';
        } else {
          return '';
        }
      };
      
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/generate-article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: resource.title,
          description: resource.description
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate article: ${response.status}`);
      }
      
      const data = await response.json();
      setArticleContent(data.article);
    } catch (error) {
      console.error('Error generating article:', error);
      setArticleContent('**Failed to generate article content.** Please check your internet connection and try again.');
    } finally {
      setIsLoadingArticle(false);
    }
  };
  
  // Check if the URL is a direct YouTube embed URL
  const isYouTubeEmbedUrl = resource.link?.includes('youtube.com/embed/');
  
  // Extract video ID from various YouTube URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    try {
      // Handle youtube.com/embed/VIDEO_ID
      if (url.includes('youtube.com/embed/')) {
        return url.split('youtube.com/embed/')[1]?.split('?')[0] || null;
      }
      
      // Handle youtube.com/watch?v=VIDEO_ID
      if (url.includes('youtube.com/watch')) {
        return new URL(url).searchParams.get('v');
      }
      
      // Handle youtu.be/VIDEO_ID
      if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1]?.split('?')[0] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return null;
    }
  };
  
  // Create direct watch link for YouTube videos
  const getWatchLink = (): string => {
    const videoId = getYouTubeVideoId(resource.link);
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
    return resource.link;
  };
  
  // Icon mapping based on resource type
  const getResourceIcon = () => {
    switch(resource.type) {
      case 'video':
        return <Video className="text-blue-500" size={18} />;
      case 'article':
        return <FileText className="text-green-500" size={18} />;
      case 'interactive':
        return <Code className="text-purple-500" size={18} />;
      case 'pdf':
        return <FileType className="text-red-500" size={18} />;
      case 'podcast':
        return <Headphones className="text-yellow-500" size={18} />;
      case 'thread':
        return <MessagesSquare className="text-indigo-500" size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  // Badge classname based on resource type
  const getBadgeClass = () => {
    switch(resource.type) {
      case 'video':
        return 'badge-video';
      case 'article':
        return 'badge-article';
      case 'interactive':
        return 'badge-interactive';
      case 'pdf':
        return 'badge-pdf';
      case 'podcast':
        return 'badge-podcast';
      case 'thread':
        return 'badge-thread';
      default:
        return 'badge-resource';
    }
  };

  const handleResourceComplete = () => {
    const wasCompleted = resource.completed;
    onToggleCompleted();
    
    // Show completion effect and toast when marking as completed
    if (!wasCompleted) {
      setShowCompletionEffect(true);
      setTimeout(() => setShowCompletionEffect(false), 2000);
      
      toast({
        title: "Resource Completed",
        description: `You've completed "${resource.title}" - great progress!`,
        variant: "default",
      });
    }
  };

  // Render embedded content based on type
  const renderEmbeddedContent = () => {
    switch(resource.type) {
      case 'video':
        // YouTube embed handling with error fallback
        if (videoEmbedStatus === 'loading' || videoEmbedStatus === 'success') {
          return (
            <div className="relative pt-[56.25%] w-full mt-3 rounded-lg overflow-hidden">
              {videoEmbedStatus === 'loading' && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <Video className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Loading video...</span>
                  </div>
                </div>
              )}
              
              <iframe
                className="absolute inset-0 w-full h-full"
                src={resource.link}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={resource.title}
                onLoad={handleVideoLoad}
                onError={handleVideoError}
              ></iframe>
            </div>
          );
        } else if (videoEmbedStatus === 'error') {
          // Simplified UI - only shows a direct link to YouTube
          return (
            <div className="mt-3 flex flex-col items-center">
              <div className="flex flex-col items-center p-6 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                <h4 className="font-medium text-red-700">Video couldn't be embedded</h4>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  YouTube doesn't allow this video to be embedded due to security settings.
                </p>
                <a 
                  href={getWatchLink()} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Watch on YouTube
                </a>
              </div>
            </div>
          );
        }
        return null;
        
      case 'article':
        return (
          <div className="mt-3 p-4 border rounded-lg bg-white/50">
            <h4 className="font-medium text-lwai-deepBlue">{resource.title}</h4>
            {resource.description && (
              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
            )}
            <div className="mt-3 flex items-center text-xs text-gray-500">
              <span>Source: {resource.source}</span>
              <a 
                href={resource.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-auto flex items-center text-lwai-skyBlue hover:underline"
              >
                Read <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        );
        
      case 'pdf':
        return (
          <div className="relative pt-[140%] w-full mt-3 rounded-lg overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={resource.link}
              frameBorder="0"
              title={resource.title}
            ></iframe>
          </div>
        );
        
      case 'interactive':
        return (
          <div className="relative pt-[56.25%] w-full mt-3 rounded-lg overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={resource.link}
              frameBorder="0"
              title={resource.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>
        );
        
      default:
        return (
          <div className="mt-3 p-4 border rounded-lg bg-white/50">
            <h4 className="font-medium text-lwai-deepBlue">{resource.title}</h4>
            {resource.description && (
              <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
            )}
            <div className="mt-3 flex justify-between items-center text-sm">
              <span className="text-gray-500">Source: {resource.source}</span>
              <a 
                href={resource.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-lwai-skyBlue hover:underline flex items-center"
              >
                Open Resource <ExternalLink size={12} className="ml-1" />
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={cn(
      "relative mt-4 mb-4 p-4 rounded-xl border transition-all duration-300",
      resource.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200',
      !isLast && "after:absolute after:w-px after:h-4 after:bg-lwai-skyBlue/40 after:left-7 after:-bottom-4"
    )}>
      {/* Completion effect animation */}
      {showCompletionEffect && (
        <div className="absolute inset-0 bg-green-400/20 rounded-xl z-10 animate-pulse flex items-center justify-center">
          <div className="bg-white rounded-full p-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      )}
      
      <div className="flex items-start">
        <Checkbox 
          id={`resource-${resource.id}`}
          checked={resource.completed}
          onCheckedChange={handleResourceComplete}
          className={cn(
            "mt-1 transition-all duration-300",
            resource.completed && "bg-green-500 text-white"
          )}
        />
        <div className="ml-3 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={getBadgeClass()}>
              {getResourceIcon()}
              <span className="ml-1 capitalize">{resource.type}</span>
            </span>
            <span className="flex items-center text-xs text-gray-500 ml-2">
              <Clock size={12} className="mr-1" />
              {resource.timeEstimate}
            </span>
            
            {/* Add fallback indicator */}
            {resource.isFallback && (
              <span className="flex items-center text-xs text-amber-600 ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                General resource
              </span>
            )}
          </div>
          
          <h3 className={cn(
            "font-medium mt-1 transition-all duration-300",
            resource.completed && "line-through text-gray-500"
          )}>
            {resource.title}
          </h3>
          
          {renderEmbeddedContent()}
        </div>
      </div>
      
      {/* Visual decorative elements for gamification */}
      {resource.completed && (
        <div className="absolute -right-2 -top-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white animate-bounce-small">
          <CheckCircle className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default ResourceCard;
