import { Suspense } from "react";
import { headers, cookies } from "next/headers";
import { ResultPageClient } from "./ResultPageClient";
import { PracticeSet } from "@/lib/types";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-apple-text-secondary">Loading results...</p>
      </div>
    </div>
  );
}

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-semibold text-apple-text mb-2">
        {message}
      </h1>
    </div>
  );
}

async function getPracticeSet(id: string): Promise<{ practiceSet: PracticeSet; questions: import("@/lib/types").Question[] } | null> {
  const host = (await headers()).get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const cookieHeader = (await cookies()).toString();

  const res = await fetch(`${protocol}://${host}/api/practice-sets/${id}`, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

/**
 * Result Page
 * Server component that renders the result client for a complete set or retry results
 * V2 Architecture: No mock data, all data loaded via API
 */
export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;
  
  // Fetch practice set from API
  const data = await getPracticeSet(id);

  if (!data) {
    return <ErrorState message="Practice set not found" />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultPageClient practiceSet={data.practiceSet} questions={data.questions} />
    </Suspense>
  );
}
