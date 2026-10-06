import { Suspense } from "react";
import FindRidesClient from "./FindRidesClient";

export default function FindRidePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading rides...</div>}>
      <FindRidesClient />
    </Suspense>
  );
}
