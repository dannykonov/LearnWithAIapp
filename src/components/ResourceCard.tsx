
import React, { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface ResourceCardProps {
  resource: Resource;
  onToggleCompleted: () => void;
  isLast?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onToggleCompleted, isLast = false }) => {
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);
  
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
        // Check if it's a YouTube link and transform it to embed URL if needed
        let embedUrl = resource.link;
        if (embedUrl.includes('youtube.com/watch?v=')) {
          embedUrl = embedUrl.replace('watch?v=', 'embed/');
        } else if (embedUrl.includes('youtu.be/')) {
          const videoId = embedUrl.split('youtu.be/')[1];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        return (
          <div className="relative pt-[56.25%] w-full mt-3 rounded-lg overflow-hidden">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={resource.title}
            ></iframe>
          </div>
        );
        
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
