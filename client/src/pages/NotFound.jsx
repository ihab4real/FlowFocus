import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="mb-8">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M60 10C32.386 10 10 32.386 10 60C10 87.614 32.386 110 60 110C87.614 110 110 87.614 110 60C110 32.386 87.614 10 60 10Z"
            fill="url(#paint0_linear)"
            opacity="0.2"
          />
          <path
            d="M60 20L75 5L90 20L75 35"
            fill="#FF6584"
            stroke="#6C63FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M60 20C60 20 40 40 30 50C20 60 20 80 20 80"
            stroke="#6C63FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
          <path
            d="M85 75L60 100L35 75"
            stroke="#6C63FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="10"
              y1="60"
              x2="110"
              y2="60"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6C63FF" />
              <stop offset="1" stopColor="#4FD1C5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h1 className="text-4xl font-bold mb-2">Oops! Rocket off course</h1>
      <p className="text-xl text-muted-foreground mb-8">
        The page you're looking for can't be found.
      </p>
      <Button asChild className="bg-[#6C63FF] hover:bg-[#6C63FF]/90">
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}

export default NotFound;
