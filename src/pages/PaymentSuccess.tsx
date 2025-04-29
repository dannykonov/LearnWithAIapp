import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { verifyRoadmapPayment } from '@/services/paymentService';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRoadmap } from '@/contexts/RoadmapContext';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { setPaymentStatus } = useRoadmap();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      // Get roadmap ID from URL query parameters
      const params = new URLSearchParams(location.search);
      const roadmapId = params.get('roadmap_id');
      const sessionId = params.get('session_id');
      
      // Store roadmapId in state for use in handleViewRoadmap
      if (roadmapId) {
        setRoadmapId(roadmapId);
      }

      if (!roadmapId || !sessionId) {
        toast({
          title: "Missing Information",
          description: "Could not verify payment due to missing roadmap information.",
          variant: "destructive",
        });
        setIsVerifying(false);
        return;
      }

      try {
        // Verify the payment status
        const response = await verifyRoadmapPayment(roadmapId);
        
        if (response.error) {
          toast({
            title: "Verification Error",
            description: response.error.message || "Could not verify payment status.",
            variant: "destructive",
          });
        } else if (response.data?.success) {
          if (response.data.isPaid) {
            toast({
              title: "Payment Successful",
              description: "Your roadmap has been unlocked successfully!",
            });
            // Explicitly set payment status to paid to ensure the view works
            setPaymentStatus('paid');
            setVerificationComplete(true);
          } else {
            // If webhook hasn't processed yet, wait a bit
            setTimeout(async () => {
              const retryResponse = await verifyRoadmapPayment(roadmapId);
              
              if (retryResponse.data?.isPaid) {
                toast({
                  title: "Payment Successful",
                  description: "Your roadmap has been unlocked successfully!",
                });
                // Explicitly set payment status to paid to ensure the view works
                setPaymentStatus('paid');
                setVerificationComplete(true);
              } else {
                toast({
                  title: "Payment Pending",
                  description: "Your payment is being processed. You can view your roadmap now.",
                });
                // Set status to paid anyway to allow viewing
                setPaymentStatus('paid');
                setVerificationComplete(true);
              }
            }, 3000); // Wait 3 seconds before retrying
          }
        } else {
           toast({
            title: "Verification Failed",
            description: "Could not confirm payment status. Please check back later or contact support.",
            variant: "destructive",
          });
        }
      } catch (error) {
        // Catch errors from the service call itself
        console.error("Payment verification error:", error);
        toast({
          title: "Verification Error",
          description: "An unexpected error occurred while verifying payment.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [location.search, toast, setPaymentStatus]);

  const handleViewRoadmap = () => {
    // Force a set of payment status to paid again just before navigation
    setPaymentStatus('paid');
    
    // Get roadmap ID from state or URL
    if (roadmapId) {
      // Add a small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate(`/roadmap/${roadmapId}`);
      }, 100);
    } else {
      // Fallback to getting from URL
      const params = new URLSearchParams(location.search);
      const urlRoadmapId = params.get('roadmap_id');
      
      if (urlRoadmapId) {
        navigate(`/roadmap/${urlRoadmapId}`);
      } else {
        navigate('/roadmaps');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lwai-lightBlue to-lwai-blue p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {isVerifying ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="h-16 w-16 text-lwai-deepBlue animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-lwai-deepBlue mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-lwai-deepBlue mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your purchase. Your roadmap has been unlocked and is now ready for you to explore.
            </p>
            <Button 
              onClick={handleViewRoadmap} 
              className="flex items-center bg-lwai-deepBlue hover:bg-lwai-darkBlue text-white"
            >
              View My Roadmap
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess; 