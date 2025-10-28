"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // If auth is disabled, redirect to dashboard
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleDevLogin = () => {
    // For development, just redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Sign In</CardTitle>
          <CardDescription>
            Access your MLOps Finance dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' ? (
            <Button 
              onClick={handleDevLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Continue to Dashboard (Dev Mode)
            </Button>
          ) : (
            <div className="text-center text-gray-600">
              <p>Google OAuth not configured.</p>
              <p className="text-sm mt-2">Please set up Google OAuth credentials in your environment variables.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}