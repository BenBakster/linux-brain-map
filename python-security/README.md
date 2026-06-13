# Python Security Automation

Привязка к модулям [linux-brain-map](../linux-brain-map/00-index.md).

| Скрипт | Модули | Назначение |
|--------|--------|------------|
| `log_anomaly.py` | 04, 06, 11 | Аномалии в логах (частота событий) |
| `port_scan.py` | 11 | Сканер портов без nmap |
| `cve_monitor.py` | 12 | Мониторинг CVE через NVD API |

## Установка

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Использование

```bash
python log_anomaly.py /var/log/auth.log
python log_anomaly.py /var/log/auth.log --threshold 10

python port_scan.py 127.0.0.1
python port_scan.py 192.168.1.1 --ports 22,80,443,8080

python cve_monitor.py openssh
python cve_monitor.py --package openssl --days 30
```

## Зависимости

Только стандартная библиотека + `requests` для `cve_monitor.py`.