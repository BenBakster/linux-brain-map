import { Link, Outlet } from '@tanstack/react-router'

import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { HYGIENE_ITEMS } from '@/data/hygiene'
import { IBM_TOPICS } from '@/data/ibm'
import { MODULES } from '@/data/modules'
import {
  useCompletionPercent,
  useHygienePercent,
  useIbmCompletionPercent,
} from '@/lib/progress'
import { cn } from '@/lib/utils'

const navLinkClass = cn(
  buttonVariants({ variant: 'ghost', size: 'sm' }),
  'text-muted-foreground data-[status=active]:bg-accent/25 data-[status=active]:text-[oklch(0.92_0.06_80)] data-[status=active]:shadow-[0_0_10px_oklch(0.72_0.17_48/0.2)]',
)

export function RootLayout() {
  const moduleProgress = useCompletionPercent(MODULES.length)
  const ibmProgress = useIbmCompletionPercent(IBM_TOPICS.length)
  const hygieneProgress = useHygienePercent(HYGIENE_ITEMS.length)

  return (
    <div className="min-h-svh text-foreground">
      <header className="psy-header sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-2">
          <Link to="/" className="flex items-center gap-2">
            <span className="psy-logo flex h-9 w-9 items-center justify-center rounded-lg text-sm font-black text-primary-foreground">
              L
            </span>
            <Typography variant="h6" className="psy-title hidden font-bold sm:block">
              Linux Brain Map
            </Typography>
          </Link>

          <nav className="ml-auto flex flex-wrap items-center gap-1" aria-label="Primary">
            <Link to="/" className={navLinkClass}>
              Модули
            </Link>
            <Link to="/toolkit" className={navLinkClass}>
              Toolkit
            </Link>
            <Link to="/audit" className={navLinkClass}>
              Аудит
            </Link>
            <Link to="/hygiene" className={navLinkClass}>
              Hygiene
            </Link>
            <Link to="/ibm" className={navLinkClass}>
              IBM Cyber
            </Link>
            <Link to="/review" className={navLinkClass}>
              Повторение
            </Link>
            <Link to="/map" className={navLinkClass}>
              Brain Map
            </Link>
            <Link to="/glossary" className={navLinkClass}>
              Глоссарий
            </Link>
            <Link to="/timeline" className={navLinkClass}>
              Хронология
            </Link>
            <Link to="/compare" className={navLinkClass}>
              Сравнения
            </Link>
          </nav>

          <div className="hidden w-40 xl:block">
            <ProgressBar value={moduleProgress} label="Кетов" />
          </div>
          <div className="hidden w-40 xl:block">
            <ProgressBar value={ibmProgress} label="IBM" />
          </div>
          <Badge variant="outline" className="lg:hidden">
            {moduleProgress}% L · {ibmProgress}% IBM · {hygieneProgress}% H
          </Badge>
        </div>
      </header>
      <Outlet />
    </div>
  )
}

