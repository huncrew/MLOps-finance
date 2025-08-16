"use client";

import { useState } from "react";
import Image from "next/image";

interface LogoImageProps {
  company: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

// Direct logo URLs for financial companies - using reliable CDN sources
const logoMap: Record<string, string> = {
  "goldman-sachs": "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/goldmansachs.svg",
  "jpmorgan": "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/jpmorgan.svg",
  "morgan-stanley": "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/morganstanley.svg", 
  "blackrock": "https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/blackrock.svg",
  "vanguard": "https://vectorwiki.com/images/thumb/b/b8/Vanguard_%28company%29.svg/1200px-Vanguard_%28company%29.svg.png",
  "fidelity": "https://logos-world.net/wp-content/uploads/2021/02/Fidelity-Logo.png"
};

export function LogoImage({ 
  company, 
  alt, 
  className = "", 
  fallbackText
}: LogoImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const logoUrl = logoMap[company];
  
  if (hasError || !logoUrl) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-gray-500 font-medium text-sm">
          {fallbackText || alt}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={logoUrl}
        alt={alt}
        width={120}
        height={40}
        className={`transition-opacity duration-300 object-contain ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        unoptimized
      />
    </div>
  );
}