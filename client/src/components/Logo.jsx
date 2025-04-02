import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Logo({ collapsed = false }) {
  const { isAuthenticated } = useAuth();

  return (
    <Link
      to={isAuthenticated ? "/dashboard" : "/"}
      className="flex items-center hover:opacity-80 transition-opacity"
    >
      <div className="flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
            fill="url(#paint0_linear)"
          />
          <path
            d="M22 12L14 20L10 16"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 8L20 4L24 8L20 12"
            fill="#FF6584"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient
              id="paint0_linear"
              x1="2"
              y1="16"
              x2="30"
              y2="16"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6C63FF" />
              <stop offset="1" stopColor="#4FD1C5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {!collapsed && (
        <div className="ml-2 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-[#6C63FF] to-[#4FD1C5]">
          FlowFocus
        </div>
      )}
    </Link>
  );
}
