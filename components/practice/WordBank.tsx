"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

/**
 * WordBank props
 */
interface WordBankProps {
  words: string[];
  usedWords: string[]; // Words already selected (for disabling)
  onSelectWord: (word: string) => void;
  className?: string;
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * WordBank component
 * Grid of available words to select from
 * Words are shuffled on each render to ensure random order
 * Used words are visually distinct but remain visible
 * Apple-style: Subtle buttons, light borders, responsive grid
 */
export function WordBank({
  words,
  usedWords,
  onSelectWord,
  className,
}: WordBankProps) {
  // Shuffle words on each render to ensure random display order
  const shuffledWords = useMemo(() => shuffleArray(words), [words]);

  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-xs font-medium text-apple-text-secondary uppercase tracking-wide">
        Word Bank
      </p>
      <div className="flex flex-wrap gap-2">
        {shuffledWords.map((word, index) => {
          const isUsed = usedWords.includes(word);
          const usedCount = usedWords.filter((w) => w === word).length;
          const totalCount = words.filter((w) => w === word).length;
          const isExhausted = usedCount >= totalCount;

          return (
            <button
              key={`${word}-${index}`}
              onClick={() => !isExhausted && onSelectWord(word)}
              disabled={isExhausted}
              className={cn(
                "px-4 py-2.5 rounded-apple-lg font-medium text-sm transition-all duration-200",
                isExhausted
                  ? "bg-apple-gray/50 text-apple-text-secondary/40 cursor-not-allowed"
                  : isUsed
                  ? "bg-apple-gray text-apple-text-secondary hover:bg-gray-200"
                  : "bg-white border border-apple-border text-apple-text shadow-apple-sm hover:border-apple-blue hover:text-apple-blue hover:shadow-apple active:scale-[0.98]"
              )}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
