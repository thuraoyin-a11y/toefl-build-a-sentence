"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      // Update user store with logged in user
      setUser({
        id: data.user.userId,
        name: data.user.email.split("@")[0],
        role: data.user.role === "TEACHER" ? "teacher" : "student",
      });

      // Redirect based on role
      if (data.user.role === "TEACHER") {
        router.push("/teacher");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-48px)] bg-apple-gray flex items-center justify-center px-4">
      <Container size="sm">
        {/* Apple-style Hero Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-20 w-20 rounded-apple-xl bg-apple-blue flex items-center justify-center mb-6 apple-card-shadow">
            <BookOpen className="h-10 w-10 text-white" />
          </div>
          <h1 className="apple-display-section text-center">
            TOEFL Sentence Builder
          </h1>
          <p className="text-body text-apple-text-secondary mt-2 text-center">
            Sign in to continue
          </p>
        </div>

        {/* Apple-style Card */}
        <Card variant="outlined" padding="lg" className="bg-white">
          <CardHeader className="text-center">
            <CardTitle className="text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-caption text-apple-text mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-3 bg-apple-gray border-0 rounded-apple text-body text-apple-text placeholder:text-apple-text-tertiary focus:outline-none focus:ring-2 focus:ring-apple-blue"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-caption text-apple-text mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-3 bg-apple-gray border-0 rounded-apple text-body text-apple-text placeholder:text-apple-text-tertiary focus:outline-none focus:ring-2 focus:ring-apple-blue pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-text-tertiary hover:text-apple-text transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-apple-gray rounded-apple text-caption text-red-600">
                  {error}
                </div>
              )}

              {/* Submit Button - Apple Primary CTA */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Demo Accounts - Apple-style micro text */}
            <div className="mt-8 pt-6 border-t border-apple-border">
              <p className="text-micro text-apple-text-tertiary text-center">
                Demo accounts
              </p>
              <div className="mt-3 space-y-1 text-micro text-apple-text-tertiary text-center">
                <p>teacher@example.com / password123</p>
                <p>alex@example.com / password123</p>
                <p>sam@example.com / password123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
