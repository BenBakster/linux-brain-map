export type ToolkitScript = {
  id: string
  name: string
  file: string
  modules: number[]
  description: string
  usage: string[]
  path: string
}

const TOOLKIT_BASE = '../bash-security-toolkit'
const PYTHON_BASE = '../python-security'

export const TOOLKIT_SCRIPTS: ToolkitScript[] = [
  {
    id: 'user_audit',
    name: 'User Audit',
    file: 'user_audit.sh',
    modules: [1, 2, 4, 5, 7, 12],
    description: 'Пользователи, sudo, zombie, SUID, cron, systemd',
    usage: ['./user_audit.sh', './user_audit.sh --json'],
    path: `${TOOLKIT_BASE}/user_audit.sh`,
  },
  {
    id: 'log_analyzer',
    name: 'Log Analyzer',
    file: 'log_analyzer.sh',
    modules: [6, 8, 11, 12],
    description: 'SSH failures, OOM, sudo, топ IP',
    usage: [
      './log_analyzer.sh /var/log/auth.log',
      './log_analyzer.sh --journal --since "1 hour ago"',
    ],
    path: `${TOOLKIT_BASE}/log_analyzer.sh`,
  },
  {
    id: 'hash_checker',
    name: 'Hash Checker',
    file: 'hash_checker.sh',
    modules: [9, 10, 12],
    description: 'SHA-256 baseline и проверка целостности',
    usage: [
      './hash_checker.sh /etc',
      './hash_checker.sh --baseline /etc > baseline.sha256',
      './hash_checker.sh --check baseline.sha256',
    ],
    path: `${TOOLKIT_BASE}/hash_checker.sh`,
  },
  {
    id: 'port_scanner',
    name: 'Port Scanner',
    file: 'port_scanner.sh',
    modules: [11, 12],
    description: 'Listening ports + сканирование',
    usage: ['./port_scanner.sh 127.0.0.1', './port_scanner.sh 192.168.1.1 --top-ports 100'],
    path: `${TOOLKIT_BASE}/port_scanner.sh`,
  },
]

export const PYTHON_SCRIPTS = [
  {
    id: 'log_anomaly',
    name: 'Log Anomaly',
    file: 'log_anomaly.py',
    modules: [4, 6, 11],
    usage: ['python log_anomaly.py /var/log/auth.log --threshold 10'],
    path: `${PYTHON_BASE}/log_anomaly.py`,
  },
  {
    id: 'port_scan',
    name: 'Port Scan',
    file: 'port_scan.py',
    modules: [11],
    usage: ['python port_scan.py 127.0.0.1 --ports 22,80,443'],
    path: `${PYTHON_BASE}/port_scan.py`,
  },
  {
    id: 'cve_monitor',
    name: 'CVE Monitor',
    file: 'cve_monitor.py',
    modules: [12],
    usage: ['python cve_monitor.py openssh --days 30'],
    path: `${PYTHON_BASE}/cve_monitor.py`,
  },
]