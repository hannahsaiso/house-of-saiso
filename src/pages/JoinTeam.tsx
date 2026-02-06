import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface InviteData {
  id: string;
  email: string;
  invited_role: "admin" | "staff" | "client";
  expires_at: string;
}

export default function JoinTeam() {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get("token");
  const token = queryToken || pathToken; // Support both ?token= and /join/:token formats
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [isAlreadyAccepted, setIsAlreadyAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const authRedirect = useMemo(() => {
    const base = "/auth";
    const redirect = token ? `/join?token=${encodeURIComponent(token)}` : "/";
    const email = inviteData?.email ? `&email=${encodeURIComponent(inviteData.email)}` : "";
    return `${base}?redirect=${encodeURIComponent(redirect)}${email}`;
  }, [inviteData?.email, token]);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Invalid invite link");
        setIsLoading(false);
        return;
      }

      try {
        // Public SELECT allowed by RLS
        const { data: invite, error: queryError } = await supabase
          .from("team_invites")
          .select("id, email, invited_role, expires_at, accepted_at")
          .eq("token", token)
          .maybeSingle();

        if (queryError) {
          console.error("Error fetching invite:", queryError);
          setError("Unable to validate invite link");
          setIsLoading(false);
          return;
        }

        if (!invite) {
          setError("This invite link is invalid or has been revoked");
          setIsLoading(false);
          return;
        }

        if (invite.accepted_at) {
          setIsAlreadyAccepted(true);
          setIsLoading(false);
          return;
        }

        if (new Date(invite.expires_at) < new Date()) {
          setIsExpired(true);
          setIsLoading(false);
          return;
        }

        setInviteData({
          id: invite.id,
          email: invite.email,
          invited_role: invite.invited_role,
          expires_at: invite.expires_at,
        });
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // If the user is already authenticated (e.g. after email verification), accept the invite and link role automatically.
  useEffect(() => {
    async function maybeAcceptInvite() {
      if (!inviteData || !token || isExpired || isAlreadyAccepted || error) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setIsAccepting(true);
      try {
        // 1) Mark invite accepted
        const { error: inviteError } = await supabase
          .from("team_invites")
          .update({ accepted_at: new Date().toISOString() })
          .eq("id", inviteData.id);
        if (inviteError) throw inviteError;

        // 2) Activate membership record
        const { error: memberError } = await supabase
          .from("team_members")
          .update({ status: "active", user_id: session.user.id })
          .eq("email", inviteData.email);
        if (memberError) throw memberError;

        // 3) Create user role (policy allows only if role matches invite)
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: session.user.id, role: inviteData.invited_role });
        if (roleError) throw roleError;

        toast.success("Welcome—your access is now active.");
        navigate("/", { replace: true });
      } catch (e: any) {
        console.error("Invite acceptance failed:", e);
        toast.error(e?.message || "Could not complete join. Please sign in again and retry.");
      } finally {
        setIsAccepting(false);
      }
    }

    maybeAcceptInvite();
  }, [inviteData, token, isExpired, isAlreadyAccepted, error, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!inviteData) return;

    setIsSubmitting(true);

    try {
      // Sign up using invited email.
      // NOTE: With email verification enabled, the session is typically null until the user verifies.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/join?token=${encodeURIComponent(token!)}`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes("already registered")) {
          toast.error("An account with this email already exists. Please sign in instead.");
          navigate(authRedirect);
          return;
        }
        throw signUpError;
      }

      // If the platform returns a live session immediately (rare when verification required), we can accept right away.
      if (signUpData.session?.user) {
        toast.success("Account created—finalizing your access...");
        // Let the acceptance effect run on next tick.
        setTimeout(() => void 0, 0);
      } else {
        toast.success("Account created! Please verify your email to activate access.");
      }

      // Keep them in-flow: send to sign-in with redirect back to this invite.
      navigate(authRedirect);
    } catch (err: any) {
      console.error("Error creating account:", err);
      toast.error(err.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 p-4">
      <div className="mx-auto w-full max-w-md space-y-6 pt-10">
        {/* Brand mark */}
        <header className="text-center space-y-2">
          <div className="mx-auto inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 ring-1 ring-border/60">
            <span className="text-2xl font-heading font-bold text-primary">HS</span>
          </div>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">House of Saiso</h1>
            <p className="text-muted-foreground text-sm">Private access portal</p>
          </div>
        </header>

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isExpired && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Invite Expired</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This invite link has expired. Please ask your administrator to send a new invite.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isAlreadyAccepted && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Already Joined</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This invite has already been accepted. You can sign in to your account.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate(authRedirect)} className="w-full mt-4">
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {inviteData && !error && !isExpired && !isAlreadyAccepted && (
          <Card className="overflow-hidden">
            <CardHeader className="text-center">
              <CardTitle className="font-heading flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create your House of Saiso account
              </CardTitle>
              <CardDescription>
                You’ve been invited to join as{" "}
                <span className="font-medium capitalize text-foreground">{inviteData.invited_role}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAccepting ? (
                <div className="py-10 text-center space-y-3">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Finalizing your access…</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={inviteData.email} disabled className="bg-muted" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account…
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Create Account
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    After creating your account, you’ll verify your email and be redirected back here to activate your
                    role automatically.
                  </p>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(authRedirect)}
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
