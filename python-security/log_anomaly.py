#!/usr/bin/env python3
"""Анализ аномалий в логах — модули 04-processes, 06-memory, 11-networking."""

from __future__ import annotations

import argparse
import re
import sys
import json
from collections import Counter
from datetime import datetime
from pathlib import Path

PATTERNS = {
    "ssh_failed": re.compile(r"Failed password|Invalid user", re.I),
    "ssh_accepted": re.compile(r"Accepted (password|publickey)", re.I),
    "sudo_fail": re.compile(r"sudo:.*authentication failure|NOT allowed", re.I),
    "oom": re.compile(r"out of memory|oom.killer|killed process", re.I),
}

IP_PATTERN = re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b")


def analyze(path: Path, threshold: int, json_mode: bool) -> int:
    counts = {k: 0 for k in PATTERNS}
    ips = Counter()
    total_lines = 0
    alerts = 0

    try:
        # Построчное чтение для экономии памяти (O(1) memory)
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                total_lines += 1
                for name, pattern in PATTERNS.items():
                    if pattern.search(line):
                        counts[name] += 1
                        if name == "ssh_failed":
                            for ip in IP_PATTERN.findall(line):
                                ips[ip] += 1
    except OSError as e:
        if json_mode:
            print(json.dumps({"error": f"Не удалось прочитать файл: {e}"}))
        else:
            print(f"Ошибка: не удалось прочитать файл: {e}", file=sys.stderr)
        return 1

    # Подсчет алертов
    for name, count in counts.items():
        if count >= threshold:
            alerts += 1
            
    for ip, cnt in ips.items():
        if cnt >= threshold:
            alerts += 1

    if json_mode:
        # Формирование структурированного JSON
        output = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "file": str(path),
            "total_lines": total_lines,
            "threshold": threshold,
            "alerts_count": alerts,
            "metrics": counts,
            "top_failed_ips": [{"ip": ip, "count": cnt} for ip, cnt in ips.most_common(10)]
        }
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        print(f"=== log_anomaly: {path} ({total_lines} строк) ===\n")
        for name, count in counts.items():
            status = "ALERT" if count >= threshold else "ok"
            print(f"  [{status}] {name}: {count} (порог={threshold})")

        if ips:
            print("\n  Топ IP (failed SSH):")
            for ip, cnt in ips.most_common(10):
                flag = " !" if cnt >= threshold else ""
                print(f"    {ip}: {cnt}{flag}")

        print(f"\n  Время анализа: {datetime.now().isoformat(timespec='seconds')}")
        
    return alerts


def main() -> None:
    parser = argparse.ArgumentParser(description="Анализ аномалий в логах")
    parser.add_argument("logfile", type=Path)
    parser.add_argument("--threshold", type=int, default=5, help="Порог для алерта")
    parser.add_argument("--json", action="store_true", help="Вывод в формате структурированного JSON")
    args = parser.parse_args()

    if not args.logfile.is_file():
        if args.json:
            print(json.dumps({"error": f"Файл не найден: {args.logfile}"}))
        else:
            print(f"Ошибка: файл не найден: {args.logfile}", file=sys.stderr)
        sys.exit(1)

    alerts = analyze(args.logfile, args.threshold, args.json)
    sys.exit(1 if alerts else 0)


if __name__ == "__main__":
    main()