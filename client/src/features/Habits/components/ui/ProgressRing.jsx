import React from "react";
import { hexToRgba } from "../../utils/habitUtils";

const ProgressRing = ({
  progress = 0,
  size = 80,
  strokeWidth = 8,
  color = "#6C63FF",
  showPercentage = true,
  className = "",
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const progressColor = color;
  const backgroundColor = hexToRgba(color, 0.1);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-300"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="transition-all duration-300"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{
            filter:
              progress > 0
                ? `drop-shadow(0 0 6px ${hexToRgba(color, 0.4)})`
                : "none",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ||
          (showPercentage && (
            <span
              className="text-sm font-semibold transition-colors duration-300"
              style={{ color: progress > 0 ? progressColor : "#9CA3AF" }}
            >
              {Math.round(progress)}%
            </span>
          ))}
      </div>
    </div>
  );
};

export default ProgressRing;
