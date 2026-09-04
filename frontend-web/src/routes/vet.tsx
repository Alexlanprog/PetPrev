import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/vet")({
  component: VetLayout,
});

function VetLayout() {
  return <Outlet />;
}
