import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import {
  DashboardPage,
  HygienePage,
  ModulePage,
  RootLayout,
  ToolkitPage,
} from './pages'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

const moduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/module/$moduleId',
  component: ModulePage,
})

const toolkitRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/toolkit',
  component: ToolkitPage,
})

const hygieneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/hygiene',
  component: HygienePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  moduleRoute,
  toolkitRoute,
  hygieneRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}