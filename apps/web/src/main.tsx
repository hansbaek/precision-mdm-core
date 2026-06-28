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
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import Login from "./pages/login.tsx";
import { UnauthorizedPage } from "./pages/unauthorized.tsx";
import ProtectedRoute from "./routers/protected-route.tsx";
import PublicRoute from "./routers/public-route.tsx";
import { ForceLogoutWatcher } from "./hooks/use-force-logout.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Toaster position="bottom-right" richColors />
          {/* 401·리프레시 실패 시 발행되는 강제 로그아웃 이벤트를 받아
              스토어/쿼리 캐시 정리 + 로그인 화면으로 soft-redirect. */}
          <ForceLogoutWatcher />
          <TooltipProvider>
            {/* 셸/프로바이더 단의 최후 안전망. 라우트 콘텐츠는 App 내부에서
                별도 ErrorBoundary 로 한 번 더 격리된다. */}
            <ErrorBoundary>
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
            </ErrorBoundary>
          </TooltipProvider>
        </ThemeProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
