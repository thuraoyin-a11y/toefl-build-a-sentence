"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4">
      <Container size="sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold text-apple-text">
            Access Denied
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-apple-text-secondary mb-6">
              This area is restricted. If you believe this is an error, please
              contact your teacher or administrator.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/" className="flex-1">
                <Button variant="secondary" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1"
              >
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
