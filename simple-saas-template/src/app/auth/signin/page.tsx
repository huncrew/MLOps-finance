"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Sign in</CardTitle>
        <CardDescription className="text-center">
          Sign in with your Google account to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleGoogleSignIn} 
          className="w-full" 
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? "Signing in..." : "Continue with Google"}
        </Button>
      </CardContent>
    </Card>
  );
}