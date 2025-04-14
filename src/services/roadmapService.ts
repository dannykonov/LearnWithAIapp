import { UserAnswers, RoadmapStep, ResourceType } from '../contexts/RoadmapContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  doc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Debug Firebase configuration
console.log("Firestore db instance:", db ? "Valid" : "Invalid");
console.log("Firestore configuration loaded:", Boolean(db));

// Add a type for the generation engine choice
export type GenerationEngine = 'chatgpt' | 'perplexity' | 'enhanced';

// Add a type for Roadmap documents
export interface RoadmapDocument {
  id: string;
  userId: string;
  topic: string;
  userAnswers: UserAnswers;
  steps: RoadmapStep[];
  createdAt: any; // Firebase Timestamp
  lastUpdatedAt: any; // Firebase Timestamp
  progress: number;
}

// Determine the appropriate API base URL based on environment
const getApiBaseUrl = () => {
  // For local development, use the dedicated Express API server on port 3001
  // This is necessary because in this project, Vite (on 8080) doesn't handle API routes itself
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  } else {
    // In production, use relative path since API endpoints are deployed with the frontend
    console.log('Using production API path (relative URL)');
    return ''; // Empty string means use relative paths from the same domain
  }
};

// Calls the API endpoint to generate a roadmap
// Add 'engine' parameter
export const generateRoadmap = async (userAnswers: UserAnswers, engine: GenerationEngine = 'perplexity'): Promise<RoadmapStep[]> => {
  try {
    // Use our new enhanced roadmap generation endpoint
    console.log(`Sending request to API for enhanced roadmap generation with topic: ${userAnswers.topic}`);
    
    const apiBaseUrl = getApiBaseUrl();
    const apiUrl = `${apiBaseUrl}/api/generate-enhanced-roadmap`;
    
    console.log('Calling API at URL:', apiUrl);
    console.log('Current hostname:', window.location.hostname);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userAnswers),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
      throw new Error(errorData.message || `Failed to generate roadmap: ${response.status}`);
    }
    
    try {
      // First get the raw response data, which may have different formats
      const responseData = await response.json();
      console.log('API Response received:', responseData);
      
      // Extract the roadmap array, which could be the response itself or nested in a roadmap property
      let roadmapData: RoadmapStep[];
      
      if (Array.isArray(responseData)) {
        // Direct array response
        roadmapData = responseData;
      } else if (responseData.roadmap && Array.isArray(responseData.roadmap)) {
        // Nested structure (like from enhanced roadmap)
        roadmapData = responseData.roadmap;
      } else {
        console.error('Unknown response format:', responseData);
        throw new Error('Received invalid roadmap data format');
      }
      
      // Validate roadmap data before returning
      if (!Array.isArray(roadmapData)) {
        console.error('Invalid roadmap data, not an array:', roadmapData);
        throw new Error('Received invalid roadmap data format');
      }
      
      // Ensure each step has the required fields
      const validatedRoadmap = roadmapData.map((step, index) => ({
        id: step.id || `step-${index}-${Date.now()}`,
        stepNumber: step.stepNumber || index + 1,
        title: step.title || `Step ${index + 1}`,
        description: step.description || '',
        connectionText: step.connectionText || '',  // Add the new connectionText field
        resources: Array.isArray(step.resources) ? step.resources.map((resource, rIndex) => {
          // Convert resource type to a valid ResourceType
          let validType: ResourceType = 'article';
          const typeStr = resource.type?.toLowerCase();
          if (typeStr === 'video') validType = 'video';
          else if (typeStr === 'article') validType = 'article';
          else if (typeStr === 'interactive') validType = 'interactive';
          else if (typeStr === 'pdf') validType = 'pdf';
          else if (typeStr === 'podcast') validType = 'podcast';
          else if (typeStr === 'thread') validType = 'thread';
          // Default to article if not in allowed values
          
          return {
            id: resource.id || `resource-${rIndex}-${Date.now()}`,
            title: resource.title || 'Resource',
            type: validType,
            link: resource.link || '#',
            timeEstimate: resource.timeEstimate || '30 min',
            source: resource.source || 'Unknown',
            description: resource.description || '',
            completed: false,
            isFallback: resource.isFallback || false  // Add isFallback property
          };
        }) : [],
        completed: false,
        timeEstimate: step.timeEstimate || '30 min'
      }));

      return validatedRoadmap;
    } catch (parseError) {
      console.error('Error parsing roadmap data:', parseError);
      throw new Error('Failed to parse roadmap data from API');
    }
  } catch (error) {
    console.error('Error generating roadmap:', error);
    throw error;
  }
};

/**
 * Fetch all roadmaps for a specific user
 */
