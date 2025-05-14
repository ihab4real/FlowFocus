import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/authentication/hooks/useAuth";
import { authService } from "@/features/authentication/services/authService";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  // const navigate = useNavigate();

  // Profile update state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    password: "",
    passwordConfirm: "",
  });

  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Handle profile form input changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!profileData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!profileData.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(profileData.email)) {
      errors.email = "Please enter a valid email address";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.password) {
      errors.password = "New password is required";
    } else if (passwordData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (passwordData.password !== passwordData.passwordConfirm) {
      errors.passwordConfirm = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdateSuccess(false);

    if (!validateProfileForm()) return;

    try {
      setIsUpdating(true);
      await authService.updateProfile({
        name: profileData.name,
        email: profileData.email,
      });
      setUpdateSuccess(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      setProfileErrors({ form: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess(false);

    if (!validatePasswordForm()) return;

    try {
      setIsChangingPassword(true);
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        password: passwordData.password,
        passwordConfirm: passwordData.passwordConfirm,
      });

      // Reset password form
      setPasswordData({
        currentPassword: "",
        password: "",
        passwordConfirm: "",
      });

      setPasswordSuccess(true);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      setPasswordErrors({ form: errorMessage });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <DashboardHeader />
        <div className="container max-w-4xl py-10">
          <Button variant="ghost" className="mb-6" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

          <div className="grid gap-8 md:grid-cols-1">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileSubmit}>
                <CardContent className="space-y-4">
                  {profileErrors.form && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {profileErrors.form}
                    </div>
                  )}

                  {updateSuccess && (
                    <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
                      Profile updated successfully!
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                      className={profileErrors.name ? "border-destructive" : ""}
                    />
                    {profileErrors.name && (
                      <p className="text-destructive text-xs mt-1">
                        {profileErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                      className={
                        profileErrors.email ? "border-destructive" : ""
                      }
                    />
                    {profileErrors.email && (
                      <p className="text-destructive text-xs mt-1">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="space-y-4">
                  {passwordErrors.form && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {passwordErrors.form}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
                      Password changed successfully!
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="currentPassword"
                      className="text-sm font-medium"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        className={
                          passwordErrors.currentPassword
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-destructive text-xs mt-1">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.password}
                        onChange={handlePasswordChange}
                        required
                        className={
                          passwordErrors.password
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.password && (
                      <p className="text-destructive text-xs mt-1">
                        {passwordErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="passwordConfirm"
                      className="text-sm font-medium"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Input
                        id="passwordConfirm"
                        name="passwordConfirm"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.passwordConfirm}
                        onChange={handlePasswordChange}
                        required
                        className={
                          passwordErrors.passwordConfirm
                            ? "border-destructive pr-10"
                            : "pr-10"
                        }
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.passwordConfirm && (
                      <p className="text-destructive text-xs mt-1">
                        {passwordErrors.passwordConfirm}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword
                      ? "Changing Password..."
                      : "Change Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <div className="fixed bottom-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
