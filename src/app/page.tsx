
import { caller } from "@/src/trpc/server";

export default async function page() {
  const data = await caller.hello({text:"wang"})

  return (
    <div className="text-sm">
      {JSON.stringify(data)}
    </div>
  );
}
