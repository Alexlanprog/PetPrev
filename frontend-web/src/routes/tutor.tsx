import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TutorShell } from "@/components/TutorShell";

export const Route = createFileRoute("/tutor")({
  component: TutorLayout,
});

function TutorLayout() {
  return <Outlet />;
}
