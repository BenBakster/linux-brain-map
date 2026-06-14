export type BrainNodeKind = 'linux' | 'ibm' | 'model'

export type BrainNode = {
  id: string
  label: string
  kind: BrainNodeKind
  summary: string
  href: string
}

export type BrainEdge = {
  from: string
  to: string
  relation: string
}

export const BRAIN_NODES: BrainNode[] = [
  { id: 'architecture', label: 'Архитектура', kind: 'linux', summary: 'Граница kernel/userspace и поверхность наблюдения.', href: '/module/architecture' },
  { id: 'boot', label: 'Загрузка', kind: 'linux', summary: 'Цепочка доверия от firmware до PID 1.', href: '/module/boot' },
  { id: 'syscalls', label: 'Syscalls', kind: 'linux', summary: 'Контролируемый вход приложения в ядро.', href: '/module/syscalls' },
  { id: 'processes', label: 'Процессы', kind: 'linux', summary: 'Исполнение, идентичность и жизненный цикл кода.', href: '/module/processes' },
  { id: 'scheduler', label: 'Планировщик', kind: 'linux', summary: 'Распределение CPU и ограничения ресурсов.', href: '/module/scheduler' },
  { id: 'memory', label: 'Память', kind: 'linux', summary: 'Изоляция адресов, swap и реакция OOM.', href: '/module/memory' },
  { id: 'sync', label: 'Синхронизация', kind: 'linux', summary: 'Конкуренция, блокировки и I/O wait.', href: '/module/sync' },
  { id: 'ipc', label: 'IPC', kind: 'linux', summary: 'Каналы обмена между локальными процессами.', href: '/module/ipc' },
  { id: 'filesystems', label: 'Файловые системы', kind: 'linux', summary: 'Данные, метаданные, права и контроль изменений.', href: '/module/filesystems' },
  { id: 'block-io', label: 'Block I/O', kind: 'linux', summary: 'Хранилище, LUKS, SMART и доступность данных.', href: '/module/block-io' },
  { id: 'networking', label: 'Сеть', kind: 'linux', summary: 'Сокеты, netfilter и сетевые индикаторы.', href: '/module/networking' },
  { id: 'security', label: 'Linux Security', kind: 'linux', summary: 'DAC, capabilities, LSM, namespaces и seccomp.', href: '/module/security' },
  { id: 'security-foundations', label: 'CIA + AAN', kind: 'ibm', summary: 'Свойства, которые должны сохранять контроли.', href: '/ibm' },
  { id: 'identity-access', label: 'IAAA / IAM', kind: 'ibm', summary: 'Идентификация, аутентификация, авторизация и учёт.', href: '/ibm' },
  { id: 'governance-incidents', label: 'Governance / IR', kind: 'ibm', summary: 'Политики и управляемая реакция на инцидент.', href: '/ibm' },
  { id: 'threats-assessment-forensics', label: 'Threats / Forensics', kind: 'ibm', summary: 'Проверка слабостей и сохранение доказательств.', href: '/ibm' },
  { id: 'cryptography', label: 'Криптография', kind: 'ibm', summary: 'Ключи, шифрование, целостность и подписи.', href: '/ibm' },
  { id: 'operating-systems', label: 'Файлы и права', kind: 'ibm', summary: 'Базовые команды, ownership и rwx.', href: '/ibm' },
  { id: 'kill-chain', label: 'Kill Chain', kind: 'model', summary: 'Семь этапов одной атакующей операции.', href: '/ibm' },
  { id: 'attack', label: 'MITRE ATT&CK', kind: 'model', summary: 'Тактики и техники наблюдаемого поведения.', href: '/ibm' },
]

export const BRAIN_EDGES: BrainEdge[] = [
  { from: 'architecture', to: 'security-foundations', relation: 'задаёт границы доверия' },
  { from: 'boot', to: 'security-foundations', relation: 'поддерживает целостность' },
  { from: 'syscalls', to: 'security', relation: 'фильтруется seccomp' },
  { from: 'processes', to: 'identity-access', relation: 'работает с UID/GID' },
  { from: 'scheduler', to: 'security-foundations', relation: 'влияет на доступность' },
  { from: 'memory', to: 'security-foundations', relation: 'изоляция и доступность' },
  { from: 'sync', to: 'governance-incidents', relation: 'объясняет зависания' },
  { from: 'ipc', to: 'attack', relation: 'канал execution/C2' },
  { from: 'filesystems', to: 'operating-systems', relation: 'реализует rwx/ownership' },
  { from: 'filesystems', to: 'threats-assessment-forensics', relation: 'источник артефактов' },
  { from: 'block-io', to: 'cryptography', relation: 'LUKS шифрует хранилище' },
  { from: 'networking', to: 'kill-chain', relation: 'delivery и C2' },
  { from: 'networking', to: 'attack', relation: 'discovery и lateral movement' },
  { from: 'security', to: 'identity-access', relation: 'реализует least privilege' },
  { from: 'security', to: 'attack', relation: 'мешает persistence/evasion' },
  { from: 'security-foundations', to: 'cryptography', relation: 'задаёт цели криптографии' },
  { from: 'identity-access', to: 'attack', relation: 'credential access' },
  { from: 'governance-incidents', to: 'kill-chain', relation: 'точки detection/response' },
  { from: 'threats-assessment-forensics', to: 'attack', relation: 'описывает поведение угроз' },
  { from: 'kill-chain', to: 'attack', relation: 'операция ↔ каталог техник' },
]
