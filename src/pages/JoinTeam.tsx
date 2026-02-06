import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
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

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError("Invalid invite link");
        setIsLoading(false);
        return;
      }

      try {
        // Query invite by token - this is a public query allowed by RLS
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
      // 1. Sign up the user with the invited email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteData.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes("already registered")) {
          toast.error("An account with this email already exists. Please sign in instead.");
          navigate("/auth");
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error("Failed to create account");
      }

      // 2. Mark invite as accepted (this will be done by the user after email verification)
      // For now, we'll update team_members status
      const { error: memberError } = await supabase
        .from("team_members")
        .update({ 
          status: "active",
          user_id: signUpData.user.id 
        })
        .eq("email", inviteData.email);

      if (memberError) {
        console.error("Error updating team member:", memberError);
      }

      // 3. Update the invite as accepted
      await supabase
        .from("team_invites")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", inviteData.id);

      // 4. Create user role
      await supabase
        .from("user_roles")
        .insert({
          user_id: signUpData.user.id,
          role: inviteData.invited_role,
        });

      toast.success("Account created! Please check your email to verify your account.");
      navigate("/auth");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <span className="text-2xl font-heading font-bold text-primary">HS</span>
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            House of Saiso
          </h1>
          <p className="text-muted-foreground text-sm">
            Creative Studio Management
          </p>
        </div>

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
              <Button onClick={() => navigate("/auth")} className="w-full mt-4">
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {inviteData && !error && !isExpired && !isAlreadyAccepted && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-heading">Welcome to the Team!</CardTitle>
              <CardDescription>
                You've been invited to join as{" "}
                <span className="font-medium capitalize text-foreground">
                  {inviteData.invited_role}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    disabled
                    className="bg-muted"
                  />
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
                      Creating Account...
                    </>
                  ) : (
                    "Create Account & Join"
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Already have an account?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
                  Sign in
                </Button>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
