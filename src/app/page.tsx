"use client"

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/src/trpc/client";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/src/components/ui/input";


export default function page() {
  const [input, setInput] = useState('')
  const trpc = useTRPC();
  const invoke = useMutation(trpc.invoke.mutationOptions({
    onSuccess: () => {
      toast.success("Background job started")
    }
  }))
  return (
    <div className="">
      <Input value={input} onChange={(e)=>setInput(e.target.value)} />
      <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ value: input })}>
        Invoke background Job
      </Button>
    </div>
  );
}
