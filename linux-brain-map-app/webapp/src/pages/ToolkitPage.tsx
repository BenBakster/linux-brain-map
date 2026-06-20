import { CopyButton } from '@/components/CopyButton'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { PYTHON_SCRIPTS, TOOLKIT_SCRIPTS, bashCmd, pythonCmd } from '@/data/toolkit'

export function ToolkitPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <Typography variant="h1" className="psy-title mb-2 text-3xl font-bold">
        Bash & Python Toolkit
      </Typography>
      <Typography tone="muted" className="mb-8 max-w-2xl">
        В браузере нет терминала, поэтому скрипты запускаются на вашем локальном компьютере. 
        Вы можете быстро скачать и запустить любой скрипт по отдельности или склонировать весь проект целиком.
      </Typography>

      <div className="mb-10 grid gap-6">
        <Typography variant="h3" className="border-b pb-2 text-2xl font-bold">Bash</Typography>
        {TOOLKIT_SCRIPTS.map((script) => (
          <Card key={script.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-xl">{script.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {script.modules.map((n) => (
                    <Badge key={n} variant="outline" className="font-mono text-xs">
                      Модуль #{n}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardDescription>{script.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                  <TabsTrigger value="curl">Быстрый запуск (без клонирования)</TabsTrigger>
                  <TabsTrigger value="local">Из клонированного репозитория</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curl" className="mt-3 space-y-3">
                  <Typography variant="body" tone="muted">
                    Скачать и запустить скрипт напрямую в терминале:
                  </Typography>
                  <div className="flex flex-wrap items-center gap-2 rounded bg-muted p-2 font-mono text-xs">
                    <code className="flex-1">{`curl -O https://raw.githubusercontent.com/BenBakster/linux-brain-map/main/bash-security-toolkit/${script.file} && chmod +x ${script.file} && ./${script.file}`}</code>
                    <CopyButton text={`curl -O https://raw.githubusercontent.com/BenBakster/linux-brain-map/main/bash-security-toolkit/${script.file} && chmod +x ${script.file} && ./${script.file}`} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Или скачайте файл:</span>
                    <a 
                      href={`https://raw.githubusercontent.com/BenBakster/linux-brain-map/main/bash-security-toolkit/${script.file}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-accent hover:underline font-semibold"
                    >
                      Скачать {script.file}
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="local" className="mt-3 space-y-3">
                  <Typography variant="body" tone="muted">
                    Примеры использования локально в папке репозитория:
                  </Typography>
                  {script.usage.map((u) => (
                    <div key={u} className="flex flex-wrap items-center gap-2 rounded bg-muted p-2 font-mono text-xs">
                      <code className="flex-1">{bashCmd(u)}</code>
                      <CopyButton text={bashCmd(u)} />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Typography variant="h3" className="border-b pb-2 text-2xl font-bold">Python</Typography>
        {PYTHON_SCRIPTS.map((script) => (
          <Card key={script.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-xl">{script.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  {script.modules.map((n) => (
                    <Badge key={n} variant="outline" className="font-mono text-xs">
                      Модуль #{n}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardDescription>{script.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/60">
                  <TabsTrigger value="curl">Быстрый запуск (без клонирования)</TabsTrigger>
                  <TabsTrigger value="local">Из клонированного репозитория</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curl" className="mt-3 space-y-3">
                  <Typography variant="body" tone="muted">
                    Скачать скрипт напрямую в терминале:
                  </Typography>
                  <div className="flex flex-wrap items-center gap-2 rounded bg-muted p-2 font-mono text-xs">
                    <code className="flex-1">{`curl -O https://raw.githubusercontent.com/BenBakster/linux-brain-map/main/python-security/${script.file}`}</code>
                    <CopyButton text={`curl -O https://raw.githubusercontent.com/BenBakster/linux-brain-map/main/python-security/${script.file}`} />
                  </div>
                  <Typography variant="body" tone="muted">
                    Запустить скрипт (может потребоваться <code>pip install requests</code> для некоторых скриптов):
                  </Typography>
                  <div className="flex flex-wrap items-center gap-2 rounded bg-muted p-2 font-mono text-xs">
                    <code className="flex-1">{pythonCmd(script.usage[0])}</code>
                    <CopyButton text={pythonCmd(script.usage[0])} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Или скачайте файл:</span>
                    <a 
                      href={`https://raw.githubusercontent.com/BenBakster/linux-brain-map/main/python-security/${script.file}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-accent hover:underline font-semibold"
                    >
                      Скачать {script.file}
                    </a>
                  </div>
                </TabsContent>

                <TabsContent value="local" className="mt-3 space-y-3">
                  <Typography variant="body" tone="muted">
                    Примеры использования локально в папке репозитория:
                  </Typography>
                  {script.usage.map((u) => (
                    <div key={u} className="flex flex-wrap items-center gap-2 rounded bg-muted p-2 font-mono text-xs">
                      <code className="flex-1">{pythonCmd(u)}</code>
                      <CopyButton text={pythonCmd(u)} />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
