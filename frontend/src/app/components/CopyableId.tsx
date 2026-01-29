"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableIdProps {
  id: string | null | undefined;
  maxLength?: number;
  onCopy?: (id: string) => void;
  className?: string;
}

const CopyableId: React.FC<CopyableIdProps> = ({
  id,
  maxLength = 8,
  onCopy,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);

  if (!id) {
    return <span className={className}>-</span>;
  }

  const truncatedId =
    id.length > maxLength ? `${id.substring(0, maxLength)}...` : id;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      if (onCopy) {
        onCopy(id);
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-sm font-mono transition-colors group ${className}`}
      title={`Click to copy: ${id}`}
    >
      <span className="truncate">{truncatedId}</span>
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" />
      )}
    </button>
  );
};

export default CopyableId;
