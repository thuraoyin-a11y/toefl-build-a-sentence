"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SystemFeedback } from "@/lib/types";
import { CheckCircle2, XCircle, Lightbulb, ArrowUpCircle } from "lucide-react";

/**
 * SystemFeedbackCard props
 */
interface SystemFeedbackCardProps {
  feedback: SystemFeedback;
  studentAnswer: string[];
  className?: string;
}

/**
 * SystemFeedbackCard component
 * Displays automated feedback for a submitted answer
 * Apple-style: Clean cards, soft colors, clear hierarchy
 */
export function SystemFeedbackCard({
  feedback,
  studentAnswer,
  className,
}: SystemFeedbackCardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall result card */}
      <Card
        variant={feedback.isCorrect ? "default" : "outlined"}
        className={cn(
          "border-l-4",
          feedback.isCorrect ? "border-l-apple-success" : "border-l-apple-warning"
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {feedback.isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-apple-success" />
              ) : (
                <XCircle className="h-6 w-6 text-apple-warning" />
              )}
              <CardTitle className="text-lg">
                {feedback.isCorrect ? "Well done!" : "Keep practicing"}
              </CardTitle>
            </div>
            <Badge variant={feedback.isCorrect ? "success" : "warning"} size="md">
              {feedback.score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-apple-text leading-relaxed">{feedback.message}</p>
        </CardContent>
      </Card>

      {/* Answer comparison */}
      <Card variant="outlined">
        <CardHeader>
          <CardTitle className="text-base">Your Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-apple-text leading-relaxed">
            {studentAnswer.length > 0 ? (
              studentAnswer.map((word, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-block px-2 py-1 rounded mx-0.5",
                    word.toLowerCase() === feedback.correctWords[index]?.toLowerCase()
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  )}
                >
                  {word}
                </span>
              ))
            ) : (
              <span className="text-apple-text-secondary italic">No answer submitted</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Correct answer */}
      <Card variant="outlined" className="bg-green-50/30">
        <CardHeader>
          <CardTitle className="text-base text-green-800">Correct Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-apple-text leading-relaxed">
            {feedback.correctWords.map((word, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 rounded mx-0.5 bg-green-100 text-green-800 font-medium"
              >
                {word}
              </span>
            ))}
          </p>
        </CardContent>
      </Card>

      {/* Tips section */}
      <div className="grid gap-4 sm:grid-cols-2">
        {feedback.grammarTip && (
          <Card variant="outlined" className="bg-blue-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-apple-blue" />
                <CardTitle className="text-sm text-apple-blue">Grammar Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-apple-text-secondary">
                {feedback.grammarTip}
              </p>
            </CardContent>
          </Card>
        )}

        {feedback.improvement && (
          <Card variant="outlined" className="bg-purple-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-purple-500" />
                <CardTitle className="text-sm text-purple-600">How to Improve</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-apple-text-secondary">
                {feedback.improvement}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
