import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
 import { GoogleWorkspaceCard } from "@/components/settings/GoogleWorkspaceCard";

export default function ProfileSettings() {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const { role } = useUserRole();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  // Initialize form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
      });
    }
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar.mutateAsync(file);
    }
  };

  const handleSave = async () => {
    await updateProfile.mutateAsync(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Profile Settings
        </h1>
        <p className="mt-2 text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile?.full_name?.split(" ").map(n => n[0]).join("") || profile?.email?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarClick}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <p className="font-medium">{profile?.full_name || "Your Name"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {role || "Member"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergency_name">Contact Name</Label>
              <Input
                id="emergency_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                placeholder="Emergency contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_phone">Contact Phone</Label>
              <Input
                id="emergency_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

       {/* Connected Services - Google Workspace */}
       <Card>
         <CardHeader>
           <CardTitle className="text-lg">Connected Services</CardTitle>
         </CardHeader>
         <CardContent className="p-0">
           <GoogleWorkspaceCard />
         </CardContent>
       </Card>
 
       <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfile.isPending} className="gap-2">
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
}
