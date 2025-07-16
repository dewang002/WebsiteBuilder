"use client"

import { useTRPC } from "../trpc/client"
import { useSuspenseQuery } from "@tanstack/react-query"

const client = () => {
 const trpc = useTRPC()
 const {data} = useSuspenseQuery(trpc.hello.queryOptions({text: "dewang"}))
  return (
    <div>
     {JSON.stringify(data)}
    </div>
  )
}

export default client