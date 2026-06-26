import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "./i18n";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/query-client.ts";
import { ThemeProvider } from "./components/theme/theme-provider.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import Login from "./pages/login.tsx";
import { UnauthorizedPage } from "./pages/unauthorized.tsx";
import ProtectedRoute from "./routers/protected-route.tsx";
import PublicRoute from "./routers/public-route.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Toaster position="bottom-right" richColors />
          <TooltipProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <App />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
