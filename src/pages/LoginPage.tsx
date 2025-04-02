import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast'; // Or use Sonner if preferred
import Logo from '@/components/Logo';
import { Loader2 } from 'lucide-react';
import { useRoadmap } from '@/contexts/RoadmapContext'; // Import useRoadmap

// Define validation schema
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }), // Basic check for login
});

// Infer the type from the schema
type LoginFormData = z.infer<typeof loginSchema>;

// Google Icon Component (replace with a proper SVG or library if available)
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px" className="mr-2">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.001-0.001l6.19,5.238C39.718,36.341,44,30.606,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
  </svg>
);

const LoginPage: React.FC = () => {
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserAnswers } = useRoadmap();
  const from = location.state?.from?.pathname || "/";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleLoginSuccess = () => {
    const topicFromStorage = sessionStorage.getItem('topicBeforeLogin');
    if (topicFromStorage) {
      setUserAnswers({
        topic: topicFromStorage,
        existingKnowledge: '',
        background: '',
        pace: '',
        contentPreference: '',
        availableTime: '',
        goal: ''
      });
      sessionStorage.removeItem('topicBeforeLogin');
      navigate('/questions', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  const onEmailSubmit = async (data: LoginFormData) => {
    setIsEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Login Successful" });
      handleLoginSuccess();
    } catch (error: any) {
      console.error("Email login error:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Login Successful" });
      handleLoginSuccess();
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      let errorMessage = "Google Sign-In failed. Please try again.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup closed before completion.";
      }
      toast({
        title: "Google Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="mb-6">
          <Logo size="lg" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome Back!</CardTitle>
          <CardDescription>Log in to continue your learning journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-lwai-deepBlue hover:bg-lwai-deepBlue/90 text-white" disabled={isEmailLoading || isGoogleLoading}>
              {isEmailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log In"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isEmailLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon /> // Use the Google Icon component
            )}
            Google
          </Button>

        </CardContent>
        <CardFooter className="text-center text-sm">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-lwai-deepBlue hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage; 