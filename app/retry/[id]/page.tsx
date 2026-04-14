import { Suspense } from "react";
import { headers, cookies } from "next/headers";
import { RetryPageClient } from "./components/RetryPageClient";
import { Question } from "@/lib/types";

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-apple-text-secondary">Loading retry...</p>
      </div>
    </div>
  );
}

interface RetryPageProps {
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

async function getPracticeSet(id: string): Promise<{ practiceSet: { id: string; title: string; description: string; questionIds: string[]; difficulty: string }; questions: Question[] } | null> {
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

export default async function RetryPage({ params }: RetryPageProps) {
  const { id } = await params;
  const data = await getPracticeSet(id);

  if (!data) {
    return <ErrorState message="Practice set not found" />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <RetryPageClient practiceSet={data.practiceSet as import("@/lib/types").PracticeSet} questions={data.questions} />
    </Suspense>
  );
}
