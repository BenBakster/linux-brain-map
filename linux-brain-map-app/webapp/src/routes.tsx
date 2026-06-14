import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import {
  BrainMapPage,
  DashboardPage,
  HygienePage,
  IbmPage,
  ModulePage,
  ReviewPage,
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

const ibmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ibm',
  component: IbmPage,
})

const reviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/review',
  component: ReviewPage,
})

const brainMapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/map',
  component: BrainMapPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  moduleRoute,
  toolkitRoute,
  hygieneRoute,
  ibmRoute,
  reviewRoute,
  brainMapRoute,
])

const basepath =
  import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createRouter({ routeTree, basepath })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
