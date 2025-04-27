import axios from 'axios';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Function to generate podcast text using OpenAI Chat API
export const generatePodcastText = async (stepInfo: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API Key not found. Please set VITE_OPENAI_API_KEY.');
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-3.5-turbo", // Use a standard chat model
      messages: [
        {
          role: "system",
          content: "You are an assistant that generates engaging podcast scripts for learning topics. The script should be suitable for a ~2 minute audio duration."
        },
        {
          role: "user",
          content: `Generate a podcast script for the following learning step: ${stepInfo}`
        }
      ],
      max_tokens: 500, // Adjusted max_tokens if needed
      temperature: 0.7,
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Access the response correctly for chat completions
    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    console.error('Error generating podcast text:', error.response ? error.response.data : error.message);
    // Provide more specific error feedback
    const errorMsg = error.response?.data?.error?.message || 'Failed to generate podcast text';
    throw new Error(errorMsg);
  }
};

// Function to convert text to speech using OpenAI TTS API
export const convertTextToSpeech = async (text: string): Promise<Blob> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API Key not found. Please set VITE_OPENAI_API_KEY.');
  }
  
  try {
    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: "tts-1", // Standard TTS model
      input: text,
      voice: "alloy", // Example voice, choose from: alloy, echo, fable, onyx, nova, shimmer
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      responseType: 'blob', // Expecting audio data back
    });

    return response.data;
  } catch (error: any) {
     console.error('Error converting text to speech:', error.response ? error.response.data : error.message);
    // Provide more specific error feedback
    const errorMsg = error.response?.data?.error?.message || 'Failed to convert text to speech';
    throw new Error(errorMsg);
  }
};

// Function to store audio in Firebase Storage
export const storeAudioInFirebase = async (audioBlob: Blob, stepId: string, userId: string): Promise<string> => {
  // Ensure Firebase Storage emulator is targeted if running locally
  const storageInstance = storage; // Use the initialized storage
  // Note: If using emulators, make sure your firebaseConfig points correctly or use connectStorageEmulator

  try {
    // Use a unique path including user ID and step ID
    const storageRef = ref(storageInstance, `podcasts/${userId}/${stepId}.mp3`);
    
    await uploadBytes(storageRef, audioBlob, { contentType: 'audio/mpeg' }); // Specify content type

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error storing audio in Firebase:', error);
    throw new Error('Failed to store audio in Firebase');
  }
}; 