import { useState, type DragEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

type RootCheck = {
  is_root: boolean
}

type LoginUser = {
  user: string
  uid: number
  shell: string
  home: string
}

type ZombieProcess = {
  pid: number
  ppid: number
  stat: string
  cmd: string
}

type CpuProcess = {
  user: string
  pid: number
  cpu: number
  mem: number
  cmd: string
}

type DStateProcess = {
  pid: number
  stat: string
  cmd: string
}

type SuidSgidFile = {
  type: string
  path: string
}

type CronJob = {
  source: string
  line: string
}

type FailedSystemd = {
  unit: string
  active: string
  sub: string
  description: string
}

type UserAuditReport = {
  timestamp: string
  root_check: RootCheck
  login_users: LoginUser[]
  uid_zero_non_root: string[]
  empty_passwords: string[]
  sudo_rules: string[]
  zombies: ZombieProcess[]
  top_cpu: CpuProcess[]
  d_state_processes: DStateProcess[]
  suid_sgid_files: SuidSgidFile[]
  cron_jobs: CronJob[]
  failed_systemd: FailedSystemd[]
}

type LogMetrics = {
  ssh_failures?: number
  ssh_failed?: number
  accepted_logins?: string | number
  ssh_accepted?: number
  sudo_failures?: number
  sudo_fail?: number
  oom_events?: number
  oom?: number
}

type LogFailedIp = {
  ip: string
  count: number
}

type LogReport = {
  timestamp: string
  source?: string
  file?: string
  total_lines?: number
  threshold?: number
  alerts_count?: number
  metrics: LogMetrics
  top_failed_ips: LogFailedIp[]
}

type PortReport = {
  timestamp: string
  target: string
  ip?: string
  top_ports_limit?: number
  scanner?: string
  open_ports: number[]
}

// Известные опасные порты или порты стандартных служб
const PORT_SERVICES: Record<number, { name: string; safety: 'safe' | 'warn' | 'danger'; desc: string }> = {
  21: { name: 'FTP', safety: 'warn', desc: 'Устаревший протокол передачи файлов, пароли в открытом виде.' },
  22: { name: 'SSH', safety: 'safe', desc: 'Защищенный доступ. Проверьте настройки авторизации по ключам.' },
  23: { name: 'Telnet', safety: 'danger', desc: 'КРИТИЧЕСКАЯ УГРОЗА! Все данные передаются в открытом виде.' },
  25: { name: 'SMTP', safety: 'warn', desc: 'Почтовый сервер. Убедитесь, что нет Open Relay.' },
  53: { name: 'DNS', safety: 'safe', desc: 'Служба имен. Проверьте зону трансферов (zone transfer).' },
  80: { name: 'HTTP', safety: 'warn', desc: 'Незащищенный веб-трафик. Рекомендуется перевести на HTTPS.' },
  111: { name: 'RPCBind', safety: 'warn', desc: 'Часто используется в NFS. Уязвимость к DDoS/сканированию.' },
  135: { name: 'MS-RPC', safety: 'warn', desc: 'Служба удаленного вызова процедур Windows.' },
  139: { name: 'NetBIOS', safety: 'warn', desc: 'Устаревший протокол общего доступа к файлам Windows.' },
  143: { name: 'IMAP', safety: 'warn', desc: 'Почта. Лучше использовать шифрованный IMAPS (993).' },
  443: { name: 'HTTPS', safety: 'safe', desc: 'Защищенное веб-подключение с TLS.' },
  445: { name: 'SMB', safety: 'danger', desc: 'Общие папки Windows. Возможен вектор атак Ransomware (WannaCry).' },
  993: { name: 'IMAPS', safety: 'safe', desc: 'Защищенный почтовый протокол.' },
  995: { name: 'POP3S', safety: 'safe', desc: 'Защищенный почтовый протокол.' },
  1433: { name: 'MSSQL', safety: 'warn', desc: 'СУБД Microsoft SQL Server. Закройте доступ извне.' },
  1521: { name: 'Oracle DB', safety: 'warn', desc: 'База данных Oracle. Ограничьте сетевой доступ.' },
  3306: { name: 'MySQL', safety: 'warn', desc: 'База данных MySQL. Не должна слушать 0.0.0.0.' },
  3389: { name: 'RDP', safety: 'danger', desc: 'Удаленный рабочий стол Windows. Частая цель Brute-Force.' },
  5432: { name: 'PostgreSQL', safety: 'warn', desc: 'База данных PostgreSQL. Ограничьте IP в pg_hba.conf.' },
  5900: { name: 'VNC', safety: 'warn', desc: 'Удаленный доступ. Убедитесь в наличии сильного пароля.' },
  6379: { name: 'Redis', safety: 'danger', desc: 'Хранилище в памяти. Часто без пароля; уязвимо к RCE извне.' },
  8080: { name: 'HTTP Alt', safety: 'warn', desc: 'Часто используется для панелей управления или прокси.' },
  9200: { name: 'Elasticsearch', safety: 'danger', desc: 'Поисковый движок. Без авторизации ведет к утечке данных.' },
  27017: { name: 'MongoDB', safety: 'danger', desc: 'NoSQL база данных. Часто подвергается атакам вымогателей извне.' },
}

export function AuditPage() {
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  const [reportType, setReportType] = useState<'system' | 'log' | 'port' | null>(null)
  const [systemReport, setSystemReport] = useState<UserAuditReport | null>(null)
  const [logReport, setLogReport] = useState<LogReport | null>(null)
  const [portReport, setPortReport] = useState<PortReport | null>(null)

  const handleParse = (text: string) => {
    try {
      setError(null)
      const data = JSON.parse(text)
      
      // Автоопределение типа отчета по ключевым полям
      if ('login_users' in data && 'root_check' in data) {
        setSystemReport(data)
        setLogReport(null)
        setPortReport(null)
        setReportType('system')
      } else if ('metrics' in data && 'top_failed_ips' in data) {
        setLogReport(data)
        setSystemReport(null)
        setPortReport(null)
        setReportType('log')
      } else if ('open_ports' in data && 'target' in data) {
        setPortReport(data)
        setSystemReport(null)
        setLogReport(null)
        setReportType('port')
      } else {
        throw new Error('Неизвестная структура JSON. Убедитесь, что вы загружаете отчет из user_audit.sh, log_analyzer.sh или port_scanner.sh с флагом --json.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || 'Ошибка парсинга JSON')
      setReportType(null)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        setJsonText(text)
        handleParse(text)
      }
      reader.readAsText(file)
    } else {
      setError('Пожалуйста, перетащите корректный файл JSON')
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 grid gap-3">
        <Badge
          variant="outline"
          className="w-fit border-accent/60 bg-accent/15 text-[oklch(0.9_0.08_80)]"
        >
          Анализатор Отчетов
        </Badge>
        <Typography variant="h1" className="psy-title">
          Интерактивный дашборд аудита
        </Typography>
        <Typography tone="muted" className="max-w-3xl">
          Запустите любой скрипт из нашего набора с флагом <Typography variant="code">--json</Typography> (например, <Typography variant="code">./user_audit.sh --json &gt; report.json</Typography>) и загрузите файл сюда, чтобы получить визуальное представление результатов и рекомендации по защите.
        </Typography>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Панель загрузки отчета */}
        <Card className="h-fit border-border/80 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Загрузка отчета</CardTitle>
            <CardDescription>
              Перетащите файл или вставьте содержимое отчета ниже
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDragOver
                  ? 'border-accent bg-accent/10'
                  : 'border-border/80 hover:border-accent/60'
              }`}
            >
              <Typography variant="h3" aria-hidden>📁</Typography>
              <Typography variant="bodyXs" tone="muted" className="mt-2">
                Перетащите сюда .json отчет
              </Typography>
            </div>
            
            <div className="grid gap-2">
              <Typography as="label" htmlFor="json-raw" variant="bodyXs" tone="muted">
                Или вставьте JSON вручную:
              </Typography>
              <textarea
                id="json-raw"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{"timestamp": "...", "root_check": ...}'
                className="h-40 rounded-lg border border-border/80 bg-background/50 p-2 outline-none focus:border-accent/60"
              />
            </div>

            {error && (
              <div className="rounded bg-destructive/15 p-2">
                <Typography variant="bodyXs" tone="destructive">
                  {error}
                </Typography>
              </div>
            )}

            <Button onClick={() => handleParse(jsonText)} className="w-full">
              Визуализировать отчет
            </Button>
          </CardContent>
        </Card>

        {/* Секция визуализации */}
        <div className="min-w-0">
          {!reportType && (
            <Card className="flex h-64 flex-col items-center justify-center border-border/80 bg-card/40 text-center">
              <Typography variant="h2" tone="muted" aria-hidden>🛡️</Typography>
              <CardTitle className="mt-4">Ожидание отчета</CardTitle>
              <CardDescription>
                Загрузите JSON файл отчета, созданный скриптами аудита, для построения панелей безопасности.
              </CardDescription>
            </Card>
          )}

          {/* Визуализация системного отчета (user_audit.sh) */}
          {reportType === 'system' && systemReport && (
            <div className="grid gap-5">
              <Card className="border-border/80 bg-card/90">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Результаты аудита сервера</CardTitle>
                    <CardDescription>
                      Время сканирования: {new Date(systemReport.timestamp).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant={systemReport.root_check.is_root ? 'default' : 'destructive'}>
                    {systemReport.root_check.is_root ? 'Root Privileges' : 'Non-Root Run'}
                  </Badge>
                </CardHeader>
                <CardContent className="grid gap-6">
                  {/* Критические угрозы */}
                  {(systemReport.uid_zero_non_root.length > 0 || systemReport.empty_passwords.length > 0) && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <Typography variant="bodySmMedium" tone="destructive" className="mb-2">
                        ⚠️ Нарушения безопасности!
                      </Typography>
                      <ul className="list-disc pl-5">
                        {systemReport.uid_zero_non_root.map((user) => (
                          <li key={user}>
                            <Typography variant="bodySm" tone="destructive">
                              Пользователь <Typography variant="emphasis">{user}</Typography> имеет UID 0 (права суперпользователя)!
                            </Typography>
                          </li>
                        ))}
                        {systemReport.empty_passwords.map((user) => (
                          <li key={user}>
                            <Typography variant="bodySm" tone="destructive">
                              Пользователь <Typography variant="emphasis">{user}</Typography> имеет пустой пароль при наличии доступа к логину!
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Tabs defaultValue="users">
                    <TabsList className="mb-4 flex h-auto flex-wrap">
                      <TabsTrigger value="users">Аккаунты</TabsTrigger>
                      <TabsTrigger value="privilege">Привилегии и SUID</TabsTrigger>
                      <TabsTrigger value="processes">Процессы</TabsTrigger>
                      <TabsTrigger value="failed">Задачи и Сервисы</TabsTrigger>
                    </TabsList>

                    {/* Вкладка Аккаунты */}
                    <TabsContent value="users">
                      <Typography variant="h5" className="mb-2">Пользователи с возможностью входа</Typography>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><Typography variant="label">Пользователь</Typography></TableHead>
                            <TableHead><Typography variant="label">UID</Typography></TableHead>
                            <TableHead><Typography variant="label">Shell</Typography></TableHead>
                            <TableHead><Typography variant="label">Домашняя папка</Typography></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {systemReport.login_users.map((u) => (
                            <TableRow key={u.user}>
                              <TableCell><Typography variant="bodySmMedium">{u.user}</Typography></TableCell>
                              <TableCell><Typography variant="code">{u.uid}</Typography></TableCell>
                              <TableCell><Typography variant="code" tone="primary">{u.shell}</Typography></TableCell>
                              <TableCell><Typography variant="bodyXs" tone="muted">{u.home}</Typography></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>

                    {/* Вкладка Привилегии и SUID */}
                    <TabsContent value="privilege" className="grid gap-4">
                      <div>
                        <Typography variant="h5" className="mb-2">Правила sudo</Typography>
                        {systemReport.sudo_rules.length === 0 ? (
                          <Typography variant="bodySm" tone="muted">Правила sudo не обнаружены (или нет прав на чтение).</Typography>
                        ) : (
                          <pre className="max-h-40 overflow-y-auto rounded bg-muted p-2">
                            <Typography variant="code" tone="muted">
                              {systemReport.sudo_rules.join('\n')}
                            </Typography>
                          </pre>
                        )}
                      </div>

                      <div>
                        <Typography variant="h5" className="mb-2">SUID/SGID файлы</Typography>
                        <div className="max-h-60 overflow-y-auto border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead><Typography variant="label">Тип</Typography></TableHead>
                                <TableHead><Typography variant="label">Файл</Typography></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {systemReport.suid_sgid_files.map((file, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    <Badge variant={file.type === 'SUID' ? 'destructive' : 'secondary'}>
                                      {file.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell><Typography variant="code">{file.path}</Typography></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Вкладка Процессы */}
                    <TabsContent value="processes" className="grid gap-4">
                      {/* Зомби */}
                      <div>
                        <Typography variant="h5" className="mb-2">Зомби-процессы</Typography>
                        {systemReport.zombies.length === 0 ? (
                          <Typography variant="bodySmMedium" className="text-green-500">✓ Зомби-процессы не обнаружены</Typography>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead><Typography variant="label">PID</Typography></TableHead>
                                <TableHead><Typography variant="label">PPID</Typography></TableHead>
                                <TableHead><Typography variant="label">Команда</Typography></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {systemReport.zombies.map((z, idx) => (
                                <TableRow key={idx}>
                                  <TableCell><Typography variant="code">{z.pid}</Typography></TableCell>
                                  <TableCell><Typography variant="code">{z.ppid}</Typography></TableCell>
                                  <TableCell><Typography variant="code" tone="destructive">{z.cmd}</Typography></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>

                      {/* Топ CPU */}
                      <div>
                        <Typography variant="h5" className="mb-2">Топ-10 процессов по CPU</Typography>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead><Typography variant="label">USER</Typography></TableHead>
                              <TableHead><Typography variant="label">PID</Typography></TableHead>
                              <TableHead><Typography variant="label">CPU%</Typography></TableHead>
                              <TableHead><Typography variant="label">MEM%</Typography></TableHead>
                              <TableHead><Typography variant="label">CMD</Typography></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {systemReport.top_cpu.map((p, idx) => (
                              <TableRow key={idx}>
                                <TableCell><Typography variant="bodyXs">{p.user}</Typography></TableCell>
                                <TableCell><Typography variant="code">{p.pid}</Typography></TableCell>
                                <TableCell><Typography variant="code" tone="primary">{p.cpu}%</Typography></TableCell>
                                <TableCell><Typography variant="code">{p.mem}%</Typography></TableCell>
                                <TableCell className="max-w-[15rem] truncate" title={p.cmd}>
                                  <Typography variant="code" truncate>{p.cmd}</Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Процессы в состоянии D */}
                      {systemReport.d_state_processes.length > 0 && (
                        <div>
                          <Typography variant="h5" className="mb-2 text-yellow-500">
                            Процессы в состоянии Uninterruptible Sleep (D)
                          </Typography>
                          <Typography variant="bodyXs" tone="muted" className="mb-2">
                            Эти процессы обычно застряли на операциях ввода-вывода (могут указывать на сбой диска или NFS).
                          </Typography>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead><Typography variant="label">PID</Typography></TableHead>
                                <TableHead><Typography variant="label">STAT</Typography></TableHead>
                                <TableHead><Typography variant="label">CMD</Typography></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {systemReport.d_state_processes.map((p, idx) => (
                                <TableRow key={idx}>
                                  <TableCell><Typography variant="code">{p.pid}</Typography></TableCell>
                                  <TableCell><Typography variant="code">{p.stat}</Typography></TableCell>
                                  <TableCell><Typography variant="code" className="text-yellow-600">{p.cmd}</Typography></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>

                    {/* Вкладка Задачи и Сервисы */}
                    <TabsContent value="failed" className="grid gap-4">
                      {/* systemd */}
                      <div>
                        <Typography variant="h5" className="mb-2">Упавшие юниты systemd</Typography>
                        {systemReport.failed_systemd.length === 0 ? (
                          <Typography variant="bodySmMedium" className="text-green-500">✓ Все системные сервисы работают нормально</Typography>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead><Typography variant="label">Юнит</Typography></TableHead>
                                <TableHead><Typography variant="label">Состояние</Typography></TableHead>
                                <TableHead><Typography variant="label">Описание</Typography></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {systemReport.failed_systemd.map((s, idx) => (
                                <TableRow key={idx}>
                                  <TableCell><Typography variant="code" tone="destructive">{s.unit}</Typography></TableCell>
                                  <TableCell>
                                    <Badge variant="destructive">{s.sub}</Badge>
                                  </TableCell>
                                  <TableCell><Typography variant="bodyXs" tone="muted">{s.description}</Typography></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>

                      {/* Cron */}
                      <div>
                        <Typography variant="h5" className="mb-2">Запланированные задачи (Cron)</Typography>
                        <div className="max-h-40 overflow-y-auto border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead><Typography variant="label">Источник</Typography></TableHead>
                                <TableHead><Typography variant="label">Команда</Typography></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {systemReport.cron_jobs.map((c, idx) => (
                                <TableRow key={idx}>
                                  <TableCell><Typography variant="code">{c.source}</Typography></TableCell>
                                  <TableCell><Typography variant="code" tone="muted">{c.line}</Typography></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Визуализация отчета по логам (log_anomaly.py / log_analyzer.sh) */}
          {reportType === 'log' && logReport && (
            <div className="grid gap-5">
              <Card className="border-border/80 bg-card/90">
                <CardHeader>
                  <CardTitle>Анализ безопасности логов</CardTitle>
                  <CardDescription>
                    Источник: {logReport.source || logReport.file || 'Системный лог'} · Проверено строк: {logReport.total_lines || 'N/A'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  {/* Статистические показатели */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-background/40">
                      <CardHeader className="p-3">
                        <CardDescription>SSH Failures</CardDescription>
                        <Typography variant="h3" tone="destructive">
                          {logReport.metrics.ssh_failures !== undefined ? logReport.metrics.ssh_failures : logReport.metrics.ssh_failed}
                        </Typography>
                      </CardHeader>
                    </Card>
                    <Card className="bg-background/40">
                      <CardHeader className="p-3">
                        <CardDescription>Успешных входов</CardDescription>
                        <Typography variant="h3" className="text-green-500">
                          {logReport.metrics.accepted_logins !== undefined ? logReport.metrics.accepted_logins : logReport.metrics.ssh_accepted}
                        </Typography>
                      </CardHeader>
                    </Card>
                    <Card className="bg-background/40">
                      <CardHeader className="p-3">
                        <CardDescription>Сбоев Sudo</CardDescription>
                        <Typography variant="h3" className="text-yellow-500">
                          {logReport.metrics.sudo_failures !== undefined ? logReport.metrics.sudo_failures : logReport.metrics.sudo_fail}
                        </Typography>
                      </CardHeader>
                    </Card>
                    <Card className="bg-background/40">
                      <CardHeader className="p-3">
                        <CardDescription>OOM Событий</CardDescription>
                        <Typography variant="h3">
                          {logReport.metrics.oom_events !== undefined ? logReport.metrics.oom_events : logReport.metrics.oom}
                        </Typography>
                      </CardHeader>
                    </Card>
                  </div>

                  {/* Топ атакующих IP */}
                  <div>
                    <Typography variant="h5" className="mb-2">Подозрительные хосты (Failed SSH)</Typography>
                    {logReport.top_failed_ips.length === 0 ? (
                      <Typography variant="bodySmMedium" className="text-green-500">✓ Сетевых аномалий / Brute-Force атак не зафиксировано</Typography>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><Typography variant="label">IP адрес</Typography></TableHead>
                            <TableHead><Typography variant="label">Количество неудачных попыток входа</Typography></TableHead>
                            <TableHead><Typography variant="label">Статус угрозы</Typography></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logReport.top_failed_ips.map((item) => {
                            const threshold = logReport.threshold || 5
                            const danger = item.count >= threshold
                            return (
                              <TableRow key={item.ip}>
                                <TableCell><Typography variant="code">{item.ip}</Typography></TableCell>
                                <TableCell><Typography variant="code">{item.count}</Typography></TableCell>
                                <TableCell>
                                  <Badge variant={danger ? 'destructive' : 'outline'}>
                                    {danger ? 'Brute-Force Warning' : 'Suspicious'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Визуализация отчета сканирования портов (port_scanner.sh / port_scan.py) */}
          {reportType === 'port' && portReport && (
            <div className="grid gap-5">
              <Card className="border-border/80 bg-card/90">
                <CardHeader>
                  <CardTitle>Отчет сканирования портов</CardTitle>
                  <CardDescription>
                    Цель: {portReport.target} {portReport.ip ? `(${portReport.ip})` : ''} · Метод: {portReport.scanner || 'TCP connect'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                  <div>
                    <Typography variant="h5" className="mb-3">Найденные открытые порты</Typography>
                    {portReport.open_ports.length === 0 ? (
                      <div className="rounded border border-green-500/50 bg-green-500/10 p-4 text-center">
                        <Typography variant="bodySmMedium" className="text-green-500">Внимание: Открытых портов не обнаружено!</Typography>
                        <Typography variant="bodyXs" tone="muted" className="mt-1">Отличный результат с точки зрения сетевого периметра.</Typography>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead><Typography variant="label">Порт</Typography></TableHead>
                            <TableHead><Typography variant="label">Служба</Typography></TableHead>
                            <TableHead><Typography variant="label">Класс риска</Typography></TableHead>
                            <TableHead><Typography variant="label">Описание службы / Рекомендация</Typography></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {portReport.open_ports.map((port) => {
                            const info = PORT_SERVICES[port] || {
                              name: 'Unknown',
                              safety: 'warn',
                              desc: 'Неизвестная или кастомная служба. Рекомендуется проверить командой `ss -tulnp`.'
                            }
                            return (
                              <TableRow key={port}>
                                <TableCell><Typography variant="code" className="text-accent-foreground">{port}/tcp</Typography></TableCell>
                                <TableCell><Typography variant="bodySmMedium">{info.name}</Typography></TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        info.safety === 'danger'
                                          ? 'destructive'
                                          : info.safety === 'warn'
                                            ? 'secondary'
                                            : 'default'
                                      }
                                    >
                                      {info.safety === 'danger' ? 'ВЫСОКИЙ РИСК' : info.safety === 'warn' ? 'СРЕДНИЙ РИСК' : 'БЕЗОПАСНО'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell><Typography variant="bodyXs" tone="muted">{info.desc}</Typography></TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
