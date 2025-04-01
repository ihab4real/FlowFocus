import React from "react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="relative">
        <svg className="animate-spin h-12 w-12" viewBox="0 0 24 24">
          <path
            className="opacity-20"
            fill="#6C63FF"
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
          />
          <path
            className="opacity-100"
            fill="#4FD1C5"
            d="M12 2v4c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H2c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2z"
          />
        </svg>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 2L8 0L10 2L8 4"
              fill="#FF6584"
              stroke="white"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
