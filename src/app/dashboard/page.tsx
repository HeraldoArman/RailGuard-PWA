import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import React from "react";
import { redirect } from "next/navigation";

import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderCircle } from "lucide-react";
const page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();

  return (
    <div className="p-8 flex-col flex gap-8">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="animate-spin text-blue-600 size-8" />
            </div>
          }
        >
          <ErrorBoundary fallback={<div>Error loading analytics</div>}>
            <div>Analytics Component</div>
          </ErrorBoundary>
        </Suspense>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="animate-spin text-blue-600 size-8" />
            </div>
          }
        >
          <ErrorBoundary fallback={<div>Error loading quick access</div>}>
            <div>Quick Access Component</div>
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};
export default page;
