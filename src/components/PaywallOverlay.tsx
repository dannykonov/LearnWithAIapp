import React from 'react';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/services/paymentService';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LockIcon } from 'lucide-react';

interface PaywallOverlayProps {
  roadmapId: string;
  topic: string;
}

const PaywallOverlay: React.FC<PaywallOverlayProps> = ({ roadmapId, topic }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Create a checkout session
      const response = await createCheckoutSession(
        roadmapId,
        `/payment-success`,
        `/roadmap/${roadmapId}`
      );

      // Check for errors first
      if (response.error) {
        toast({
          title: "Payment Error",
          description: response.error.message || "Could not initiate payment process",
          variant: "destructive",
        });
        setIsLoading(false);
      } else if (response.data?.success && response.data?.url) {
        // Check if already paid (handled by backend, but good practice)
        if (response.data.paymentStatus === 'paid') {
           toast({
            title: "Already Paid",
            description: "This roadmap has already been paid for.",
           });
           // Optionally refresh page or context state here
           setIsLoading(false);
        } else {
          // Redirect to Stripe Checkout
          window.location.href = response.data.url;
          // Don't setIsLoading(false) here as we are navigating away
        }
      } else {
        // Handle unexpected success=false or missing URL
        toast({
          title: "Payment Error",
          description: response.data?.message || "Could not initiate payment process. Unexpected response.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      // Catch errors from the service call itself (e.g., network errors)
      console.error("Payment initiation error:", error);
      toast({
        title: "Payment Error",
        description: "Failed to start payment process. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="paywall-overlay">
      <div className="paywall-content">
        <div className="paywall-icon">
          <LockIcon size={48} className="text-lwai-deepBlue" />
        </div>
        <h2 className="paywall-title">Unlock Your Learning Roadmap</h2>
        <p className="paywall-description">
          Your personalized roadmap for <strong>{topic}</strong> is ready!
        </p>
        <p className="paywall-price">
          Pay just <strong>$0.49</strong> to access your complete roadmap
          with step-by-step guidance and curated resources.
        </p>
        <Button 
          onClick={handlePayment} 
          disabled={isLoading} 
          className="paywall-button"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>Unlock for $0.49</>
          )}
        </Button>
        <p className="paywall-secure">
          🔒 Secure payment via Stripe
        </p>
      </div>
    </div>
  );
};

export default PaywallOverlay; 