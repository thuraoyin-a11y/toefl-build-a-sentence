"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/**
 * SentenceBuilder props
 */
interface SentenceBuilderProps {
  context: string; // Context sentence with blank placeholder
  selectedWords: string[];
  onRemoveWord: (index: number) => void;
  className?: string;
}

/**
 * SentenceBuilder component
 * Displays the context sentence with a blank area
 * Shows selected words in sequence, each removable
 * Apple-style: Clean, spacious, subtle interactions
 */
export function SentenceBuilder({
  context,
  selectedWords,
  onRemoveWord,
  className,
}: SentenceBuilderProps) {
  // Split context to find the blank part (marked with _______ or similar)
  const parts = context.split("_______");

  return (
    <div className={cn("space-y-6", className)}>
      {/* Context sentence with blank */}
      <div className="text-lg leading-relaxed text-apple-text">
        {parts.length === 2 ? (
          <>
            <span>{parts[0]}</span>
            {/* The blank area */}
            <span className="inline-flex min-h-[40px] min-w-[120px] items-center justify-center mx-1 px-3 py-1 rounded-apple border-2 border-dashed border-apple-border bg-apple-gray/50">
              <span className="text-apple-text-secondary text-sm">...</span>
            </span>
            <span>{parts[1]}</span>
          </>
        ) : (
          <span>{context}</span>
        )}
      </div>

      {/* Selected words area */}
      <div className="bg-apple-gray/30 rounded-apple-xl p-6 min-h-[80px]">
        <p className="text-xs font-medium text-apple-text-secondary uppercase tracking-wide mb-3">
          Your sentence
        </p>
        {selectedWords.length === 0 ? (
          <p className="text-apple-text-secondary/60 text-sm italic">
            Click words below to build your sentence...
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedWords.map((word, index) => (
              <button
                key={`${word}-${index}`}
                onClick={() => onRemoveWord(index)}
                className="group inline-flex items-center gap-1.5 px-3 py-2 bg-white rounded-apple-lg shadow-apple-sm border border-apple-border hover:border-red-300 hover:bg-red-50 transition-all duration-200"
              >
                <span className="text-apple-text font-medium">{word}</span>
                <X className="h-3.5 w-3.5 text-apple-text-secondary group-hover:text-red-500 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
