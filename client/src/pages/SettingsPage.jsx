import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuthStore } from "@/features/authentication/store/authStore";
import usePomodoroStore from "@/stores/pomodoroStore";
import useSettingsStore from "@/stores/settingsStore";
import { useUpdatePomodoroSettings } from "@/features/Pomodoro/hooks/usePomodoroQueries";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Palette,
  Timer,
  Bell,
  Shield,
  Info,
  Save,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile } = useAuthStore();
  const { settings, isLoadingSettings } = usePomodoroStore();
  const updatePomodoroSettingsMutation = useUpdatePomodoroSettings();
  const {
    notifications,
    updateNotifications,
    requestNotificationPermission,
    canShowNotifications,
  } = useSettingsStore();

  // Local state for form data
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [pomodoroData, setPomodoroData] = useState({
    focusDuration: settings?.focusDuration || 25,
    shortBreakDuration: settings?.shortBreakDuration || 5,
    longBreakDuration: settings?.longBreakDuration || 15,
    longBreakInterval: settings?.longBreakInterval || 4,
    autoStartBreaks: settings?.autoStartBreaks || true,
    autoStartPomodoros: settings?.autoStartPomodoros || false,
    soundEnabled: settings?.soundEnabled || true,
    soundVolume: settings?.soundVolume || 80,
  });

  const [notificationSettings, setNotificationSettings] =
    useState(notifications);

  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Sync notification settings with store when store updates
  useEffect(() => {
    setNotificationSettings(notifications);
  }, [notifications]);

  // Sync pomodoro settings with store when store updates
  useEffect(() => {
    setPomodoroData({
      focusDuration: settings?.focusDuration || 25,
      shortBreakDuration: settings?.shortBreakDuration || 5,
      longBreakDuration: settings?.longBreakDuration || 15,
      longBreakInterval: settings?.longBreakInterval || 4,
      autoStartBreaks: settings?.autoStartBreaks || true,
      autoStartPomodoros: settings?.autoStartPomodoros || false,
      soundEnabled: settings?.soundEnabled || true,
      soundVolume: settings?.soundVolume || 80,
    });
  }, [settings]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: profileData.name,
      };

      // Add password change if provided
      if (profileData.newPassword) {
        // Validate current password
        if (!profileData.currentPassword) {
          toast.error("Current password is required");
          return;
        }

        // Validate password strength
        if (profileData.newPassword.length < 8) {
          toast.error("Password must be at least 8 characters long");
          return;
        }

        // Validate password match
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }

        updateData.currentPassword = profileData.currentPassword;
        updateData.password = profileData.newPassword;
        updateData.passwordConfirm = profileData.confirmPassword;
      }

      const result = await updateProfile(updateData);
      if (result.success) {
        toast.success("Profile updated successfully");
        setProfileData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Handle pomodoro settings update
  const handlePomodoroUpdate = async () => {
    setLoading(true);
    try {
      await updatePomodoroSettingsMutation.mutateAsync(pomodoroData);
      toast.success("Pomodoro settings updated successfully");
    } catch (error) {
      console.error("Failed to update Pomodoro settings", error);
      toast.error("Failed to update Pomodoro settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle data export
  const handleDataExport = () => {
    const userData = {
      profile: {
        name: user?.name,
        email: user?.email,
        createdAt: user?.createdAt,
      },
      settings: {
        theme: theme,
        pomodoro: pomodoroData,
        notifications: notificationSettings,
      },
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `flowfocus-data-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    // Cleanup URL after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);
    toast.success("Data exported successfully");
  };

  // Handle notification settings update
  const handleNotificationsUpdate = async () => {
    try {
      updateNotifications(notificationSettings);

      // Request permission if needed and notifications are enabled
      const hasNotifications =
        Object.values(notificationSettings).some(Boolean);
      if (hasNotifications && !canShowNotifications()) {
        const granted = await requestNotificationPermission();
        if (granted) {
          toast.success("Notification settings updated and permission granted");
        } else {
          toast.success(
            "Notification settings updated (permission required for browser notifications)"
          );
        }
      } else {
        toast.success("Notification settings updated successfully");
      }
    } catch (error) {
      console.error("Failed to update notification settings", error);
      toast.error("Failed to update notification settings");
    }
  };

  // Handle account deletion
  const handleAccountDeletion = () => {
    // This would typically call an API endpoint to delete the account
    toast.error("Account deletion not implemented yet");
    setDeleteDialogOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />

        <div className="p-4 md:p-6 pt-20 md:pt-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Customize your FlowFocus experience
            </p>
          </div>

          <Tabs defaultValue="account" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Theme</span>
              </TabsTrigger>
              <TabsTrigger value="pomodoro" className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="hidden sm:inline">Pomodoro</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">About</span>
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details and password
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={profileData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed for security reasons
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={profileData.currentPassword}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={profileData.newPassword}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={profileData.confirmPassword}
                          onChange={(e) =>
                            setProfileData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="w-full md:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Theme Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of FlowFocus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Theme</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card
                        className={`cursor-pointer border-2 ${theme === "light" ? "border-primary" : "border-border"}`}
                        onClick={() => setTheme("light")}
                      >
                        <CardContent className="p-4 text-center">
                          <Sun className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                          <p className="font-medium">Light</p>
                          <p className="text-xs text-muted-foreground">
                            Clean and bright
                          </p>
                        </CardContent>
                      </Card>
                      <Card
                        className={`cursor-pointer border-2 ${theme === "dark" ? "border-primary" : "border-border"}`}
                        onClick={() => setTheme("dark")}
                      >
                        <CardContent className="p-4 text-center">
                          <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <p className="font-medium">Dark</p>
                          <p className="text-xs text-muted-foreground">
                            Easy on the eyes
                          </p>
                        </CardContent>
                      </Card>
                      <Card
                        className={`cursor-pointer border-2 ${theme === "system" ? "border-primary" : "border-border"}`}
                        onClick={() => setTheme("system")}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex mx-auto mb-2 w-8 h-8 items-center justify-center">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            <Moon className="h-4 w-4 text-blue-500" />
                          </div>
                          <p className="font-medium">System</p>
                          <p className="text-xs text-muted-foreground">
                            Follow device
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Theme changes are applied instantly and saved
                      automatically.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pomodoro Settings */}
            <TabsContent value="pomodoro" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pomodoro Timer</CardTitle>
                  <CardDescription>
                    Configure your focus and break durations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>
                          Focus Duration: {pomodoroData.focusDuration} minutes
                        </Label>
                        <Slider
                          value={[pomodoroData.focusDuration]}
                          onValueChange={(value) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              focusDuration: value[0],
                            }))
                          }
                          max={120}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Short Break: {pomodoroData.shortBreakDuration} minutes
                        </Label>
                        <Slider
                          value={[pomodoroData.shortBreakDuration]}
                          onValueChange={(value) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              shortBreakDuration: value[0],
                            }))
                          }
                          max={30}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Long Break: {pomodoroData.longBreakDuration} minutes
                        </Label>
                        <Slider
                          value={[pomodoroData.longBreakDuration]}
                          onValueChange={(value) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              longBreakDuration: value[0],
                            }))
                          }
                          max={60}
                          min={5}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Sessions until Long Break:{" "}
                          {pomodoroData.longBreakInterval}
                        </Label>
                        <Slider
                          value={[pomodoroData.longBreakInterval]}
                          onValueChange={(value) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              longBreakInterval: value[0],
                            }))
                          }
                          max={10}
                          min={2}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-start Breaks</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically start break timers
                          </p>
                        </div>
                        <Switch
                          checked={pomodoroData.autoStartBreaks}
                          onCheckedChange={(checked) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              autoStartBreaks: checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-start Pomodoros</Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically start focus sessions
                          </p>
                        </div>
                        <Switch
                          checked={pomodoroData.autoStartPomodoros}
                          onCheckedChange={(checked) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              autoStartPomodoros: checked,
                            }))
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 flex items-center gap-2">
                          {pomodoroData.soundEnabled ? (
                            <Volume2 className="h-4 w-4" />
                          ) : (
                            <VolumeX className="h-4 w-4" />
                          )}
                          <div>
                            <Label>Sound Notifications</Label>
                            <p className="text-xs text-muted-foreground">
                              Play sound when timer completes
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={pomodoroData.soundEnabled}
                          onCheckedChange={(checked) =>
                            setPomodoroData((prev) => ({
                              ...prev,
                              soundEnabled: checked,
                            }))
                          }
                        />
                      </div>

                      {pomodoroData.soundEnabled && (
                        <div className="space-y-2">
                          <Label>
                            Sound Volume: {pomodoroData.soundVolume}%
                          </Label>
                          <Slider
                            value={[pomodoroData.soundVolume]}
                            onValueChange={(value) =>
                              setPomodoroData((prev) => ({
                                ...prev,
                                soundVolume: value[0],
                              }))
                            }
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handlePomodoroUpdate}
                    disabled={loading || isLoadingSettings}
                    className="w-full md:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? "Saving..." : "Save Pomodoro Settings"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Control when and how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified about upcoming task deadlines
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.taskReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          taskReminders: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pomodoro Completion</Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when focus sessions complete
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pomodoroComplete}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          pomodoroComplete: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Habit Reminders</Label>
                      <p className="text-xs text-muted-foreground">
                        Daily reminders for your habits
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.habitReminders}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          habitReminders: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive weekly productivity summaries
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  <Alert>
                    <Bell className="h-4 w-4" />
                    <AlertDescription>
                      Browser notifications require permission. Click "Allow"
                      when prompted.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleNotificationsUpdate}
                    className="w-full md:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Notification Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy & Data */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>
                    Manage your data and account privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your FlowFocus data including tasks, notes,
                      habits, and settings in JSON format.
                    </p>
                    <Button onClick={handleDataExport} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export My Data
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-destructive">
                      Danger Zone
                    </h4>
                    <div className="border border-destructive/20 rounded-lg p-4 space-y-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-destructive">
                          Delete Account
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete your account and all associated
                          data. This action cannot be undone.
                        </p>
                      </div>

                      <Dialog
                        open={deleteDialogOpen}
                        onOpenChange={setDeleteDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Delete Account
                            </DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete your account and remove all
                              your data from our servers.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="my-4">
                            <Alert>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                All your tasks, notes, habits, and settings will
                                be permanently lost.
                              </AlertDescription>
                            </Alert>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setDeleteDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleAccountDeletion}
                            >
                              Delete Account
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* About */}
            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About FlowFocus</CardTitle>
                  <CardDescription>
                    Information about the application and development
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">Version</h4>
                        <p className="text-sm text-muted-foreground">
                          1.0.0 Beta
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">React</Badge>
                          <Badge variant="secondary">Node.js</Badge>
                          <Badge variant="secondary">MongoDB</Badge>
                          <Badge variant="secondary">Tailwind CSS</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Features</h4>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>• Task Management</li>
                          <li>• Rich Text Notes</li>
                          <li>• Pomodoro Timer</li>
                          <li>• Habit Tracking</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium">Developer</h4>
                        <p className="text-sm text-muted-foreground">
                          Built with ❤️ for productivity enthusiasts
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">License</h4>
                        <p className="text-sm text-muted-foreground">
                          MIT License
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium">Support</h4>
                        <p className="text-sm text-muted-foreground">
                          For support or feature requests, please contact us.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      © {new Date().getFullYear()} FlowFocus. All rights
                      reserved.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
