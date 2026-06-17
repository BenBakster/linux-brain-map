#!/usr/bin/env python3
"""Мониторинг CVE через NVD API — модуль 12-security."""

from __future__ import annotations

import argparse
import sys
import os
import time
import json
from datetime import datetime, timedelta, timezone

try:
    import requests
except ImportError:
    print("Установи: pip install requests", file=sys.stderr)
    sys.exit(1)

NVD_API = "https://services.nvd.nist.gov/rest/json/cves/2.0"


def fetch_cves(keyword: str, days: int, api_key: str | None = None) -> list[dict]:
    start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT00:00:00.000")
    end = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000")

    params = {
        "keywordSearch": keyword,
        "pubStartDate": start,
        "pubEndDate": end,
        "resultsPerPage": 20,
    }
    headers = {"User-Agent": "linux-security-stack/1.0"}
    
    # Использование API-ключа NVD при наличии
    actual_key = api_key or os.environ.get("NVD_API_KEY")
    if actual_key:
        headers["apiKey"] = actual_key

    # Попытки выполнения запроса с экспоненциальной задержкой при ошибках API (rate limit / 503)
    max_retries = 3
    delay = 2.0
    for attempt in range(max_retries):
        try:
            resp = requests.get(NVD_API, params=params, headers=headers, timeout=30)
            if resp.status_code == 200:
                return resp.json().get("vulnerabilities", [])
            elif resp.status_code in (403, 503, 429):
                # Блокировка лимитов или технические проблемы на стороне NVD
                if attempt < max_retries - 1:
                    time.sleep(delay)
                    delay *= 2
                    continue
            resp.raise_for_status()
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise e
            
    return []


def severity(vuln: dict) -> str:
    metrics = vuln.get("cve", {}).get("metrics", {})
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        if key in metrics and metrics[key]:
            return metrics[key][0].get("cvssData", {}).get("baseSeverity", "?")
    return "UNKNOWN"


def main() -> None:
    parser = argparse.ArgumentParser(description="Мониторинг CVE (NVD)")
    parser.add_argument("keyword", nargs="?", help="Ключевое слово (openssh, openssl...)")
    parser.add_argument("--package", dest="keyword_alt", help="Алиас для keyword")
    parser.add_argument("--days", type=int, default=90, help="За последние N дней")
    parser.add_argument("--api-key", help="API-ключ NVD (можно задать через NVD_API_KEY)")
    parser.add_argument("--json", action="store_true", help="Вывод в формате структурированного JSON")
    args = parser.parse_args()

    keyword = args.keyword or args.keyword_alt
    if not keyword:
        if args.json:
            print(json.dumps({"error": "Не указано ключевое слово"}))
        else:
            parser.print_help()
        sys.exit(1)

    if not args.json:
        print(f"=== cve_monitor: '{keyword}' за {args.days} дней ===\n")

    try:
        vulns = fetch_cves(keyword, args.days, args.api_key)
    except requests.RequestException as e:
        if args.json:
            print(json.dumps({"error": f"Ошибка NVD API: {e}"}))
        else:
            print(f"Ошибка API NVD (возможно исчерпан лимит запросов): {e}", file=sys.stderr)
        sys.exit(1)

    high_count = 0
    cve_list = []

    for item in vulns:
        cve = item.get("cve", {})
        cve_id = cve.get("id", "?")
        sev = severity(item)
        desc = ""
        for d in cve.get("descriptions", []):
            if d.get("lang") == "en":
                desc = d.get("value", "")
                break
        
        is_high = sev in ("HIGH", "CRITICAL")
        if is_high:
            high_count += 1
            
        if args.json:
            cve_list.append({
                "id": cve_id,
                "severity": sev,
                "description": desc,
                "is_critical": is_high
            })
        else:
            marker = "!" if is_high else " "
            print(f"  [{marker}] {cve_id} [{sev}] {desc[:120]}...")

    if args.json:
        output = {
            "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "keyword": keyword,
            "days": args.days,
            "total_cves": len(vulns),
            "high_critical_count": high_count,
            "cves": cve_list
        }
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        if not vulns:
            print("  CVE не найдено за указанный период")
            sys.exit(0)
        print(f"\n  Всего: {len(vulns)}, HIGH/CRITICAL: {high_count}")
        
    sys.exit(1 if high_count else 0)


if __name__ == "__main__":
    main()