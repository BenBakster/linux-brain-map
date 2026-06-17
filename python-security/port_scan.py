#!/usr/bin/env python3
"""TCP port scanner — модуль 11-networking."""

from __future__ import annotations

import argparse
import socket
import sys
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

DEFAULT_PORTS = [
    21, 22, 23, 25, 53, 80, 110, 111, 135, 139, 143, 443, 445,
    993, 995, 1723, 3306, 3389, 5432, 5900, 8080, 8443,
]


def scan_port(host: str, port: int, timeout: float) -> tuple[int, bool]:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        result = sock.connect_ex((host, port))
        return port, result == 0
    except OSError:
        return port, False
    finally:
        sock.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="TCP port scanner")
    parser.add_argument("host", help="Целевой хост")
    parser.add_argument("--ports", help="Список портов через запятую")
    parser.add_argument("--timeout", type=float, default=1.0)
    parser.add_argument("--workers", type=int, default=50)
    parser.add_argument("--json", action="store_true", help="Вывод в формате структурированного JSON")
    args = parser.parse_args()

    # Предварительное разрешение имени хоста во избежание gaierror во время сканирования
    try:
        target_ip = socket.gethostbyname(args.host)
    except socket.gaierror as e:
        if args.json:
            print(json.dumps({"error": f"Не удалось разрешить имя хоста '{args.host}': {e}"}))
        else:
            print(f"Ошибка: не удалось разрешить имя хоста '{args.host}': {e}", file=sys.stderr)
        sys.exit(1)

    if args.ports:
        try:
            ports = [int(p.strip()) for p in args.ports.split(",")]
        except ValueError:
            if args.json:
                print(json.dumps({"error": "Неверный формат списка портов"}))
            else:
                print("Ошибка: неверный формат списка портов", file=sys.stderr)
            sys.exit(1)
    else:
        ports = DEFAULT_PORTS

    if not args.json:
        print(f"=== port_scan: {args.host} ({target_ip}) ({len(ports)} портов) ===\n")
        
    open_ports: list[int] = []

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(scan_port, target_ip, p, args.timeout): p for p in ports}
        for future in as_completed(futures):
            try:
                port, is_open = future.result()
                if is_open:
                    open_ports.append(port)
                    if not args.json:
                        print(f"  OPEN  {port}/tcp")
            except Exception as e:
                # На всякий случай перехватываем любые ошибки выполнения потока
                pass

    # Сортируем порты по возрастанию
    open_ports.sort()

    if args.json:
        output = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "host": args.host,
            "ip": target_ip,
            "open_ports": open_ports
        }
        print(json.dumps(output, indent=2))
    else:
        if not open_ports:
            print("  (открытых портов не найдено)")
        else:
            print(f"\n  Итого открыто: {len(open_ports)}")
            
    sys.exit(0)


if __name__ == "__main__":
    main()