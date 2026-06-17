# 05 — Планировщик процессов (EEVDF)

**Мнемоника: EEVDF = Earliest Eligible Virtual Deadline First — «дерево справедливости» (с ядра 6.6; ранее CFS)**

## Схема

```mermaid
flowchart TB
    RQ[Runqueue] --> EEVDF[EEVDF: red-black tree по vruntime]
    EEVDF --> CPU[CPU core]
    RT[Real-time SCHED_FIFO/RR] --> CPU
    CPU --> PROC[Текущий процесс]
    NICE[nice -20..19] --> EEVDF
    CGROUP[cpu.cfs_quota] --> EEVDF
```

## Таблица приоритетов

| Параметр | Диапазон | Команда | Эффект |
|----------|----------|---------|--------|
| nice | -20 (высший) … 19 (низший) | `nice -n 10 cmd` | вес CPU |
| priority | 0–139 (внутр. ядра) | `ps -eo pid,ni,pri,cmd` | в столбце `pri` больше = важнее (инверсия внутр. шкалы) |
| policy | SCHED_OTHER/FIFO/RR | `chrt -p PID` | RT вытесняет обычные |
| cgroup CPU | quota/period | `cat /sys/fs/cgroup/.../cpu.max` | лимит в Docker |

## Дерево решений

```
Процесс медленный / не отвечает?
├── CPU bound? → top -H -p PID (потоки)
├── I/O bound? → iotop / pidstat -d
├── RT процесс голодит? → ps -eo pid,cls,rtprio,cmd
└── Контейнер лимитирован? → docker stats / cgroup cpu.max
```

## Команды

```bash
ps -eo pid,ni,pri,psr,stat,cmd --sort=-ni | head -15
chrt -p $(pgrep -n systemd) 2>/dev/null || true
cat /proc/sched_debug 2>/dev/null | head -5 || echo "нужен root"
```

## Практика

→ `user_audit.sh` (топ CPU-процессов)