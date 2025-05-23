import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";

/**
 * Component to display reset token validation errors
 * @param {Object} props - Component props
 * @param {string} props.error - Error message to display
 * @returns {JSX.Element} - Token error component
 */
export default function ResetTokenError({ error }) {
  const isExpiredToken = error?.toLowerCase().includes("expired");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-xl font-bold text-center">
            {isExpiredToken ? "Link Expired" : "Invalid Link"}
          </CardTitle>
        </div>
        <CardDescription className="text-center">
          {isExpiredToken
            ? "This password reset link has expired"
            : "This password reset link is not valid"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          <p className="font-medium">
            {isExpiredToken ? "Security Timeout" : "Invalid Reset Link"}
          </p>
          <p className="mt-1">
            {isExpiredToken
              ? "For your security, password reset links expire after 10 minutes. Please request a new one to continue."
              : "This link may have been used already or is malformed. Please request a new password reset."}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Link to="/forgot-password" className="w-full">
          <Button className="w-full bg-primary hover:bg-primary/90">
            Request New Reset Link
          </Button>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}
