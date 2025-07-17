"use client"

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/src/trpc/client";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";


export default function page() {
  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.success("Background job started")
    }
  }))
  return (
    <div className="">
      <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ text: "Test" })}>
        Invoke background Job
      </Button>
    </div>
  );
}
