import { ProgressBar } from '@/components/ProgressBar'
import { QuizPanel } from '@/components/QuizPanel'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Typography } from '@/components/ui/typography'
import { ATTACK_TACTICS, IBM_TOPICS, KILL_CHAIN } from '@/data/ibm'
import { useIbmCompletionPercent, useProgress } from '@/lib/progress'

export function IbmPage() {
  const asset = (path: string) => `${import.meta.env.BASE_URL}ibm/${path}`
  const ibmProgress = useIbmCompletionPercent(IBM_TOPICS.length)
  const completedTopics = useProgress().completedIbmTopics.length

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 grid gap-4">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          IBM Cybersecurity · материалы из локального архива
        </Badge>
        <Typography variant="h1" className="psy-title max-w-4xl text-3xl font-bold sm:text-4xl">
          Основы ИБ: от CIA и доступа до форензики и цепочки атаки
        </Typography>
        <Typography tone="muted" className="max-w-3xl">
          Содержание извлечено из скриншотов курса и переработано в атомарные
          конспекты. Всё запечено в приложение: без LLM, сетевых запросов и ключей
          в рантайме.
        </Typography>
        <div className="max-w-xl">
          <ProgressBar
            value={ibmProgress}
            label={`Пройдено тем: ${completedTopics}/${IBM_TOPICS.length}`}
          />
        </div>
      </div>

      <Tabs defaultValue="topics" className="grid gap-5">
        <TabsList className="flex h-auto flex-wrap gap-1 border border-border/60 bg-muted/50 p-1">
          <TabsTrigger value="topics">Темы</TabsTrigger>
          <TabsTrigger value="kill-chain">Kill Chain</TabsTrigger>
          <TabsTrigger value="attack">ATT&amp;CK</TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="grid gap-5">
          {IBM_TOPICS.map((topic) => (
            <Card key={topic.id} className="border-border/80 bg-card/90">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary">
                    {String(topic.number).padStart(2, '0')}
                  </Badge>
                  <Badge variant="outline" className="psy-mnemonic font-mono">
                    {topic.mnemonic}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{topic.title}</CardTitle>
                <CardDescription>{topic.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="concepts">
                  <TabsList className="mb-4 flex h-auto flex-wrap">
                    <TabsTrigger value="concepts">Понятия</TabsTrigger>
                    <TabsTrigger value="takeaways">Выводы</TabsTrigger>
                    <TabsTrigger value="quiz">Квиз</TabsTrigger>
                  </TabsList>
                  <TabsContent value="concepts" className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Понятие</TableHead>
                          <TableHead>Смысл</TableHead>
                          <TableHead>Практический ориентир</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topic.concepts.map((concept) => (
                          <TableRow key={concept.term}>
                            <TableCell className="font-medium">
                              {concept.term}
                            </TableCell>
                            <TableCell>{concept.meaning}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {concept.signal}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  <TabsContent value="takeaways" className="grid gap-3">
                    {topic.takeaways.map((takeaway, index) => (
                      <div key={takeaway} className="flex gap-3 rounded-lg border p-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <p className="text-sm">{takeaway}</p>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="quiz">
                    <QuizPanel
                      moduleId={topic.id}
                      questions={topic.quiz}
                      completionTrack="ibm"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="kill-chain">
          <Card>
            <CardHeader>
              <CardTitle>Cyber Kill Chain: 7 этапов и точки защиты</CardTitle>
              <CardDescription>
                Линейная модель помогает спросить: где обнаружить или прервать
                конкретную атаку?
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-3 lg:grid-cols-2">
                {KILL_CHAIN.map((item, index) => (
                  <div key={item.stage} className="psy-highlight-card rounded-lg p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge>{index + 1}</Badge>
                      <strong>{item.ru}</strong>
                      <span className="text-sm text-muted-foreground">
                        / {item.stage}
                      </span>
                    </div>
                    <p className="text-sm">{item.detail}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <strong>Защита:</strong> {item.defense}
                    </p>
                  </div>
                ))}
              </div>
              <a href={asset('cyber-kill-chain.webp')} target="_blank" rel="noreferrer">
                <img
                  src={asset('cyber-kill-chain.webp')}
                  alt="Cyber Kill Chain из семи этапов"
                  className="max-h-[52rem] w-full rounded-lg border bg-white object-contain"
                />
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attack">
          <Card>
            <CardHeader>
              <CardTitle>MITRE ATT&amp;CK: тактики как цели атакующего</CardTitle>
              <CardDescription>
                Kill Chain показывает ход одной операции, ATT&amp;CK каталогизирует
                наблюдаемое поведение по тактикам и техникам.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ATTACK_TACTICS.map((tactic, index) => (
                  <div key={tactic} className="rounded-lg border bg-muted/40 p-3">
                    <span className="mr-2 font-mono text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium">{tactic}</span>
                  </div>
                ))}
              </div>
              <Typography tone="muted">
                Схема из архива является историческим снимком матрицы. Для
                операционной работы перечень техник нужно сверять с актуальной
                MITRE ATT&amp;CK, но базовая логика тактик остаётся полезной для
                обучения и threat modeling.
              </Typography>
              <a href={asset('attack-matrix.webp')} target="_blank" rel="noreferrer">
                <img
                  src={asset('attack-matrix.webp')}
                  alt="Матрица MITRE ATT&CK Enterprise"
                  className="w-full rounded-lg border bg-white object-contain"
                />
              </a>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  )
}

