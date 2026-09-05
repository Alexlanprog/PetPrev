import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "@petprev/ui";

import appCss from "../styles.css?url";
import { reportLovableError } from "@petprev/utils";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function AuthGuard({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = router.state.location.pathname;

  // Rotas restritas no mobile
  const isTutorRoute = pathname.startsWith("/tutor");
  const isVetRoute = !isTutorRoute && pathname !== "/login";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isAuthenticated && pathname !== "/login") {
      router.navigate({ to: "/login", replace: true });
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      const home = user?.role === "tutor" ? "/tutor" : "/";
      router.navigate({ to: home, replace: true });
      return;
    }

    if (isAuthenticated && isVetRoute && user?.role === "tutor") {
      router.navigate({ to: "/tutor", replace: true });
      return;
    }

    if (isAuthenticated && isTutorRoute && user?.role === "vet") {
      router.navigate({ to: "/", replace: true });
      return;
    }
  }, [mounted, isAuthenticated, pathname, router, user, isVetRoute, isTutorRoute]);

  if (!mounted) return <>{children}</>;

  if (!isAuthenticated && pathname !== "/login") return null;
  if (isAuthenticated && isVetRoute && user?.role === "tutor") return null;
  if (isAuthenticated && isTutorRoute && user?.role !== "tutor") return null;

  return <>{children}</>;
}

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
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" },
      { title: "PetPrev VetCampo — Atendimento Domiciliar Offline-First" },
      { name: "description", content: "Plataforma de atendimento veterinário domiciliar com prontuário SOAP e trava térmica offline." },
      { name: "theme-color", content: "#0ea5e9" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "PetPrev VetCampo" },
      { property: "og:description", content: "Atendimento veterinário domiciliar offline-first" },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
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

  useEffect(() => {
    // Registro do PWA Service Worker no carregamento do navegador
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("PWA Service Worker registrado com sucesso. Escopo:", reg.scope);
          })
          .catch((err) => {
            console.warn("Falha ao registrar PWA Service Worker:", err);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AuthProvider>
        <AuthGuard>
          <Outlet />
          <DevRoleSwitcher />
          <Toaster position="top-center" />
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}
