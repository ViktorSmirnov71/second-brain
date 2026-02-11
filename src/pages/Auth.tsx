import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

type AuthTab = "signin" | "signup";

export function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (tab === "signin") {
        await signIn(email, password);
      } else {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setSubmitting(false);
          return;
        }
        await signUp(email, password);
        toast.success("Check your email to confirm your account");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";

      if (message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (message.includes("Email not confirmed")) {
        toast.error("Please check your email to confirm your account");
      } else if (message.includes("already registered") || message.includes("already been registered")) {
        toast.error("An account with this email already exists");
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-4">
        {/* Header */}
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-pulse-slow">
            <Brain className="h-12 w-12 text-primary" strokeWidth={1.5} />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-page-title text-white/90">Second Brain</h1>
            <p className="text-sm text-white/40">
              Your AI-powered second brain
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-[14px] p-6 space-y-6">
          {/* Tabs */}
          <div className="glass-surface rounded-[10px] p-1 flex">
            <button
              type="button"
              onClick={() => setTab("signin")}
              className={`flex-1 rounded-[8px] py-2 text-sm font-medium transition-all duration-300 ease-apple ${
                tab === "signin"
                  ? "glass-active text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-[8px] py-2 text-sm font-medium transition-all duration-300 ease-apple ${
                tab === "signup"
                  ? "glass-active text-white/90"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/70"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="glass-surface w-full rounded-[10px] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 outline-none focus:ring-1 focus:ring-primary transition-all duration-300 ease-apple"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/70"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  tab === "signup" ? "Min. 6 characters" : "Enter your password"
                }
                minLength={tab === "signup" ? 6 : undefined}
                className="glass-surface w-full rounded-[10px] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 outline-none focus:ring-1 focus:ring-primary transition-all duration-300 ease-apple"
                autoComplete={
                  tab === "signin" ? "current-password" : "new-password"
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[10px] bg-primary py-2.5 text-sm font-medium text-white transition-all duration-300 ease-apple hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : tab === "signin" ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
