import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Helper function to extract video ID from various YouTube URL formats
const extractVideoId = (url: string): string | null => {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the YouTube video URL from the request
  const { videoUrl } = req.body;
  
  if (!videoUrl) {
    return res.status(400).json({ 
      error: 'Missing videoUrl in request body',
      embeddable: false
    });
  }
  
  // Extract the video ID from the URL
  const videoId = extractVideoId(videoUrl);
  
  if (!videoId) {
    return res.status(400).json({ 
      error: 'Invalid YouTube URL or could not extract video ID',
      embeddable: false
    });
  }
  
  // Check if we have a YouTube API key
  const youtubeApiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!youtubeApiKey) {
    console.warn('No YouTube API key found, skipping embeddable check');
    // Without an API key, we can't check embeddability, so we assume it's embeddable
    return res.status(200).json({ 
      embeddable: true,
      videoId: videoId,
      checkedWithApi: false
    });
  }
  
  try {
    // Call the YouTube Data API to get video details
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=status&key=${youtubeApiKey}`;
    const response = await axios.get(apiUrl);
    
    // Check if we got a valid response with items
    if (response.data && response.data.items && response.data.items.length > 0) {
      // Get the embeddable status from the API response
      const embeddable = response.data.items[0].status.embeddable === true;
      
      return res.status(200).json({
        embeddable,
        videoId,
        checkedWithApi: true
      });
    } else {
      // Video not found or API returned no items
      return res.status(200).json({
        embeddable: false,
        videoId,
        checkedWithApi: true,
        error: 'Video not found or is private'
      });
    }
  } catch (error) {
    console.error('Error checking YouTube video embeddability:', error);
    
    // On API error, assume it's embeddable to avoid false negatives
    return res.status(200).json({
      embeddable: true,
      videoId,
      checkedWithApi: false,
      error: 'Error checking embeddability'
    });
  }
} 