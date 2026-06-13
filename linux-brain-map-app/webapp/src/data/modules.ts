export type ModuleRow = {
  entity: string
  where: string
  signal: string
}

export type DecisionNode = {
  condition: string
  action: string
}

export type FlowStep = {
  id: string
  label: string
  detail?: string
}

export type QuizQuestion = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Module = {
  id: string
  number: number
  title: string
  mnemonic: string
  mnemonicExpansion: string
  summary: string
  flow: FlowStep[]
  table: ModuleRow[]
  decisions: DecisionNode[]
  commands: string[]
  bashScript?: string
  pythonScript?: string
  hygieneRef?: string
  quiz: QuizQuestion[]
}

export const MODULES: Module[] = [
  {
    id: 'architecture',
    number: 1,
    title: 'Архитектура Linux',
    mnemonic: 'KUPU',
    mnemonicExpansion: 'Kernel · Userspace · Processes · Users',
    summary: 'Четыре слоя: железо → ядро → userspace → приложения. Всё диагностику начинай с /proc.',
    flow: [
      { id: 'app', label: 'Приложения' },
      { id: 'libc', label: 'glibc' },
      { id: 'shell', label: 'Shell' },
      { id: 'syscall', label: 'Syscalls' },
      { id: 'kernel', label: 'Ядро' },
      { id: 'hw', label: 'Железо' },
    ],
    table: [
      { entity: 'Userspace', where: 'ps aux, ls /proc', signal: 'процесс жрёт 100% CPU' },
      { entity: 'Ядро', where: 'uname -r, dmesg', signal: 'Oops в dmesg' },
      { entity: 'Драйвер', where: 'lsmod, lspci', signal: 'устройство не видно' },
      { entity: '/proc', where: 'cat /proc/cpuinfo', signal: 'интерфейс к ядру' },
    ],
    decisions: [
      { condition: 'CPU 100%', action: 'ps aux --sort=-%cpu | head' },
      { condition: 'RAM полна', action: 'free -h && cat /proc/meminfo' },
      { condition: 'Диск', action: 'df -h / iostat' },
      { condition: 'Сеть', action: 'ss -tuln' },
    ],
    commands: ['uname -a && cat /proc/version && nproc && free -h'],
    bashScript: 'user_audit.sh',
    hygieneRef: '§1',
    quiz: [
      {
        question: 'KUPU — что означает U?',
        options: ['Users', 'Unix', 'Upload', 'Utility'],
        correctIndex: 0,
        explanation: 'Users — пользователи и права доступа поверх процессов.',
      },
      {
        question: 'Где смотреть информацию о CPU из ядра?',
        options: ['/etc/cpu', '/proc/cpuinfo', '/sys/cpu', '/var/cpu'],
        correctIndex: 1,
        explanation: '/proc — виртуальная ФС, интерфейс к ядру.',
      },
    ],
  },
  {
    id: 'boot',
    number: 2,
    title: 'Загрузка',
    mnemonic: 'BGKIS',
    mnemonicExpansion: 'Bootloader → GRUB → Kernel → Init → systemd',
    summary: 'От UEFI до login prompt — цепочка из 5 звеньев. Зависание = смотри journalctl -b.',
    flow: [
      { id: 'uefi', label: 'UEFI/BIOS' },
      { id: 'grub', label: 'GRUB' },
      { id: 'kernel', label: 'vmlinuz' },
      { id: 'initramfs', label: 'initramfs' },
      { id: 'init', label: 'PID 1' },
      { id: 'systemd', label: 'systemd' },
    ],
    table: [
      { entity: 'GRUB', where: '/boot/grub/', signal: 'kernel panic' },
      { entity: 'Kernel', where: 'dmesg, journalctl -b', signal: 'root не найден' },
      { entity: 'initramfs', where: 'lsinitramfs', signal: 'LUKS не открыт' },
      { entity: 'systemd', where: 'systemctl list-units', signal: 'зависший сервис' },
    ],
    decisions: [
      { condition: 'GRUB виден, дальше нет', action: 'проверить /boot, параметры root=' },
      { condition: 'Kernel panic', action: 'dmesg, initramfs' },
      { condition: 'Зависает на login', action: 'systemctl --failed' },
      { condition: 'Медленный boot', action: 'systemd-analyze blame' },
    ],
    commands: ['systemd-analyze', 'systemd-analyze blame | head -10', 'journalctl -b -p err'],
    bashScript: 'user_audit.sh',
    hygieneRef: '§2',
    quiz: [
      {
        question: 'Кто становится PID 1?',
        options: ['bash', 'systemd/init', 'kernel', 'grub'],
        correctIndex: 1,
        explanation: 'После загрузки ядра exec /sbin/init — первый userspace-процесс.',
      },
    ],
  },
  {
    id: 'syscalls',
    number: 3,
    title: 'Системные вызовы',
    mnemonic: 'UKU',
    mnemonicExpansion: 'User → Kernel → User',
    summary: 'Единственный легальный путь приложения в ядро. strace — твой рентген.',
    flow: [
      { id: 'app', label: 'Приложение' },
      { id: 'libc', label: 'libc wrapper' },
      { id: 'gate', label: 'syscall gate' },
      { id: 'handler', label: 'обработчик ядра' },
      { id: 'ret', label: 'return code' },
    ],
    table: [
      { entity: 'fork', where: 'strace -f', signal: 'новые процессы' },
      { entity: 'execve', where: 'strace -e execve', signal: 'запуск программ' },
      { entity: 'open/read/write', where: 'strace -e file', signal: 'доступ к файлам' },
      { entity: 'mmap', where: 'strace -e mmap', signal: 'память, shared lib' },
      { entity: 'socket', where: 'strace -e trace=network', signal: 'сетевые приложения' },
      { entity: 'kill', where: 'strace -e kill', signal: 'завершение процессов' },
      { entity: 'wait4', where: 'strace -e wait', signal: 'zombie-процессы' },
    ],
    decisions: [
      { condition: 'Permission denied', action: 'strace → open/access' },
      { condition: 'Segfault', action: 'dmesg, core dump' },
      { condition: 'Зависает', action: 'strace -p PID' },
      { condition: 'Медленно', action: 'strace -c (статистика)' },
    ],
    commands: ['strace -c ls -la', 'strace -e trace=network -p PID'],
    bashScript: 'user_audit.sh',
    pythonScript: 'log_anomaly.py',
    quiz: [
      {
        question: 'UKU описывает...',
        options: ['путь syscall', 'тип файла', 'алгоритм шифрования', 'загрузку GRUB'],
        correctIndex: 0,
        explanation: 'User mode → Kernel → обратно в User с кодом возврата.',
      },
    ],
  },
  {
    id: 'processes',
    number: 4,
    title: 'Процессы',
    mnemonic: 'FET',
    mnemonicExpansion: 'Fork → Exec → Terminate',
    summary: 'fork клонирует, exec заменяет образ, zombie = родитель не вызвал wait().',
    flow: [
      { id: 'fork', label: 'fork()' },
      { id: 'ready', label: 'Ready' },
      { id: 'run', label: 'Running' },
      { id: 'sleep', label: 'Sleeping' },
      { id: 'zombie', label: 'Zombie (Z)' },
      { id: 'wait', label: 'wait() родителем' },
    ],
    table: [
      { entity: 'PID', where: '/proc/PID/status', signal: 'идентификатор' },
      { entity: 'PPID', where: '/proc/PID/status', signal: 'родитель zombie' },
      { entity: 'cmdline', where: '/proc/PID/cmdline', signal: 'скрытое имя' },
      { entity: 'FD', where: 'ls /proc/PID/fd', signal: 'открытые файлы' },
    ],
    decisions: [
      { condition: 'Zombie (Z)', action: 'ps -eo pid,ppid,stat,cmd | grep Z' },
      { condition: 'Жрёт CPU', action: 'ps aux --sort=-%cpu | head' },
      { condition: 'Скрытое имя', action: 'comm vs cmdline' },
      { condition: 'Кто породил', action: 'pstree -p PID' },
    ],
    commands: ['ps aux --sort=-%cpu | head', 'ps -eo pid,ppid,stat,cmd | awk \'$3~/Z/\''],
    bashScript: 'user_audit.sh',
    pythonScript: 'log_anomaly.py',
    hygieneRef: '§3',
    quiz: [
      {
        question: 'Zombie-процесс — это когда...',
        options: [
          'процесс завершился, родитель не wait()',
          'процесс жрёт всю RAM',
          'вирус в /tmp',
          'ядро упало',
        ],
        correctIndex: 0,
        explanation: 'Zombie (Z) — запись в таблице процессов до wait() родителем.',
      },
    ],
  },
  {
    id: 'scheduler',
    number: 5,
    title: 'Планировщик CFS',
    mnemonic: 'CFS',
    mnemonicExpansion: 'Completely Fair Scheduler',
    summary: 'Красно-чёрное дерево по vruntime. nice -20..19 меняет вес CPU.',
    flow: [
      { id: 'rq', label: 'Runqueue' },
      { id: 'cfs', label: 'CFS tree' },
      { id: 'cpu', label: 'CPU core' },
      { id: 'rt', label: 'RT SCHED_FIFO' },
    ],
    table: [
      { entity: 'nice', where: 'ps -eo ni,pri,cmd', signal: '-20 высший приоритет' },
      { entity: 'policy', where: 'chrt -p PID', signal: 'RT вытесняет CFS' },
      { entity: 'cgroup', where: 'cpu.max', signal: 'лимит в Docker' },
    ],
    decisions: [
      { condition: 'CPU bound', action: 'top -H -p PID' },
      { condition: 'I/O bound', action: 'pidstat -d' },
      { condition: 'RT голодит', action: 'ps -eo cls,rtprio' },
    ],
    commands: ['ps -eo pid,ni,pri,psr,stat,cmd --sort=-ni | head -15'],
    bashScript: 'user_audit.sh',
    pythonScript: 'log_anomaly.py',
    quiz: [
      {
        question: 'nice=19 означает...',
        options: ['низший приоритет CPU', 'root доступ', 'зомби', 'swap off'],
        correctIndex: 0,
        explanation: 'Диапазон -20 (высший) … 19 (низший).',
      },
    ],
  },
  {
    id: 'memory',
    number: 6,
    title: 'Память',
    mnemonic: 'VPS',
    mnemonicExpansion: 'Virtual · Paging · Swap',
    summary: 'Page fault → подгрузка → swap → OOM Killer. si/so в vmstat = swap активен.',
    flow: [
      { id: 'access', label: 'Обращение к адресу' },
      { id: 'fault', label: 'Page Fault' },
      { id: 'ram', label: 'Страница в RAM?' },
      { id: 'swap', label: 'Подгрузка из swap' },
      { id: 'oom', label: 'OOM Killer' },
    ],
    table: [
      { entity: 'Virtual', where: '/proc/PID/maps', signal: 'адресное пространство' },
      { entity: 'RSS', where: 'VmRSS в status', signal: 'реально в RAM' },
      { entity: 'Swap', where: 'VmSwap', signal: 'вытеснено' },
      { entity: 'OOM score', where: '/proc/PID/oom_score', signal: 'кандидат на kill' },
    ],
    decisions: [
      { condition: 'RAM кончается', action: 'ps aux --sort=-%mem | head' },
      { condition: 'Swap активен', action: 'vmstat 1 (si/so > 0)' },
      { condition: 'OOM', action: 'dmesg | grep -i oom' },
    ],
    commands: ['free -h', 'vmstat 1 3', 'cat /proc/meminfo | head -20'],
    bashScript: 'log_analyzer.sh',
    pythonScript: 'log_anomaly.py',
    hygieneRef: '§4',
    quiz: [
      {
        question: 'VPS — что первая буква?',
        options: ['Virtual memory', 'Volume', 'Virus', 'VPN'],
        correctIndex: 0,
        explanation: 'Virtual → Paging → Swap — цепочка нехватки памяти.',
      },
    ],
  },
  {
    id: 'sync',
    number: 7,
    title: 'Синхронизация',
    mnemonic: 'MSFR',
    mnemonicExpansion: 'Mutex · Semaphore · Futex · RCU',
    summary: 'Userspace mutex → futex syscall → sleep в ядре. D state = uninterruptible I/O.',
    flow: [
      { id: 'pthread', label: 'pthread_mutex' },
      { id: 'futex', label: 'futex syscall' },
      { id: 'waitq', label: 'wait queue' },
      { id: 'wake', label: 'wake up' },
    ],
    table: [
      { entity: 'Spinlock', where: 'ядро', signal: 'busy-wait, очень коротко' },
      { entity: 'Mutex', where: 'strace futex', signal: 'sleep, userspace/ядро' },
      { entity: 'Semaphore', where: 'ipcs -s', signal: 'пул ресурсов, счётчик' },
      { entity: 'Futex', where: 'strace -e futex -p PID', signal: 'основа pthread mutex' },
      { entity: 'RCU', where: 'ядро', signal: 'lock-free чтение, списки' },
      { entity: 'D state', where: 'ps -eo stat', signal: 'NFS/диск завис' },
    ],
    decisions: [
      { condition: 'D state', action: 'NFS? диск? strace -p PID' },
      { condition: 'high load, low CPU', action: 'iowait в top' },
    ],
    commands: ['strace -e futex -p PID 2>&1 | head -20', 'cat /proc/locks | head'],
    bashScript: 'user_audit.sh',
    quiz: [
      {
        question: 'Состояние D в ps означает...',
        options: ['uninterruptible sleep (I/O)', 'deleted', 'daemon', 'debug'],
        correctIndex: 0,
        explanation: 'D — процесс ждёт I/O, сигнал не прервёт.',
      },
    ],
  },
  {
    id: 'ipc',
    number: 8,
    title: 'IPC',
    mnemonic: 'PFMS',
    mnemonicExpansion: 'Pipe · FIFO · mmap · Socket',
    summary: 'Выбор IPC: родственные → pipe, большие данные → shm, сеть → socket.',
    flow: [
      { id: 'pipe', label: 'Pipe |' },
      { id: 'fifo', label: 'FIFO' },
      { id: 'shm', label: '/dev/shm' },
      { id: 'socket', label: 'Unix/TCP socket' },
    ],
    table: [
      { entity: 'Pipe', where: '/proc/PID/fd', signal: 'родственные процессы' },
      { entity: 'Shared mem', where: 'ipcs -m', signal: 'быстрый обмен' },
      { entity: 'Unix socket', where: 'ss -xnp', signal: 'same host' },
      { entity: 'TCP', where: 'ss -tlnp', signal: 'сеть' },
    ],
    decisions: [
      { condition: 'Неизвестный socket', action: 'ss -xnp' },
      { condition: 'Shared memory', action: 'ipcs -a' },
    ],
    commands: ['ipcs -a', 'ss -xnp | head -20'],
    bashScript: 'log_analyzer.sh',
    quiz: [
      {
        question: 'PFMS — S это...',
        options: ['Socket', 'Swap', 'Signal', 'SELinux'],
        correctIndex: 0,
        explanation: 'Pipe, FIFO, mmap (shared), Socket.',
      },
    ],
  },
  {
    id: 'filesystems',
    number: 9,
    title: 'Файловые системы',
    mnemonic: 'VID',
    mnemonicExpansion: 'VFS · Inode · Dentry',
    summary: 'Путь к файлу: имя → dentry cache → inode → блоки на диске.',
    flow: [
      { id: 'path', label: '/home/user/file' },
      { id: 'vfs', label: 'VFS' },
      { id: 'dentry', label: 'Dentry cache' },
      { id: 'inode', label: 'Inode' },
      { id: 'block', label: 'Блоки диска' },
    ],
    table: [
      { entity: 'VFS', where: '/proc/mounts', signal: 'единый API для всех FS' },
      { entity: 'Dentry', where: 'slabinfo (dentry)', signal: 'кэш имён каталогов' },
      { entity: 'Inode', where: 'ls -i, stat', signal: 'метаданные + inode exhaustion' },
      { entity: 'Superblock', where: 'dumpe2fs /dev/sdX', signal: 'corrupt FS' },
      { entity: 'Journal', where: 'tune2fs -l /dev/sdX', signal: 'журнал транзакций' },
      { entity: '/etc', where: 'hash baseline', signal: 'конфигурация — защищать' },
      { entity: '/bin, /sbin', where: 'find -perm -4000', signal: 'бинарники — SUID audit' },
      { entity: '/home', where: 'ls -la /home', signal: 'права 700 на каталоги' },
      { entity: '/tmp', where: 'ls -ld /tmp', signal: 'sticky bit + noexec' },
      { entity: '/var/log', where: 'ls /var/log', signal: 'ротация, анализ' },
      { entity: '/proc, /sys', where: 'cat /proc/mounts', signal: 'интерфейс ядра — виртуальные' },
    ],
    decisions: [
      { condition: 'No space', action: 'df -i И df -h (inode!)' },
      { condition: 'Permission denied', action: 'ls -la, getfacl' },
      { condition: 'Файл пропал', action: 'lsof | grep deleted' },
    ],
    commands: ['df -hT', 'df -i', 'findmnt'],
    bashScript: 'hash_checker.sh',
    hygieneRef: '§5',
    quiz: [
      {
        question: 'VID — I это...',
        options: ['Inode', 'IP', 'Init', 'IO'],
        correctIndex: 0,
        explanation: 'Inode хранит метаданные и указатели на блоки.',
      },
    ],
  },
  {
    id: 'block-io',
    number: 10,
    title: 'Блочный I/O',
    mnemonic: 'BDF',
    mnemonicExpansion: 'Block layer · Device · Filesystem',
    summary: 'Приложение → FS → block layer → драйвер → диск. iowait = диск bottleneck.',
    flow: [
      { id: 'app', label: 'read/write' },
      { id: 'fs', label: 'ext4/xfs' },
      { id: 'bl', label: 'Block layer' },
      { id: 'dm', label: 'LVM/LUKS' },
      { id: 'disk', label: 'SSD/HDD' },
    ],
    table: [
      { entity: 'Scheduler', where: '/sys/block/*/queue/scheduler', signal: 'mq-deadline' },
      { entity: 'LUKS', where: 'lsblk -f', signal: 'шифрование' },
      { entity: 'SMART', where: 'smartctl -a', signal: 'здоровье диска' },
    ],
    decisions: [
      { condition: 'iowait высокий', action: 'iostat -x 1' },
      { condition: 'Кто пишет', action: 'iotop -o' },
    ],
    commands: ['lsblk -f', 'iostat -x 1 3'],
    bashScript: 'hash_checker.sh',
    quiz: [
      {
        question: 'BDF — первый уровень после приложения?',
        options: ['Block layer через FS', 'Browser', 'Bootloader', 'BPF'],
        correctIndex: 0,
        explanation: 'FS → Block layer → Device driver.',
      },
    ],
  },
  {
    id: 'networking',
    number: 11,
    title: 'Сеть',
    mnemonic: 'STN',
    mnemonicExpansion: 'Socket · TCP stack · Netfilter',
    summary: 'Пакет: NIC → стек → netfilter → socket → приложение.',
    flow: [
      { id: 'nic', label: 'NIC' },
      { id: 'stack', label: 'TCP/IP stack' },
      { id: 'nf', label: 'Netfilter' },
      { id: 'sock', label: 'Socket' },
      { id: 'app', label: 'Приложение' },
    ],
    table: [
      { entity: 'Interface', where: 'ip addr', signal: 'DOWN' },
      { entity: 'Listening', where: 'ss -tulnp', signal: '0.0.0.0:22' },
      { entity: 'Firewall', where: 'nft list ruleset', signal: 'открытый порт' },
      { entity: 'conntrack', where: 'conntrack -L', signal: 'table full' },
    ],
    decisions: [
      { condition: 'Нет связи', action: 'ping gateway → traceroute' },
      { condition: 'Подозрительный порт', action: 'ss -tlnp' },
      { condition: 'Brute force', action: 'log_analyzer auth.log' },
    ],
    commands: ['ip -br addr', 'ss -tulnp', 'ip route show'],
    bashScript: 'port_scanner.sh',
    pythonScript: 'port_scan.py',
    hygieneRef: '§7',
    quiz: [
      {
        question: 'ss -tulnp показывает...',
        options: ['listening сокеты + процессы', 'только UDP', 'только firewall', 'DNS записи'],
        correctIndex: 0,
        explanation: 'Замена netstat — TCP/UDP listening + PID/program.',
      },
    ],
  },
  {
    id: 'security',
    number: 12,
    title: 'Безопасность',
    mnemonic: 'CAPNS',
    mnemonicExpansion: 'Capabilities · AppArmor · PAM · Namespaces · Seccomp',
    summary: 'Защита в глубину: DAC → capabilities → LSM → namespaces → seccomp.',
    flow: [
      { id: 'auth', label: 'PAM auth' },
      { id: 'dac', label: 'UID/GID/права' },
      { id: 'cap', label: 'Capabilities' },
      { id: 'lsm', label: 'AppArmor/SELinux' },
      { id: 'ns', label: 'Namespaces' },
      { id: 'sec', label: 'seccomp' },
    ],
    table: [
      { entity: 'DAC', where: 'ls -la, chmod', signal: 'owner/group/other: 644, 755' },
      { entity: 'ACL', where: 'getfacl / setfacl', signal: 'расширенные права' },
      { entity: 'Capabilities', where: 'getcap, capsh', signal: 'частичный root (cap_net_bind)' },
      { entity: 'AppArmor', where: 'aa-status', signal: 'профили: enforce/complain' },
      { entity: 'SELinux', where: 'sestatus, ls -Z', signal: 'контексты: targeted policy' },
      { entity: 'Namespaces', where: 'lsns, unshare', signal: 'изоляция PID/net/mount' },
      { entity: 'cgroups v2', where: '/sys/fs/cgroup/', signal: 'лимиты ресурсов: memory.max' },
      { entity: 'seccomp', where: '/proc/PID/status Seccomp', signal: 'фильтр syscalls (Docker)' },
      { entity: 'SUID', where: 'find / -perm -4000 2>/dev/null', signal: 'запуск от root' },
      { entity: 'SGID', where: 'find / -perm -2000 2>/dev/null', signal: 'групповые права' },
      { entity: 'Sticky /tmp', where: 'ls -ld /tmp', signal: 'защита от удаления чужих файлов' },
      { entity: 'sudo', where: '/etc/sudoers', signal: 'privilege escalation' },
    ],
    decisions: [
      { condition: 'Лишние SUID', action: 'find + hash_checker' },
      { condition: 'Brute SSH', action: 'log_analyzer' },
      { condition: 'CVE', action: 'cve_monitor.py' },
    ],
    commands: [
      'find /usr/bin /usr/sbin -perm -4000 -type f 2>/dev/null | head -20',
      'sudo -l',
      'aa-status 2>/dev/null || sestatus 2>/dev/null',
    ],
    bashScript: 'user_audit.sh',
    pythonScript: 'cve_monitor.py',
    hygieneRef: 'ncsc',
    quiz: [
      {
        question: 'CAPNS — N это...',
        options: ['Namespaces', 'Network only', 'NFS', 'Nmap'],
        correctIndex: 0,
        explanation: 'Namespaces изолируют PID, net, mount, UTS и др.',
      },
    ],
  },
]

export function getModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id)
}