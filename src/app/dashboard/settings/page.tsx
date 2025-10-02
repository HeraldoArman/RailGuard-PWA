import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import SettingsPage from "@/modules/settings/ui/views/setting-views";
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth";
import React, { Suspense } from "react";
// import { redirect } from "next/navigation";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderCircle } from "lucide-react";
// import DashboardHistory from "@/modules/dashboard/ui/views/dashboard-history";
const page = async () => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
  
    if (!session) {
      redirect("/sign-in");
    }
    const queryClient = getQueryClient();
  
    // Prefetch histori kasus (page 1)
    await queryClient.prefetchQuery(
      // trpc.kasus.getMany.queryOptions({ page: 1, pageSize: 50 })
      trpc.krl.getGerbongSummaryByUser.queryOptions()
    );
  
  return (
    <div className="flex-col flex">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="animate-spin text-blue-600 size-8" />
            </div>
          }
        >
          <ErrorBoundary fallback={<div>Error loading Setting</div>}>
            <SettingsPage />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </div>
  );
};

export default page;
