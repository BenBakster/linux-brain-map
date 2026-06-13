#!/usr/bin/env python3
"""Анализ аномалий в логах — модули 04-processes, 06-memory, 11-networking."""

from __future__ import annotations

import argparse
import re
import sys
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


def analyze(path: Path, threshold: int) -> int:
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    alerts = 0

    print(f"=== log_anomaly: {path} ({len(lines)} строк) ===\n")

    for name, pattern in PATTERNS.items():
        count = sum(1 for line in lines if pattern.search(line))
        status = "ALERT" if count >= threshold else "ok"
        if count >= threshold:
            alerts += 1
        print(f"  [{status}] {name}: {count} (порог={threshold})")

    failed_lines = [l for l in lines if PATTERNS["ssh_failed"].search(l)]
    ips = Counter()
    for line in failed_lines:
        for ip in IP_PATTERN.findall(line):
            ips[ip] += 1

    if ips:
        print("\n  Топ IP (failed SSH):")
        for ip, cnt in ips.most_common(10):
            flag = " !" if cnt >= threshold else ""
            print(f"    {ip}: {cnt}{flag}")
            if cnt >= threshold:
                alerts += 1

    print(f"\n  Время анализа: {datetime.now().isoformat(timespec='seconds')}")
    return alerts


def main() -> None:
    parser = argparse.ArgumentParser(description="Анализ аномалий в логах")
    parser.add_argument("logfile", type=Path)
    parser.add_argument("--threshold", type=int, default=5, help="Порог для алерта")
    args = parser.parse_args()

    if not args.logfile.is_file():
        print(f"Ошибка: файл не найден: {args.logfile}", file=sys.stderr)
        sys.exit(1)

    alerts = analyze(args.logfile, args.threshold)
    sys.exit(1 if alerts else 0)


if __name__ == "__main__":
    main()