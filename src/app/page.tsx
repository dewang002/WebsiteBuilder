"use client"

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/src/trpc/client";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Input } from "@/src/components/ui/input";


export default function page() {
  const [input, setInput] = useState('')

  const trpc = useTRPC();
  const { data: messages } = useQuery(trpc.messages.getMany.queryOptions());
  const createMessage = useMutation(trpc.messages.create.mutationOptions({
    onSuccess: () => {
      toast.success("message created")
    }
  }));
  return (
    <div className="">
      <Input value={input} onChange={(e) => setInput(e.target.value)} />
      <Button disabled={createMessage.isPending} onClick={() => createMessage.mutate({ value: input })}>
        generate
      </Button>
      {JSON.stringify(messages,null,2)}
    </div>
  );
}
