export function Logo({ className = "", size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circular background */}
      <circle cx="50" cy="50" r="48" fill="#2c7a7b" />

      {/* Car silhouette */}
      <path
        d="M25 55 L30 45 L35 40 L45 38 L55 38 L65 40 L70 45 L75 55 Z"
        fill="white"
        opacity="0.9"
      />

      {/* Car windows */}
      <path d="M38 42 L42 40 L58 40 L62 42 L60 48 L40 48 Z" fill="#2c7a7b" />

      {/* Wheels */}
      <circle cx="35" cy="58" r="6" fill="white" />
      <circle cx="35" cy="58" r="3" fill="#2c7a7b" />
      <circle cx="65" cy="58" r="6" fill="white" />
      <circle cx="65" cy="58" r="3" fill="#2c7a7b" />

      {/* Search lens effect - magnifying glass */}
      <circle
        cx="70"
        cy="30"
        r="10"
        stroke="white"
        strokeWidth="3"
        fill="none"
      />
      <line
        x1="77"
        y1="37"
        x2="85"
        y2="45"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoWithText({ className = "", size = 32, showText = true }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900 leading-none">DriveScout</span>
          <span className="text-xs text-gray-500 leading-none">Find Your Perfect Ride</span>
        </div>
      )}
    </div>
  );
}
