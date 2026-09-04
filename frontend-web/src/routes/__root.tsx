import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@petprev/ui";
import { reportLovableError } from "@petprev/utils";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PetPrev · Painel administrativo" },
      {
        name: "description",
        content: "Gestão de assinaturas, auditoria do RT e atendimentos da rede PetPrev.",
      },
      { name: "author", content: "PetPrev" },
      { property: "og:title", content: "PetPrev · Painel administrativo" },
      {
        property: "og:description",
        content: "Gestão de assinaturas, auditoria do RT e atendimentos da rede PetPrev.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Inter+Tight:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <DevRoleSwitcher />
          <Toaster />
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/**
 * Protects all routes except /login.
 * Uses a `mounted` flag to avoid SSR hydration mismatches:
 * - On the server / before hydration: always renders children (no localStorage available)
 * - After mount on the client: checks auth and redirects if needed
 */
function AuthGuard({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  // Rotas exclusivas do painel admin (não acessíveis por tutor/vet)
  const adminOnlyRoutes = ["/", "/auditoria", "/mapa"];
  const isAdminRoute = adminOnlyRoutes.includes(pathname);

  // Mark as mounted after first client render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Client-side redirects
  useEffect(() => {
    if (!mounted) return;

    // Não autenticado → login
    if (!isAuthenticated && pathname !== "/login") {
      router.navigate({ to: "/login", replace: true });
      return;
    }

    // Já autenticado tentando acessar /login → home do papel
    if (isAuthenticated && pathname === "/login") {
      const home = user?.role === "tutor" ? "/tutor" : user?.role === "vet" ? "/vet" : "/";
      router.navigate({ to: home, replace: true });
      return;
    }

    // Vet ou Tutor tentando acessar rota admin → redireciona para seu painel
    if (isAuthenticated && isAdminRoute && user?.role === "vet") {
      router.navigate({ to: "/vet", replace: true });
      return;
    }
    if (isAuthenticated && isAdminRoute && user?.role === "tutor") {
      router.navigate({ to: "/tutor", replace: true });
      return;
    }
  }, [mounted, isAuthenticated, pathname, router, user, isAdminRoute]);

  // SSR / pre-hydration: render children to match server output
  if (!mounted) {
    return <>{children}</>;
  }

  // Bloqueios síncronos (evita flash de conteúdo errado)
  if (!isAuthenticated && pathname !== "/login") return null;
  if (isAuthenticated && isAdminRoute && user?.role === "vet") return null;
  if (isAuthenticated && isAdminRoute && user?.role === "tutor") return null;

  return <>{children}</>;
}
