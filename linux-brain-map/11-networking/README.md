# 11 — Сеть в Linux

**Мнемоника: STN** — *Socket → TCP/IP stack → Netfilter*

## Схема пути пакета

```mermaid
flowchart LR
    NIC[Сетевая карта] --> DRV[Драйвер]
    DRV --> NET[Network stack]
    NET --> NF[Netfilter: iptables/nft]
    NF --> SOCK[Socket buffer]
    SOCK --> APP[Приложение]
```

## Таблица: слой → инструмент

| Слой | Что делает | Команда | Аномалия |
|------|------------|---------|----------|
| Interface | IP, MAC | `ip addr`, `ip link` | DOWN |
| Routing | таблица маршрутов | `ip route` | blackhole |
| Socket | TCP/UDP endpoints | `ss -tulnp` | LISTEN 0.0.0.0 |
| Firewall | фильтрация | `nft list ruleset` / `iptables -L` | открытый порт |
| DNS | разрешение имён | `resolvectl`, `dig` | DNS leak |
| conntrack | состояние соединений | `conntrack -L` | table full |

## Дерево решений

```
Сетевая проблема?
├── Нет связи? → ping gateway → traceroute
├── Порт закрыт? → ss -tlnp | grep PORT
├── Подозрительное соединение? → ss -tnp | grep ESTAB
├── Сканирование? → log_analyzer.sh auth.log
└── Внешняя поверхность? → port_scanner.sh
```

## Команды

```bash
ip -br addr
ss -tulnp
ip route show
```

## Практика

→ `bash-security-toolkit/port_scanner.sh`
→ `python-security/port_scan.py`