import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
export default function SettingsPage() {
  const [orgName, setOrgName] = useState("My Awesome Company");
  const [isSaving, setIsSaving] = useState(false);
  const handleSaveChanges = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!");
    }, 1500);
  };
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your organization's settings and preferences.</p>
        </div>
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your organization's name and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-logo">Organization Logo</Label>
                <Input id="org-logo" type="file" />
                <p className="text-sm text-muted-foreground">Upload a PNG or JPG file (max 2MB).</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage security settings for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-muted-foreground">Require 2FA for all administrators to enhance security.</p>
                </div>
                <Button variant="outline" onClick={() => toast.info("This feature is coming soon!")}>Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}