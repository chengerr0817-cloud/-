import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { PageTransition } from "@/components/PageTransition";
import { Navbar } from "@/components/blog/Navbar";
import { Footer } from "@/components/blog/Footer";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Tags from "./pages/Tags";
import TagDetail from "./pages/TagDetail";
import About from "./pages/About";
import Search from "./pages/Search";
import Login from "./pages/Login";
import Write from "./pages/Write";
import MyPosts from "./pages/MyPosts";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

/**
 * Configure TanStack Query client with optimized defaults
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/** Scroll to top on route change (BrowserRouter-compatible). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Route guard: requires a logged-in user, otherwise redirects to /login. */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div
          className="animate-spin rounded-full border-2 border-border"
          style={{ width: '2rem', height: '2rem', borderTopColor: 'var(--primary)' }}
        />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      {/* Shared layout lives OUTSIDE AnimatedRoutes so it never re-mounts/animates. */}
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <AnimatedRoutes>
            <Route path="/" data-genie-title="首页" data-genie-key="Home" element={<PageTransition transition="slide-up"><Home /></PageTransition>} />
            <Route path="/posts/:slug" data-genie-title="文章详情" data-genie-key="PostDetail" element={<PageTransition transition="slide-up"><PostDetail /></PageTransition>} />
            <Route path="/tags" data-genie-title="标签分类" data-genie-key="Tags" element={<PageTransition transition="slide-up"><Tags /></PageTransition>} />
            <Route path="/tags/:tagName" data-genie-title="标签文章" data-genie-key="TagDetail" element={<PageTransition transition="slide-up"><TagDetail /></PageTransition>} />
            <Route path="/about" data-genie-title="关于" data-genie-key="About" element={<PageTransition transition="slide-up"><About /></PageTransition>} />
            <Route path="/search" data-genie-title="搜索" data-genie-key="Search" element={<PageTransition transition="fade"><Search /></PageTransition>} />
            <Route path="/login" data-genie-title="登录" data-genie-key="Login" element={<PageTransition transition="fade"><Login /></PageTransition>} />
            <Route path="/auth/callback" data-genie-title="登录回调" data-genie-key="AuthCallback" element={<PageTransition transition="fade"><AuthCallback /></PageTransition>} />
            <Route path="/write" data-genie-title="写文章" data-genie-key="Write" element={<PageTransition transition="slide-up"><ProtectedRoute><Write /></ProtectedRoute></PageTransition>} />
            <Route path="/edit/:id" data-genie-title="编辑文章" data-genie-key="Edit" element={<PageTransition transition="slide-up"><ProtectedRoute><Write /></ProtectedRoute></PageTransition>} />
            <Route path="/me/posts" data-genie-title="我的文章" data-genie-key="MyPosts" element={<PageTransition transition="slide-up"><ProtectedRoute><MyPosts /></ProtectedRoute></PageTransition>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" data-genie-key="NotFound" data-genie-title="页面未找到" element={<PageTransition transition="fade"><NotFound /></PageTransition>} />
          </AnimatedRoutes>
        </main>
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App
