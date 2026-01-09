import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { apiFetch } from '@/lib/api-client';
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function SignInPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace((router.query.redirect as string) || "/");
    }
  }, [user, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Ensure user record exists in database (fallback if trigger didn't fire)
        try {
          const response = await apiFetch("/api/users/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,

            }),
          });

          if (!response.ok) {
            // Non-critical - user can still sign in, just log the error
            console.warn("Failed to ensure user record exists");
          }
        } catch (err) {
          // Non-critical - user can still sign in
          console.warn("Error ensuring user record exists:", err);
        }

        toast.success("Signed in successfully!");
        const redirect = router.query.redirect as string;
        router.push(redirect || "/");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,

      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        // Create user record in database
        try {
          const response = await apiFetch("/api/users/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              email: data.user.email,

            }),
          });

          if (!response.ok) {
            console.error("Failed to create user record");
          }
        } catch (err) {
          console.error("Error creating user record:", err);
        }

        toast.success("Account created! Please check your email to verify.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign up";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In / Sign Up</CardTitle>
          <CardDescription>
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                onClick={handleSignIn}
                disabled={loading}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignUp}
                disabled={loading}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

