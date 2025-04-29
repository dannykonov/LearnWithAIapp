import { httpsCallable, getFunctions } from 'firebase/functions';
import { functions, auth } from '../firebaseConfig'; // Import auth
import axios from 'axios'; // Use axios for standard HTTPS requests

// Define types for payment responses
interface CheckoutSessionResponseData {
  success: boolean;
  sessionId?: string;
  url?: string;
  message?: string;
  paymentStatus?: string;
}

interface PaymentVerificationResponseData {
  success: boolean;
  paymentStatus: 'paid' | 'pending' | 'unpaid';
  isPaid: boolean;
}

// Define structure for API responses (when using onRequest)
interface ApiResponse<T> {
  data?: T;
  error?: { code: string; message: string };
}

// Helper to get the base URL for functions
const getFunctionsBaseUrl = () => {
  // Use emulator URL if configured, otherwise deployed URL
  const funcs = getFunctions();
  if ((funcs as any)._emulatorOrigin) {
    return (funcs as any)._emulatorOrigin; 
  } 
  // Construct deployed URL (replace with your actual project ID and region if needed)
  const projectId = functions.app.options.projectId;
  const region = 'us-central1'; // Default region
  return `https://${region}-${projectId}.cloudfunctions.net`;
};

// Function to create a checkout session (using axios)
export const createCheckoutSession = async (
  roadmapId: string,
  successUrl: string, 
  cancelUrl: string
): Promise<ApiResponse<CheckoutSessionResponseData>> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { error: { code: 'unauthenticated', message: 'User not logged in' } };
  }

  try {
    const idToken = await currentUser.getIdToken();
    const domain = window.location.origin;
    const functionUrl = `${getFunctionsBaseUrl()}/createCheckoutSession`;

    const response = await axios.post<
      ApiResponse<CheckoutSessionResponseData>
    >(
      functionUrl,
      { 
        data: { // Wrap payload in data object as expected by backend
          roadmapId,
          successUrl: `${domain}${successUrl}`,
          cancelUrl: `${domain}${cancelUrl}`,
        }
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data; // Axios wraps response in its own data property
  } catch (error) {
    console.error('Error creating checkout session via HTTP:', error);
    let message = 'Failed to create checkout session';
    let code = 'internal';
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      message = error.response.data.error.message || message;
      code = error.response.data.error.code || code;
    }
    return {
      error: { code, message }
    };
  }
};

// Function to verify payment status (using axios)
export const verifyRoadmapPayment = async (
  roadmapId: string
): Promise<ApiResponse<PaymentVerificationResponseData>> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { error: { code: 'unauthenticated', message: 'User not logged in' } };
  }

  try {
    const idToken = await currentUser.getIdToken();
    const functionUrl = `${getFunctionsBaseUrl()}/verifyRoadmapPayment`;

    const response = await axios.post<
      ApiResponse<PaymentVerificationResponseData>
    >(
      functionUrl,
      { 
        data: { roadmapId } // Wrap payload
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error verifying payment via HTTP:', error);
    let message = 'Failed to verify payment status';
    let code = 'internal';
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      message = error.response.data.error.message || message;
      code = error.response.data.error.code || code;
    }
    return {
      error: { code, message }
    };
  }
}; 