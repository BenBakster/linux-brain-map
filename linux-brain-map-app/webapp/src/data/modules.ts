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
        question: 'Что является единственным легальным интерфейсом перехода из userspace в ядро?',
        options: ['Системные вызовы (syscalls)', 'Shell', 'Прямая запись в /dev/mem', 'Переменные окружения'],
        correctIndex: 0,
        explanation: 'Приложения попадают в ядро только через syscall-интерфейс; libc лишь оборачивает эти вызовы.',
      },
      {
        question: 'Где смотреть информацию о CPU, которую отдаёт ядро?',
        options: ['/etc/cpu', '/proc/cpuinfo', '/sys/cpu.txt', '/var/cpu'],
        correctIndex: 1,
        explanation: '/proc — виртуальная ФС, интерфейс к ядру; cpuinfo генерируется на лету.',
      },
      {
        question: 'Чем по сути является файл /proc/meminfo?',
        options: [
          'Виртуальным представлением, которое ядро генерирует на лету',
          'Обычным текстовым файлом на диске',
          'Кэшем systemd',
          'Срезом dmesg',
        ],
        correctIndex: 0,
        explanation: 'procfs не лежит на диске — ядро формирует содержимое при каждом чтении.',
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
        options: ['bash', 'init/systemd', 'kernel', 'grub'],
        correctIndex: 1,
        explanation: 'После загрузки ядро делает exec /sbin/init — это первый userspace-процесс (systemd, runit, OpenRC и т.п.).',
      },
      {
        question: 'Система зависла при загрузке. Чем посмотреть журнал именно текущей загрузки?',
        options: ['journalctl -b', 'dmesg -c', 'cat /etc/fstab', 'ps aux'],
        correctIndex: 0,
        explanation: 'journalctl -b — журнал текущего boot; -p err оставит только ошибки. (dmesg -c очищает кольцевой буфер.)',
      },
      {
        question: 'Загрузка стала медленной. Что покажет, какие юниты тормозят старт?',
        options: ['systemd-analyze blame', 'systemctl list-units', 'free -h', 'top'],
        correctIndex: 0,
        explanation: 'systemd-analyze blame ранжирует юниты по времени инициализации.',
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
        question: 'Каким инструментом увидеть, какие системные вызовы делает процесс?',
        options: ['strace', 'htop', 'ls -l', 'grep'],
        correctIndex: 0,
        explanation: 'strace трассирует syscalls; strace -p PID цепляется к уже запущенному процессу.',
      },
      {
        question: 'Программа падает с «Permission denied». Что точнее всего покажет strace?',
        options: [
          'Какой именно open/access вернул EACCES',
          'Температуру CPU',
          'Список установленных пакетов',
          'DNS-запросы браузера',
        ],
        correctIndex: 0,
        explanation: 'strace -e trace=file выведет конкретный вызов и errno, на котором случился отказ.',
      },
      {
        question: 'Когда полезен strace -c?',
        options: [
          'Нужна сводная статистика: какие syscalls и сколько времени они заняли',
          'Нужно зашифровать файл',
          'Нужно собрать ядро',
          'Нужно открыть сетевой порт',
        ],
        correctIndex: 0,
        explanation: '-c агрегирует счётчики и время по каждому вызову — видно узкое место (I/O или CPU).',
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
          'процесс завершился, а родитель не вызвал wait()',
          'процесс жрёт всю RAM',
          'вирус в /tmp',
          'ядро упало',
        ],
        correctIndex: 0,
        explanation: 'Zombie (Z) — запись в таблице процессов, сохраняемая до wait() родителем.',
      },
      {
        question: 'Как правильно избавиться от зависшего zombie?',
        options: [
          'Завершить/перезапустить родителя (PPID), чтобы тот сделал wait()',
          'kill -9 по PID самого зомби',
          'rm /proc/PID',
          'Только полная перезагрузка',
        ],
        correctIndex: 0,
        explanation: 'Зомби уже мёртв — kill по нему бесполезен; запись заберёт родитель через wait(), поэтому цель — PPID.',
      },
      {
        question: 'Процесс маскируется под чужое имя. Где увидеть реальную строку запуска?',
        options: ['/proc/PID/cmdline', 'ps без аргументов', '/etc/hostname', 'whoami'],
        correctIndex: 0,
        explanation: '/proc/PID/cmdline хранит фактические argv; поле comm можно подменить.',
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
        options: ['низший приоритет CPU', 'root-доступ', 'зомби', 'swap off'],
        correctIndex: 0,
        explanation: 'Диапазон nice: -20 (высший приоритет) … 19 (низший).',
      },
      {
        question: 'RT-задача (SCHED_FIFO) заняла CPU, обычные процессы «голодают». Что проверить первым?',
        options: [
          'Класс и приоритет: ps -eo cls,rtprio,cmd / chrt -p PID',
          'Объём swap',
          'Права на файлы',
          'DNS-резолвинг',
        ],
        correctIndex: 0,
        explanation: 'RT-класс вытесняет SCHED_OTHER; нужно увидеть класс (FF/RR) и rtprio, при необходимости понизить через chrt.',
      },
      {
        question: 'На что влияет nice?',
        options: [
          'Только на вес обычных задач (SCHED_OTHER); RT-приоритет задаётся отдельно через chrt',
          'На размер RAM',
          'На скорость диска',
          'На сетевой MTU',
        ],
        correctIndex: 0,
        explanation: 'nice взвешивает лишь обычный класс; на realtime-задачи он не действует — там chrt.',
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
        question: 'vmstat стабильно показывает si/so > 0 даже в покое. О чём это говорит?',
        options: [
          'Идёт активный своппинг — системе не хватает RAM',
          'Сломан диск',
          'Перегружена сеть',
          'CPU простаивает',
        ],
        correctIndex: 0,
        explanation: 'si/so — страницы swap in/out; постоянный своп = нехватка RAM и риск дойти до OOM.',
      },
      {
        question: 'Что делает OOM Killer?',
        options: [
          'Завершает процесс с высоким oom_score при критической нехватке памяти',
          'Чистит swap по расписанию',
          'Дефрагментирует диск',
          'Перезагружает систему',
        ],
        correctIndex: 0,
        explanation: 'При исчерпании памяти ядро выбирает «жертву» по oom_score и убивает её, чтобы выжила система.',
      },
      {
        question: 'Чем VmRSS отличается от виртуального размера процесса?',
        options: [
          'RSS — реально занятая физическая RAM; виртуальный размер включает ещё и невостребованное/вытесненное',
          'RSS всегда больше виртуального',
          'Это одно и то же число',
          'RSS — это объём swap',
        ],
        correctIndex: 0,
        explanation: 'Виртуальный размер обычно сильно больше RSS; резидентны лишь страницы, реально лежащие в RAM.',
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
        question: 'Состояние D в выводе ps означает...',
        options: ['uninterruptible sleep (ждёт I/O)', 'deleted', 'daemon', 'debug'],
        correctIndex: 0,
        explanation: 'D — процесс ждёт ввод-вывод; сигнал, даже kill -9, его не прервёт.',
      },
      {
        question: 'Процесс надолго застрял в D state. Что наиболее вероятная причина?',
        options: [
          'Ждёт I/O — медленный диск или зависший NFS',
          'Высокая загрузка CPU',
          'Нехватка прав доступа',
          'Неверный пароль',
        ],
        correctIndex: 0,
        explanation: 'D = uninterruptible sleep на I/O; типично NFS или диск, и kill процесс не снимет.',
      },
      {
        question: 'На каком системном вызове построены userspace-мьютексы pthread?',
        options: ['futex', 'сигналах SIGUSR', 'файлах в /tmp', 'cron'],
        correctIndex: 0,
        explanation: 'futex (fast userspace mutex): без конфликта работает в userspace, в ядро уходит только при ожидании.',
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
        question: 'Нужно максимально быстро передать большой объём данных между процессами на одной машине. Что выбрать?',
        options: [
          'Разделяемую память (shared memory, /dev/shm)',
          'Анонимный pipe',
          'TCP-сокет на localhost',
          'Сигналы',
        ],
        correctIndex: 0,
        explanation: 'Shared memory избегает копирования через ядро; pipe и сокеты копируют данные на каждом шаге.',
      },
      {
        question: 'Чем именованный канал (FIFO, mkfifo) отличается от анонимного pipe?',
        options: [
          'У FIFO есть имя в ФС, он связывает любые процессы на хосте, не только родственные',
          'FIFO работает по сети',
          'FIFO быстрее оперативной памяти',
          'Разницы нет',
        ],
        correctIndex: 0,
        explanation: 'Анонимный pipe доступен только родственным процессам; FIFO даёт точку рандеву в ФС для неродственных.',
      },
      {
        question: 'Виден неизвестный Unix-domain сокет. Чем узнать, какой процесс его держит?',
        options: ['ss -xnp', 'ping', 'df -h', 'uname -a'],
        correctIndex: 0,
        explanation: 'ss -xnp выводит Unix-сокеты вместе с PID и именем процесса.',
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
        question: 'df -h показывает свободное место, но запись падает с «No space left». Что проверить?',
        options: [
          'df -i — не исчерпаны ли inode',
          'Перезагрузить систему',
          'Права root',
          'Размер swap',
        ],
        correctIndex: 0,
        explanation: 'inode могут закончиться при множестве мелких файлов даже когда блоки ещё свободны.',
      },
      {
        question: 'Что хранит inode?',
        options: [
          'Метаданные файла и указатели на блоки данных (но не имя)',
          'Только имя файла',
          'Содержимое файла целиком',
          'Пароль root',
        ],
        correctIndex: 0,
        explanation: 'Имя живёт в каталоге (dentry); inode — это метаданные плюс указатели на блоки.',
      },
      {
        question: 'Файл удалили через rm, но место на диске не освободилось. Почему?',
        options: [
          'Процесс всё ещё держит его открытым — место вернётся при закрытии дескриптора',
          'Диск физически сломан',
          'Нужен обязательный fsck',
          'Это баг ext4',
        ],
        correctIndex: 0,
        explanation: 'Пока есть открытый FD, inode жив; lsof | grep deleted находит такие «висящие» файлы.',
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
        question: 'В каком порядке идёт запись от приложения к диску?',
        options: [
          'Файловая система → блочный слой → драйвер устройства → диск',
          'Драйвер → файловая система → диск',
          'Диск → файловая система → приложение',
          'Приложение пишет на диск напрямую, минуя ядро',
        ],
        correctIndex: 0,
        explanation: 'ФС формирует запрос, блочный слой его планирует, драйвер передаёт устройству.',
      },
      {
        question: 'iostat -x показывает высокие %util и await на диске. О чём это?',
        options: [
          'Диск — узкое место (I/O-bound): запросы стоят в очереди',
          'Перегружен CPU',
          'Закончилась RAM',
          'Проблема с DNS',
        ],
        correctIndex: 0,
        explanation: 'Высокие await/%util = насыщение устройства; iotop -o покажет, какой процесс пишет.',
      },
      {
        question: 'Чем посмотреть, зашифрован ли блочный девайс (LUKS) и какой на нём тип ФС?',
        options: ['lsblk -f', 'ps aux', 'free -h', 'ss -t'],
        correctIndex: 0,
        explanation: 'lsblk -f покажет FSTYPE (например crypto_LUKS) и точки монтирования.',
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
        options: ['listening-сокеты вместе с процессами', 'только UDP', 'только правила firewall', 'DNS-записи'],
        correctIndex: 0,
        explanation: 'Замена netstat: TCP/UDP listening + PID/имя программы.',
      },
      {
        question: 'Появился неизвестный слушающий порт. Как узнать, какой процесс его открыл?',
        options: ['ss -tlnp (покажет PID и имя)', 'ping этого порта', 'traceroute', 'cat /etc/services'],
        correctIndex: 0,
        explanation: 'ss -tlnp связывает слушающий порт с конкретным процессом.',
      },
      {
        question: 'Где в современном Linux смотреть активные правила фаервола (преемник iptables)?',
        options: ['nft list ruleset', 'cat /etc/hosts', 'ip addr', 'dmesg'],
        correctIndex: 0,
        explanation: 'nftables — текущий фреймворк netfilter; nft list ruleset выводит активные правила.',
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
        question: 'Зачем нужны capabilities, если уже есть root?',
        options: [
          'Чтобы дать процессу лишь нужную привилегию (напр. CAP_NET_BIND_SERVICE) вместо полного root',
          'Чтобы ускорить системные вызовы',
          'Чтобы зашифровать диск',
          'Чтобы заменить пароль root',
        ],
        correctIndex: 0,
        explanation: 'Capabilities дробят всемогущество root на части — это сокращает поверхность атаки.',
      },
      {
        question: 'Чем опасен бинарник с битом SUID, принадлежащий root?',
        options: [
          'Он выполняется с правами владельца (root), кто бы его ни запустил — цель аудита',
          'Он просто работает быстрее',
          'Он доступен только для чтения',
          'Ничего особенного в этом нет',
        ],
        correctIndex: 0,
        explanation: 'SUID-root даёт повышение привилегий; find / -perm -4000 — инвентаризация таких файлов.',
      },
      {
        question: 'Что обеспечивают namespaces?',
        options: [
          'Изоляцию ресурсов (PID, net, mount, UTS...) — основу контейнеров',
          'Шифрование сетевого трафика',
          'Антивирусную защиту',
          'Резервное копирование',
        ],
        correctIndex: 0,
        explanation: 'Namespaces дают процессу собственный изолированный вид системы — фундамент Docker/LXC.',
      },
    ],
  },
]

export function getModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id)
}