export const getUserRoadmaps = async (userId: string): Promise<RoadmapDocument[]> => {
  try {
    console.log(`Attempting to fetch roadmaps for user: ${userId}`);
    
    if (!userId) {
      console.warn("getUserRoadmaps was called with no userId");
      return [];
    }
    
    // First check if the roadmaps collection exists and has any documents
    const collectionRef = collection(db, "roadmaps");
    
    // Create query - Try without orderBy first to avoid index issues
    const q = query(
      collectionRef, 
      where("userId", "==", userId)
    );
    
    console.log("Executing Firestore query for roadmaps");
    const querySnapshot = await getDocs(q);
    console.log(`Query returned ${querySnapshot.size} results`);
    
    const roadmaps: RoadmapDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      roadmaps.push({
        id: doc.id,
        ...data
      } as RoadmapDocument);
    });
    
    // Sort on the client side instead of using orderBy (to avoid index issues)
    roadmaps.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      
      // Convert Firestore timestamps to milliseconds for comparison
      const timeA = a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
      
      // Sort descending (newest first)
      return timeB - timeA;
    });
    
    return roadmaps;
  } catch (error) {
    console.error("Error fetching user roadmaps:", error);
    // More descriptive error that might help debugging
    if (error instanceof Error) {
      console.error(`Error details: ${error.message}`);
      if (error.message.includes("index")) {
        console.error("This appears to be a Firestore index error. You may need to create a composite index.");
      }
    }
    
    // Return empty array instead of throwing, to avoid breaking the UI
    return [];
  }
};

/**
 * Get a single roadmap by ID
 */
export const getRoadmapById = async (roadmapId: string): Promise<RoadmapDocument | null> => {
  try {
    console.log("getRoadmapById called with ID:", roadmapId);
    if (!roadmapId) {
      console.error("getRoadmapById called with empty ID");
      throw new Error("Invalid roadmap ID");
    }
    
    // Debug Firebase configuration
    console.log("Firestore instance:", db ? "Available" : "Unavailable");
    console.log("Firebase app config:", JSON.stringify(db?.app?.options || {}).substring(0, 200));
    
    const roadmapRef = doc(db, "roadmaps", roadmapId);
    console.log("Executing Firestore getDoc for roadmap", roadmapId);
    
    try {
      const roadmapDoc = await getDoc(roadmapRef);
      console.log("getDoc completed. Document exists:", roadmapDoc.exists());
      
      if (roadmapDoc.exists()) {
        const data = roadmapDoc.data();
        console.log("Document data keys:", Object.keys(data));
        console.log("Has steps array:", Boolean(data.steps));
        console.log("Steps is array:", Array.isArray(data.steps));
        if (data.steps) console.log("Steps length:", data.steps.length);
        
        // Check if data has required fields
        if (!data.steps || !Array.isArray(data.steps)) {
          console.error("Roadmap missing steps array or invalid format:", data);
          throw new Error("Roadmap data is missing required fields");
        }
        
        return {
          id: roadmapDoc.id,
          ...data
        } as RoadmapDocument;
      } else {
        console.log("Roadmap document does not exist");
        return null;
      }
    } catch (docError) {
      console.error("Error in getDoc operation:", docError);
      throw docError;
    }
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
};

/**
 * Delete a roadmap
 */
export const deleteRoadmap = async (roadmapId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "roadmaps", roadmapId));
    return true;
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    throw error;
  }
};

/**
 * Update a roadmap's title
 */
export const updateRoadmapTitle = async (roadmapId: string, newTitle: string): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "roadmaps", roadmapId), {
      topic: newTitle,
      lastUpdatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating roadmap title:", error);
    throw error;
  }
};

/**
 * Update a roadmap's progress
 */
export const updateRoadmapProgress = async (roadmapId: string, progress: number): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "roadmaps", roadmapId), {
      progress,
      lastUpdatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating roadmap progress:", error);
    throw error;
  }
};

/**
 * Update a roadmap's steps
 */
export const updateRoadmapSteps = async (roadmapId: string, steps: RoadmapStep[]): Promise<boolean> => {
  try {
    await updateDoc(doc(db, "roadmaps", roadmapId), {
      steps,
      lastUpdatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error updating roadmap steps:", error);
    throw error;
  }
};

/**
 * Debug utility to create a test roadmap document 
 * This is just for testing - you may want to comment out or remove this later
 */
export const createTestRoadmap = async (userId: string) => {
  if (!userId) {
    console.error("Cannot create test roadmap without userId");
    return;
  }
  
  try {
    console.log("Creating test roadmap for debugging");
    
    // Create a simple test roadmap
    const testRoadmap = {
      userId,
      topic: "Test Roadmap",
      userAnswers: {
        topic: "Test Roadmap",
        existingKnowledge: "Some knowledge",
        background: "intermediate",
        pace: "steady",
        contentPreference: "article",
        availableTime: "1-3 hours",
        goal: "Testing"
      },
      steps: [
        {
          id: `step-test-1`,
          stepNumber: 1,
          title: "Test Step 1",
          description: "This is a test step",
          resources: [
            {
              id: `resource-test-1`,
              title: "Test Resource",
              type: "article",
              link: "https://example.com",
              timeEstimate: "10 min",
              source: "Example",
              description: "A test resource",
              completed: false
            }
          ],
          completed: false,
          timeEstimate: "10 min"
        }
      ],
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      progress: 0
    };
    
    // Add to Firestore - use addDoc to auto-generate ID
    const docRef = await addDoc(collection(db, "roadmaps"), testRoadmap);
    console.log("Created test roadmap with ID:", docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Error creating test roadmap:", error);
  }
};
