import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { OverviewPage } from "@/pages/OverviewPage";
import { EpisodesPage } from "@/pages/EpisodesPage";
import { EvidencePage } from "@/pages/EvidencePage";
import { RulesPage } from "@/pages/RulesPage";

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const episodesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/episodes",
  component: EpisodesPage,
});

const evidenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/evidence",
  component: EvidencePage,
});

const rulesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rules",
  component: RulesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  episodesRoute,
  evidenceRoute,
  rulesRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
