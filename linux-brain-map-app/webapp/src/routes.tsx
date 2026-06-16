import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import {
  BrainMapPage,
  ComparePage,
  DashboardPage,
  GlossaryPage,
  HygienePage,
  IbmPage,
  ModulePage,
  ReviewPage,
  RootLayout,
  TimelinePage,
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

const glossaryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/glossary',
  component: GlossaryPage,
})

const timelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timeline',
  component: TimelinePage,
})

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/compare',
  component: ComparePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  moduleRoute,
  toolkitRoute,
  hygieneRoute,
  ibmRoute,
  reviewRoute,
  brainMapRoute,
  glossaryRoute,
  timelineRoute,
  compareRoute,
])

const basepath =
  import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createRouter({ routeTree, basepath })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
