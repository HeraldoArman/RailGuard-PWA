import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderCircle } from "lucide-react";
import { DashboardViews } from "@/modules/dashboard/ui/views/dashboard-views";

const page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();

  // Prefetch needed dashboard queries
  await Promise.all([
    queryClient.prefetchQuery(trpc.gerbong.summary.queryOptions()),
    queryClient.prefetchQuery(
      trpc.gerbong.getMany.queryOptions({ page: 1, pageSize: 10 })
    ),
    // Add more prefetches if needed:
    queryClient.prefetchQuery(trpc.gerbong.getBySatpamStatus.queryOptions({ status: "belum_ditangani" })),
    queryClient.prefetchQuery(trpc.gerbong.getBySatpamStatus.queryOptions({ status: "proses" })),
    queryClient.prefetchQuery(trpc.gerbong.getBySatpamStatus.queryOptions({ status: "selesai" })),
    queryClient.prefetchQuery(
      trpc.gerbong.getByUser.queryOptions({ userId: session.user.id })
    ),
    queryClient.prefetchQuery(trpc.krl.getGerbongSummaryByUser.queryOptions()),
  ]);

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
            <DashboardViews />
          </ErrorBoundary>
        </Suspense>

      </HydrationBoundary>
    </div>
  );
};

export default page;