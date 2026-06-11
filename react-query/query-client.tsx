"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export default function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session (useState initializer), never shared across requests.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // retry:false keeps current behavior — a 401 surfaces immediately for the
          // per-page redirect instead of being retried; failed polls keep prior data.
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
