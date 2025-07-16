import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, trpc } from "../trpc/server";
import { Suspense } from "react";
import Client from "./Client";

export default async function page() { 
  const queryClient = getQueryClient()
  void queryClient.prefetchQuery(trpc.hello.queryOptions({text: 'dewang'}))
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p>loading...</p>}>
        <Client />
      </Suspense>
    </HydrationBoundary>
  );
}
