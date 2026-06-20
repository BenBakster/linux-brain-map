export type ModuleRow = {
  entity: string
  where: string
  signal: string
}

export type DecisionNode = {
  condition: string
  action: string
}

export type QuizQuestion = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export type Epigraph = {
  text: string
  author: string
}

export type HardwareDetail = {
  name: string
  desc: string
  hotspot?: {
    left: string
    top: string
    width: string
    height: string
  }
}

export type HardwareMap = {
  image: string
  text: string
  details: HardwareDetail[]
}

export type Module = {
  id: string
  number: number
  title: string
  mnemonic: string
  mnemonicExpansion: string
  epigraph?: Epigraph
  summary: string
  explainer?: string[]
  table: ModuleRow[]
  decisions: DecisionNode[]
  commands: string[]
  bashScript?: string
  pythonScript?: string
  hygieneRef?: string
  quiz: QuizQuestion[]
  hardwareMap?: HardwareMap
}

export const MODULES: Module[] = [
  {
    id: 'architecture',
    number: 1,
    title: 'Архитектура Linux',
    mnemonic: 'KUPU',
    mnemonicExpansion: 'Kernel · Userspace · Processes · Users',
    epigraph: {
      text: 'UNIX прост. Просто нужен гений, чтобы понять его простоту.',
      author: 'Деннис Ритчи',
    },
    summary: 'Четыре слоя: железо → ядро → userspace → приложения. Всё диагностику начинай с /proc.',
    explainer: [
      'Linux как слоёный пирог. Снизу — железо (CPU, RAM, диски, сетевые карты). Над ним ядро (kernel) — единственный код с прямым доступом к железу, работающий в привилегированном режиме (на x86 это ring 0). Выше — userspace: библиотеки, демоны, оболочка и прикладные программы, у которых прямого доступа к железу нет. Мнемоника KUPU (Kernel · Userspace · Processes · Users) задаёт порядок, в котором стоит думать о системе и искать неисправность.',
      'Граница ядро/userspace — главная линия. Приложение не может само обратиться к диску или сети; оно просит об этом ядро через системные вызовы — единственную легальную «дверь» (см. модуль «Системные вызовы»). Обратно ядро рассказывает о себе через виртуальные файловые системы: /proc (процессы и параметры ядра) и /sys (устройства и драйверы). Это не файлы на диске, а интерфейс, который ядро генерирует на лету при каждом чтении.',
      'Почему диагностику ведут сверху вниз. Большинство вопросов «почему тормозит / почему не работает» сводится к определению слоя: это прикладной процесс, ядро, драйвер или железо? Сначала смотрят, что делает userspace (ps, /proc/PID), и лишь если там чисто — спускаются к ядру (dmesg), драйверам (lsmod, lspci) и железу (SMART, температуры). Перепрыгивать слои — типичная ошибка новичка.',
      'Инструмент на каждый слой. Userspace: ps aux, top, ls /proc/PID — кто запущен и что делает. Ядро: uname -r (версия), dmesg и journalctl -k (сообщения ядра, Oops, паники). Драйверы и устройства: lsmod (загруженные модули), lspci и lsusb (что за железо), дерево /sys. Само железо: free -h (RAM), lsblk (диски), nproc (число ядер CPU). Понимать, к какому слою относится команда, важнее, чем заучивать флаги.',
      'Пример. Система «тормозит». Сначала userspace: ps aux --sort=-%cpu | head — если один процесс ест 100% CPU, дело в нём, а не в ядре. CPU свободен, но всё равно медленно — free -h и vmstat 1 проверят, не упёрлись ли в память и своп. И память в норме — dmesg | tail покажет, не сыплет ли ядро ошибками от драйвера или диска. Движение строго по слоям быстро локализует виновника.',
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
    hardwareMap: {
      image: '/hardware/motherboard_layers.jpg',
      text: 'Взаимодействие операционной системы Linux с физическими компонентами компьютера (материнской платой, процессором и оперативной памятью).',
      details: [
        { 
          name: 'Центральный процессор (CPU)', 
          desc: 'Физический чип, который выполняет машинный код. Ядро Linux работает в привилегированном режиме процессора (CPL 0 / ring 0), получая полный доступ к наборам инструкций и регистрам, тогда как прикладные программы ограничены режимом пользователя (ring 3).',
          hotspot: { left: '48%', top: '32%', width: '16%', height: '23%' }
        },
        { 
          name: 'Оперативная память (RAM)', 
          desc: 'Физические микросхемы DDR, разделенные на ячейки. В ней хранятся запущенные процессы пользовательского пространства (ring 3). Ядро управляет распределением этих физических страниц.',
          hotspot: { left: '58%', top: '43%', width: '26%', height: '32%' }
        },
        { 
          name: 'Твердотельный накопитель (SSD/NVMe)', 
          desc: 'Физический диск, подключенный по шине PCIe. Здесь хранятся бинарные файлы программ до запуска. Доступ к диску контролируется ядром через драйверы контроллера.',
          hotspot: { left: '33%', top: '45%', width: '22%', height: '23%' }
        },
        { 
          name: 'Шина данных (System Bus)', 
          desc: 'Физические медные дорожки на плате, передающие электрические сигналы между CPU, RAM и внешними устройствами.',
          hotspot: { left: '15%', top: '10%', width: '70%', height: '80%' }
        }
      ]
    }
  },
  {
    id: 'boot',
    number: 2,
    title: 'Загрузка',
    mnemonic: 'UGKIS',
    mnemonicExpansion: 'UEFI → GRUB → Kernel → initramfs → systemd',
    epigraph: {
      text: 'init — родитель всех процессов; его главная роль — порождать процессы по сценарию запуска.',
      author: 'man init(8)',
    },
    summary: 'От UEFI до login prompt — цепочка из 5 звеньев. Зависание = смотри journalctl -b.',
    explainer: [
      'Загрузка — это эстафета. Питание включается, и управление передаётся по цепочке, где каждое звено готовит и запускает следующее: прошивка UEFI (или старый BIOS) → загрузчик GRUB → ядро Linux (vmlinuz) → временный образ initramfs → первый процесс userspace init/systemd. Мнемоника UGKIS — порядок этих звеньев; зная его, всегда понятно, на каком этапе всё встало.',
      'Что делает каждое звено. UEFI инициализирует железо и по своему загрузочному порядку находит EFI-загрузчик на ESP-разделе. GRUB читает конфиг, показывает меню и грузит выбранное ядро с параметрами — важнейший из них root=, указывающий, где искать корневую ФС. Ядро распаковывается, поднимает базовые подсистемы и монтирует initramfs.',
      'Зачем нужен initramfs. Это маленькая временная корневая ФС в оперативной памяти с модулями и утилитами, которых ещё нет под рукой: драйверы дискового контроллера, LVM, открытие LUKS-раздела, сборка RAID. Его задача — смонтировать настоящий корень и передать управление на него. Если корень зашифрован и пароль не принят, или нет нужного драйвера — система застревает именно здесь, в аварийном шелле initramfs.',
      'Передача systemd и где смотреть. Смонтировав реальный корень, ядро делает exec /sbin/init — этот процесс становится PID 1 (обычно systemd, реже runit или OpenRC). Дальше параллельно поднимаются юниты до целевого состояния (например graphical.target). Журнал текущей загрузки — journalctl -b (с ключом -p err только ошибки); самые медленные юниты — systemd-analyze blame; упавшие — systemctl --failed.',
      'Пример. Загрузка зависла. Не дошли даже до меню GRUB — проблема в прошивке, ESP или загрузчике. Меню есть, дальше чёрный экран — проверяйте параметр root= и наличие /boot. Сообщение «Cannot open root device» или приглашение (initramfs) — ядро не нашло или не открыло корень (часто LUKS либо отсутствующий модуль). Дошли до login, но висит сервис — systemctl --failed и journalctl -b -p err назовут виновника.',
    ],
    table: [
      { entity: 'GRUB', where: '/boot/grub/', signal: 'grub rescue> / нет меню' },
      { entity: 'Kernel', where: 'dmesg, journalctl -b', signal: 'root не найден' },
      { entity: 'initramfs', where: 'lsinitrd (dracut) / lsinitramfs (Debian) / lsinitcpio (Arch)', signal: 'LUKS не открыт' },
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
    hardwareMap: {
      image: '/hardware/spi_flash_boot.jpg',
      text: 'Физический уровень загрузки системы: микросхема SPI Flash ROM с кодом BIOS/UEFI, передача первичных инструкций загрузчика по шине SPI в оперативную память (RAM).',
      details: [
        { 
          name: 'Микросхема SPI Flash ROM', 
          desc: 'Энергонезависимая флеш-память на материнской плате, хранящая прошивку BIOS/UEFI. При подаче питания процессор начинает исполнять инструкции с этой микросхемы.',
          hotspot: { left: '23%', top: '37%', width: '11%', height: '21%' }
        },
        { 
          name: 'Шина SPI (Serial Peripheral Interface)', 
          desc: 'Последовательный интерфейс передачи данных. По медным дорожкам на плате бинарный код загрузчика UEFI/GRUB передается в RAM.',
          hotspot: { left: '34%', top: '44%', width: '23%', height: '14%' }
        },
        { 
          name: 'Слоты оперативной памяти DDR5', 
          desc: 'Слоты RAM, куда загружаются ядро Linux и образ initramfs. После инициализации памяти UEFI передает управление загрузчику GRUB, который уже загружен в RAM.',
          hotspot: { left: '68%', top: '19%', width: '18%', height: '62%' }
        }
      ]
    }
  },
  {
    id: 'syscalls',
    number: 3,
    title: 'Системные вызовы',
    mnemonic: 'UKU',
    mnemonicExpansion: 'User → Kernel → User',
    epigraph: {
      text: 'Системный вызов — фундаментальный интерфейс между приложением и ядром Linux.',
      author: 'man syscalls(2)',
    },
    summary: 'Единственный легальный путь приложения в ядро. strace — твой рентген.',
    explainer: [
      'Зачем вообще нужны системные вызовы. Userspace-программа не имеет прямого доступа к железу и привилегированным операциям: ядро работает в защищённом режиме (ring 0), приложения — в ring 3. Единственный легальный мост между ними — syscall-интерфейс: контролируемая «дверь», на входе которой ядро проверяет права и аргументы.',
      'Как это устроено технически. Обычно приложение зовёт не syscall напрямую, а тонкую обёртку из libc: например, read() в C превращается в инструкцию syscall с номером вызова и аргументами в регистрах. Ядро по номеру находит обработчик, выполняет его и кладёт результат обратно в регистр. Ошибка возвращается ядром как отрицательное значение (например -EACCES); обёртка libc преобразует его в errno (положительный код) и возвращает вызывающему -1.',
      'Почему это ключ к диагностике. Практически любое взаимодействие программы с миром — файлы, сеть, память, процессы — это системные вызовы. Поэтому strace работает как рентген: если программа «молчит», падает или висит, трассировка показывает, на каком именно вызове и с каким errno это произошло.',
      'Рабочий пример. strace -f -e trace=file ./app покажет каждый open/stat/access и какой из них вернул EACCES или ENOENT — это мгновенно отвечает на вопрос «почему не открывается файл». А strace -c ./app агрегирует статистику: сколько времени и вызовов съел каждый syscall — сразу видно, упирается программа в I/O или в CPU.',
    ],
    table: [
      { entity: 'fork', where: 'strace -f -e trace=clone,clone3,vfork', signal: 'fork()→clone, новые процессы' },
      { entity: 'execve', where: 'strace -e execve', signal: 'запуск программ' },
      { entity: 'open/read/write', where: 'strace -e trace=desc,file', signal: 'доступ к файлам' },
      { entity: 'mmap', where: 'strace -e mmap', signal: 'память, shared lib' },
      { entity: 'socket', where: 'strace -e trace=network', signal: 'сетевые приложения' },
      { entity: 'kill', where: 'strace -e kill', signal: 'завершение процессов' },
      { entity: 'wait4', where: 'strace -e trace=wait4', signal: 'zombie-процессы' },
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
    hardwareMap: {
      image: '/hardware/cpu_rings_syscalls.jpg',
      text: 'Аппаратный механизм системных вызовов: привилегированные кольца защиты процессора (Ring 3 vs Ring 0) и регистры CPU, используемые для передачи параметров вызова.',
      details: [
        { 
          name: 'Кольцо 3 (Ring 3: User Space)', 
          desc: 'Режим наименьших привилегий процессора. Обычные пользовательские приложения и библиотеки (glibc) выполняются здесь и не могут напрямую обращаться к физическим устройствам.',
          hotspot: { left: '29%', top: '13%', width: '42%', height: '74%' }
        },
        { 
          name: 'Кольцо 0 (Ring 0: Kernel Space)', 
          desc: 'Режим максимальных привилегий (Kernel Mode). Код ядра Linux выполняется здесь, имея неограниченный доступ к инструкциям CPU и физическим портам.',
          hotspot: { left: '36%', top: '23%', width: '28%', height: '54%' }
        },
        { 
          name: 'Регистр RAX (EAX) / Номер вызова', 
          desc: 'Регистр процессора, куда программа записывает уникальный номер системного вызова (например, 0 для read, 1 для write) перед вызовом инструкции SYSCALL.',
          hotspot: { left: '67%', top: '8%', width: '22%', height: '14%' }
        },
        { 
          name: 'Регистр RIP (Instruction Pointer)', 
          desc: 'Указатель инструкций CPU. При переходе в Ring 0 аппаратная инструкция переключает RIP на фиксированный обработчик системных вызовов в ядре.',
          hotspot: { left: '72%', top: '24%', width: '18%', height: '12%' }
        }
      ]
    }
  },
  {
    id: 'processes',
    number: 4,
    title: 'Процессы',
    mnemonic: 'FET',
    mnemonicExpansion: 'Fork → Exec → Terminate',
    epigraph: {
      text: 'Процесс — это адресное пространство с одним или несколькими потоками, исполняющимися в нём.',
      author: 'стандарт POSIX',
    },
    summary: 'fork клонирует, exec заменяет образ, zombie = родитель не вызвал wait().',
    explainer: [
      'Жизненный цикл процесса: FET. Новый процесс рождается через fork() — ядро создаёт почти точную копию родителя (то же адресное пространство по принципу copy-on-write, те же открытые дескрипторы). Сразу после этого потомок обычно делает exec() — заменяет свой образ на другую программу, сохраняя при этом PID. В конце — Terminate: процесс завершается и отдаёт код возврата родителю.',
      'Состояния процесса. R — выполняется или готов бежать; S (interruptible sleep) — спит в ожидании события и реагирует на сигналы; D (uninterruptible sleep) — ждёт I/O и не прерывается даже kill -9 (см. модуль «Синхронизация»); T — остановлен; Z (zombie) — уже завершился, но запись в таблице процессов ещё держится. Текущее состояние видно в колонке STAT (ps) и в /proc/PID/status.',
      'Откуда берутся зомби. Когда потомок завершается, ядро хранит его запись (PID и код возврата) до тех пор, пока родитель не «заберёт» её вызовом wait(). Если родитель этого не делает (баг или занятость) — потомок висит как Z. Сам зомби уже мёртв, ресурсов почти не ест и на kill не реагирует, поэтому лечить надо родителя (PPID): заставить его сделать wait() или перезапустить. Если родитель умер раньше, осиротевшего потомка усыновляет init/systemd (PID 1) и подчищает за ним.',
      'Где правда о процессе. Каталог /proc/PID/ — это досье: status (PID, PPID, состояние, память), cmdline (строка запуска, argv), exe (символическая ссылка на сам бинарник), fd/ (открытые дескрипторы), cwd (рабочий каталог). Это важно для безопасности: короткое имя comm и даже строку запуска cmdline процесс умеет переписать сам (тот же приём, что setproctitle, прав для этого не нужно). Надёжнее всего ссылка exe — подменить её на произвольный путь нельзя; а запуск из удалённого файла или памяти выдаёт себя пометкой «(deleted)». Поэтому маскировку вычисляют прежде всего по exe.',
      'Пример. В выводе ps -eo pid,ppid,stat,cmd виден процесс в состоянии Z. kill по его PID бесполезен — смотрим PPID и разбираемся с родителем. Процесс с «нормальным» именем вызывает подозрения: ls -l /proc/PID/exe покажет, откуда реально запущен бинарник (например из /tmp — красный флаг), а cat /proc/PID/cmdline — с какими аргументами он стартовал.',
    ],
    table: [
      { entity: 'PID', where: '/proc/PID/status', signal: 'идентификатор' },
      { entity: 'PPID', where: '/proc/PID/status', signal: 'родитель zombie' },
      { entity: 'cmdline', where: '/proc/PID/cmdline', signal: 'скрытое имя' },
      { entity: 'FD', where: 'ls /proc/PID/fd', signal: 'открытые файлы' },
    ],
    decisions: [
      { condition: 'Zombie (Z)', action: "ps -eo pid,ppid,stat,cmd | awk '$3~/Z/'" },
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
        explanation: '/proc/PID/cmdline показывает argv процесса, а короткое имя comm подменяется тривиально. Учтите: и сам cmdline процесс может переписать — окончательно надёжна лишь ссылка /proc/PID/exe.',
      },
    ],
    hardwareMap: {
      image: '/hardware/process_memory_layout.jpg',
      text: 'Логическое представление виртуальной памяти процесса (Virtual Memory Map) и её фактическое физическое размещение в аппаратных чипах DDR5 оперативной памяти.',
      details: [
        { 
          name: 'Сегмент Stack (Стек)', 
          desc: 'Виртуальная область памяти, которая растет вниз. Хранит локальные переменные функций и фреймы вызовов. Адрес стек-поинтера контролируется регистром ESP/RSP.',
          hotspot: { left: '10%', top: '13%', width: '16%', height: '16%' }
        },
        { 
          name: 'Сегмент Heap (Куча)', 
          desc: 'Область динамической памяти, выделяемая функциями malloc/new. Растет вверх в сторону стека. Граница кучи сдвигается системным вызовом brk/sbrk.',
          hotspot: { left: '10%', top: '37%', width: '16%', height: '17%' }
        },
        { 
          name: 'Сегменты Data и Code (Данные и Код)', 
          desc: 'Статические области: Code хранит скомпилированные машинные инструкции (только чтение), Data хранит глобальные и статические переменные программы.',
          hotspot: { left: '10%', top: '58%', width: '16%', height: '30%' }
        },
        { 
          name: 'Физические банки DDR5 (DIMM)', 
          desc: 'Физические микросхемы DRAM, распаянные на текстолите модуля памяти. Ядро Linux отображает виртуальные страницы (4 КБ) процесса на физические адреса в этих чипах.',
          hotspot: { left: '68%', top: '13%', width: '15%', height: '74%' }
        }
      ]
    }
  },
  {
    id: 'scheduler',
    number: 5,
    title: 'Планировщик процессов',
    mnemonic: 'EEVDF',
    mnemonicExpansion: 'Earliest Eligible Virtual Deadline First',
    epigraph: {
      text: 'CFS, по сути, моделирует „идеальный, точный многозадачный процессор“ на реальном железе.',
      author: 'Инго Молнар, документация CFS',
    },
    summary: 'Красно-чёрное дерево по vruntime. nice -20..19 меняет вес CPU.',
    explainer: [
      'Что вообще решает планировщик. На нескольких ядрах одновременно «готовы бежать» десятки и сотни процессов. Планировщик выбирает, кто из готовых (Ready) получит ядро и на сколько. Цель «честного» класса SCHED_OTHER — чтобы никто не простаивал слишком долго и интерактивные задачи оставались отзывчивыми.',
      'Как считается справедливость. Каждому процессу ведётся vruntime — виртуальное время исполнения, взвешенное по nice. В классическом CFS следующим на ядро шёл тот, у кого vruntime меньше (кто «меньше успел поработать»); кандидаты лежат в сбалансированном дереве, поэтому выбор быстрый. С ядра 6.6 дефолтным стал EEVDF — он опирается на ту же vruntime, но выбирает не строго минимальный vruntime, а задачу с самым ранним «виртуальным дедлайном» среди подходящих (с учётом лага), что улучшает отзывчивость. Базовая интуиция «кто меньше работал — тот и идёт» остаётся близкой.',
      'nice и реальный приоритет — разные вещи. nice (-20..19) меняет только вес внутри обычного класса: -20 — «жадный» до CPU, 19 — «уступчивый». Но nice не влияет на realtime: задачи RT-классов (SCHED_FIFO/RR) с их приоритетом стоят выше всего обычного класса и могут полностью вытеснить его.',
      'Где это кусается на практике. RT-процесс с багом (busy loop) способен почти полностью заголодить userspace; по умолчанию ядро ограничивает RT-классы (sched_rt_runtime_us ≈ 95%), оставляя 5% на остальных, но при отключённом throttling или на одном ядре система может встать колом. Диагностика: ps -eo cls,rtprio,pri,cmd находит класс FF/RR; chrt -p PID показывает политику, а chrt <policy> -p <prio> PID её меняет (например chrt -o -p 0 PID вернёт процесс в SCHED_OTHER). В контейнерах потолок задаёт cgroup через cpu.max.',
      'Пример. ps -eo pid,ni,cls,rtprio,psr,stat,cmd --sort=-rtprio | head поднимет наверх RT-задачи; если там оказалось что-то неожиданное (не аудио и не поток ядра) — это первый кандидат на расследование.',
    ],
    table: [
      { entity: 'nice', where: 'ps -eo ni,pri,cmd', signal: '-20 высший приоритет' },
      { entity: 'policy', where: 'chrt -p PID', signal: 'RT вытесняет обычные' },
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
    hardwareMap: {
      image: '/hardware/cpu_scheduler_queues.jpg',
      text: 'Аппаратное распределение задач планировщиком ядра Linux: физические ядра процессора (Core 0, Core 1) со своими очередями выполнения (Execution Queues) и аппаратный контроллер прерываний (APIC), управляющий квантованием времени.',
      details: [
        { 
          name: 'Ядра процессора (Core 0 / Core 1)', 
          desc: 'Физические вычислительные модули кристалла CPU, содержащие собственные регистры, арифметико-логические устройства (ALU) и кэш-память L1.',
          hotspot: { left: '34%', top: '10%', width: '54%', height: '78%' }
        },
        { 
          name: 'Аппаратный таймер APIC (Interrupt Controller)', 
          desc: 'Контроллер прерываний, генерирующий высокоточные периодические электрические импульсы (Timer Interrupts) для перехвата управления ядром и вызова планировщика.',
          hotspot: { left: '7%', top: '35%', width: '18%', height: '30%' }
        },
        { 
          name: 'Очереди задач и кванты времени (Time Slices)', 
          desc: 'Очередь готовых к запуску процессов (runqueue). На схеме показана диаграмма распределения времени (Time Slices) выполнения задач на каждом ядре.',
          hotspot: { left: '36%', top: '65%', width: '50%', height: '22%' }
        }
      ]
    }
  },
  {
    id: 'memory',
    number: 6,
    title: 'Память',
    mnemonic: 'VPS',
    mnemonicExpansion: 'Virtual · Paging · Swap',
    epigraph: {
      text: 'Любую проблему в информатике можно решить добавлением ещё одного уровня косвенности.',
      author: 'Дэвид Уилер',
    },
    summary: 'Page fault → подгрузка → swap → OOM Killer. si/so в vmstat = swap активен.',
    explainer: [
      'Виртуальная память — это иллюзия для процесса. Каждый процесс видит своё непрерывное адресное пространство, хотя физически его страницы разбросаны по RAM или вытеснены в swap. Перевод «виртуальный адрес → физический» делает аппаратный MMU по таблицам страниц, которые ведёт ядро.',
      'Page fault — это норма, а не ошибка. При первом обращении к странице её ещё нет в физической памяти: ядро ловит fault и подгружает страницу (с диска, из файла или просто обнуляет новую). «Мягкие» faults дёшевы. Проблемы начинаются, когда RAM заканчивается и ядро вынуждено вытеснять страницы в swap.',
      'Своппинг и OOM. Если рабочий набор больше RAM, система начинает безостановочно гонять страницы туда-сюда — в vmstat поля si/so стабильно больше нуля. Это thrashing: формально живо, фактически всё тормозит. Когда вытеснять уже некуда, включается OOM Killer: он выбирает процесс с наибольшим oom_score и убивает его, чтобы спасти систему.',
      'Что именно мерить. VmRSS — это реально занятая физическая память, и она важнее «виртуального размера», в который входит ещё не востребованное адресное пространство. free -h даёт общий баланс, vmstat 1 — динамику swap, а dmesg | grep -i oom — кого и когда прибил OOM Killer.',
      'Пример. Процесс подозревается в утечке: watch -n1 \'grep VmRSS /proc/<PID>/status\' покажет монотонный рост RSS. Если параллельно в vmstat поползли si/so и в dmesg появилась запись об oom-kill — это подтверждает, что течь довела систему до нехватки RAM.',
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
    hardwareMap: {
      image: '/hardware/ram_mmu_diagram.jpg',
      text: 'Физическая организация оперативной памяти (модуля DDR5) и аппаратного блока MMU (внутри CPU), отвечающего за разделение и трансляцию адресов.',
      details: [
        { 
          name: 'Блок MMU (Memory Management Unit)', 
          desc: 'Физический контроллер трансляции внутри кристалла CPU. Он переводит виртуальные адреса программ в физические номера ячеек на модуле памяти с помощью таблиц страниц и буфера TLB.',
          hotspot: { left: '19%', top: '23%', width: '37%', height: '48%' }
        },
        { 
          name: 'Модуль памяти (DDR5 RAM Stick)', 
          desc: 'Печатная плата с чипами памяти (DRAM). Здесь физически сохраняются байты в виде электрических зарядов на миллионах микроконденсаторов.',
          hotspot: { left: '49%', top: '30%', width: '42%', height: '62%' }
        },
        { 
          name: 'Линии трансляции адресов', 
          desc: 'Специфические электрические дорожки шины адреса (Address Bus), соединяющие контакты процессора с контактами модулей RAM для передачи выбранных адресов ячеек.',
          hotspot: { left: '40%', top: '10%', width: '40%', height: '22%' }
        }
      ]
    }
  },
  {
    id: 'sync',
    number: 7,
    title: 'Синхронизация',
    mnemonic: 'MSFR',
    mnemonicExpansion: 'Mutex · Semaphore · Futex · RCU',
    epigraph: {
      text: 'Конкурентность — это не параллелизм.',
      author: 'Роб Пайк',
    },
    summary: 'Userspace mutex → futex syscall → sleep в ядре. D state = uninterruptible I/O.',
    explainer: [
      'Зачем синхронизация. Когда несколько потоков или процессов одновременно трогают общие данные, без координации возникают гонки (race conditions) и порча данных. Примитивы синхронизации сериализуют доступ к критической секции — гарантируют, что в неё в каждый момент входит только один.',
      'Спектр примитивов по «цене». Spinlock крутится в busy-wait: дёшев на доли микросекунды внутри ядра, но жжёт CPU, пока ждёт. Mutex/futex при конфликте уходит в сон и не тратит процессор — это выбор для userspace. Semaphore — это счётчик для пула одинаковых ресурсов. RCU даёт почти бесплатное чтение без блокировок (читатели не ждут писателей) ценой отложенного освобождения старых версий.',
      'Как mutex работает «снизу». В неконкурентном случае pthread-мьютекс берётся целиком в userspace одной атомарной операцией — быстро, без обращения к ядру. И только когда блокировка уже занята, поток делает системный вызов futex и засыпает в очереди ожидания ядра; владелец при освобождении его будит. Поэтому всплеск futex в strace — индикатор реальной борьбы за блокировку.',
      'D state — частый «висяк». Процесс в состоянии D (uninterruptible sleep) ждёт завершения I/O и не реагирует даже на kill -9. Массовый D state вместе с высоким iowait в top означает, что упёрлись в диск или зависший NFS, а не в CPU.',
      'Пример. Сервис «завис», CPU низкий, а load average высокий. ps -eo pid,stat,wchan,cmd | grep \' D\' покажет процессы в D и точку ожидания в ядре (wchan) — часто это дисковый или сетевой путь. Лечится не киллом процесса, а устранением самой причины I/O.',
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
    hardwareMap: {
      image: '/hardware/cpu_cache_sync.jpg',
      text: 'Аппаратная синхронизация ядер процессора: когерентность многоуровневых кэшей CPU (L1, L2, L3) по протоколу MESI и физическая блокировка шины памяти (Bus Lock) при атомарных операциях.',
      details: [
        { 
          name: 'Индивидуальные кэши ядер (L1 / L2)', 
          desc: 'Сверхбыстрая память L1 and L2, расположенная непосредственно на каждом ядре. Изменение переменной в L1-кэше одного ядра делает её неактуальной в кэшах других ядер.',
          hotspot: { left: '17%', top: '11%', width: '66%', height: '35%' }
        },
        { 
          name: 'Когерентность кэшей (протокол MESI)', 
          desc: 'Аппаратный протокол (Modified, Exclusive, Shared, Invalid), координирующий состояние строк кэша по специальной шине для предотвращения рассинхронизации данных.',
          hotspot: { left: '76%', top: '54%', width: '18%', height: '17%' }
        },
        { 
          name: 'Системный замок шины (BUS LOCK)', 
          desc: 'Физический сигнал блокировки шины памяти со стороны CPU. Он предотвращает одновременный доступ других процессоров/устройств к RAM во время выполнения неделимых (атомарных) инструкций.',
          hotspot: { left: '57%', top: '74%', width: '16%', height: '8%' }
        }
      ]
    }
  },
  {
    id: 'ipc',
    number: 8,
    title: 'IPC',
    mnemonic: 'PFMS',
    mnemonicExpansion: 'Pipe · FIFO · mmap · Socket',
    epigraph: {
      text: 'Нужно уметь соединять программы, как садовый шланг: прикрутил ещё сегмент, когда данные надо обработать иначе.',
      author: 'Дуг Макилрой',
    },
    summary: 'Выбор IPC: родственные → pipe, большие данные → shm, сеть → socket.',
    explainer: [
      'Зачем процессам общаться и почему способов так много. Процессы изолированы — у каждого своё адресное пространство, и просто так залезть в память соседа нельзя. IPC (inter-process communication) — это механизмы, которыми ядро даёт процессам обмениваться данными. Способов несколько, потому что у задач разные требования: родственные процессы или чужие, пара байт или гигабайты, один хост или сеть. Мнемоника PFMS — четыре опорных варианта: Pipe · FIFO · mmap · Socket.',
      'Каналы: pipe и FIFO. Анонимный pipe (оператор | в оболочке) — однонаправленная труба между родственными процессами: вывод одного становится вводом другого. Именованный канал FIFO (создаётся mkfifo) — то же самое, но у него есть имя в файловой системе, поэтому через него могут общаться и неродственные процессы. Оба просты и надёжны, но данные на каждом шаге копируются через ядро.',
      'Разделяемая память — самый быстрый путь. Shared memory (POSIX-объекты в /dev/shm или общая область через mmap) даёт двум процессам один и тот же кусок физической памяти. После настройки обмен идёт без копирования и без обращения к ядру — поэтому это выбор для больших объёмов и высокой скорости. Плата за скорость — синхронизацию (кто и когда пишет, кто читает) вы организуете сами, обычно семафором (см. модуль «Синхронизация»).',
      'Сокеты — универсальный вариант. Unix-domain сокеты связывают процессы на одном хосте (быстро, с контролем доступа через права на файл сокета), а TCP/UDP-сокеты работают и по сети. Сокеты двунаправленны и умеют передавать между процессами даже открытые файловые дескрипторы, поэтому на них построено большинство современных демонов и шин — systemd, D-Bus, контейнерные рантаймы.',
      'Пример. Выбор по ситуации: связать команды в конвейер — pipe; отдавать данные неродственному демону — FIFO или Unix-сокет; перекачать гигабайты между процессами на одной машине — shared memory; общаться по сети — TCP-сокет. Для расследования: ipcs -a покажет сегменты разделяемой памяти и семафоры, а ss -xnp — какие процессы держат Unix-сокеты, с их PID и именем.',
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
    hardwareMap: {
      image: '/hardware/shared_memory_ipc.jpg',
      text: 'Аппаратная реализация IPC через разделяемую память: две изолированные виртуальные таблицы адресов процессов отображаются блоком MMU на один и тот же физический сегмент RAM.',
      details: [
        { 
          name: 'Виртуальная память процесса А', 
          desc: 'Изолированное адресное пространство процесса А. Его страницы с адресами PAGES A-0..A-3 преобразуются MMU в физические адреса.',
          hotspot: { left: '10%', top: '18%', width: '15%', height: '62%' }
        },
        { 
          name: 'Виртуальная память процесса B', 
          desc: 'Изолированное адресное пространство процесса B. Его страницы PAGES B-0..B-3 ссылаются на тот же физический сегмент RAM, что и страницы процесса А.',
          hotspot: { left: '74%', top: '18%', width: '15%', height: '62%' }
        },
        { 
          name: 'Физический сегмент RAM', 
          desc: 'Фактический блок памяти в DRAM чипах, куда оба процесса могут одновременно читать и писать байты без вызова ядра и копирования данных.',
          hotspot: { left: '37%', top: '23%', width: '25%', height: '48%' }
        }
      ]
    }
  },
  {
    id: 'filesystems',
    number: 9,
    title: 'Файловые системы',
    mnemonic: 'VID',
    mnemonicExpansion: 'VFS · Inode · Dentry',
    epigraph: {
      text: 'Всё есть файл.',
      author: 'философия UNIX',
    },
    summary: 'Путь к файлу: имя → dentry cache → inode → блоки на диске.',
    explainer: [
      'VFS — переходник между «файлом» и железом. Программы работают с файлами одинаково (open/read/write) независимо от того, лежит файл на ext4, XFS, Btrfs, сетевой NFS или вообще в виртуальной /proc. Эту единую абстракцию даёт VFS (Virtual File System) — слой ядра, переводящий общие операции в вызовы конкретной файловой системы. Мнемоника VID (VFS · Inode · Dentry) — три кита, на которых держится путь к данным.',
      'Inode — это и есть файл, только без имени. Вся метаинформация — права, владелец, размер, времена и указатели на блоки данных — хранится в inode. Имени файла в inode нет: имя живёт в каталоге как запись, связывающая строку «file.txt» с номером inode. Отсюда два следствия: один inode может иметь несколько имён (жёсткие ссылки), а переименование файла не трогает его данные — меняется лишь запись в каталоге.',
      'Dentry cache ускоряет разбор пути. Чтобы открыть /home/user/file, ядро разбирает путь покомпонентно и на каждом шаге ищет соответствие имя → inode. Чтобы не читать каталоги с диска каждый раз, результаты кэшируются в dentry cache (его объём виден в slabtop). Поэтому повторный доступ к тем же путям получается быстрым.',
      'Две независимые «ёмкости»: блоки и inode. Место может кончиться двумя разными способами. Блоки данных (df -h) исчерпываются большими файлами. Но число inode (df -i) на ext-разделе фиксировано при создании ФС, и оно заканчивается при множестве мелких файлов — тогда запись падает с «No space left», хотя df -h показывает свободные гигабайты. Классическая ловушка, которую без df -i не разгадать (XFS и Btrfs выделяют inode динамически и ей не подвержены).',
      'Пример. «No space left», а df -h уверяет, что место есть → df -i: скорее всего исчерпаны inode (часто из-за мусора в кэше или почтовом спуле). Удалили большой лог через rm, но место не вернулось → файл всё ещё открыт процессом: lsof | grep deleted найдёт «висящий» дескриптор; место освободится, когда процесс закроет файл или будет перезапущен.',
    ],
    table: [
      { entity: 'VFS', where: '/proc/mounts', signal: 'единый API для всех FS' },
      { entity: 'Dentry', where: '/proc/slabinfo (dentry) или slabtop', signal: 'кэш имён каталогов' },
      { entity: 'Inode', where: 'ls -i, stat', signal: 'метаданные + inode exhaustion' },
      { entity: 'Superblock', where: 'dumpe2fs /dev/sdX', signal: 'corrupt FS' },
      { entity: 'Journal', where: 'tune2fs -l /dev/sdX', signal: 'журнал транзакций' },
      { entity: '/etc', where: 'hash baseline', signal: 'конфигурация — защищать' },
      { entity: '/bin, /sbin', where: 'find -perm -4000', signal: 'бинарники — SUID audit' },
      { entity: '/home', where: 'ls -la /home', signal: 'права 700 на каталоги' },
      { entity: '/tmp', where: 'ls -ld /tmp; findmnt /tmp', signal: 'sticky bit (дефолт); noexec — опц. харденинг, не дефолт' },
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
    hardwareMap: {
      image: '/hardware/storage_sectors.jpg',
      text: 'Сопоставление файловых абстракций Linux с физическим устройством хранения: дорожками и магнитными головками HDD, а также страницами и блоками полупроводникового SSD.',
      details: [
        { 
          name: 'Магнитные пластины HDD (Platters)', 
          desc: 'Круглые алюминиевые пластины, покрытые ферромагнитным слоем. Данные делятся на физические дорожки (tracks) и сектора (sectors) по 512 байт или 4 КБ. На них и отображаются блоки файловой системы.',
          hotspot: { left: '16%', top: '21%', width: '31%', height: '56%' }
        },
        { 
          name: 'Блок магнитных головок (Actuator / Heads)', 
          desc: 'Рычаг с катушкой, который парит на воздушной подушке в нанометрах над поверхностью вращающейся пластины. Он физически считывает или намагничивает сектора.',
          hotspot: { left: '5%', top: '51%', width: '15%', height: '24%' }
        },
        { 
          name: 'Контроллер SSD (SSD Controller)', 
          desc: 'Специальный микрокомпьютер внутри SSD, который распределяет записи для предотвращения износа ячеек и транслирует логические адреса (LBA) в физические адреса флеш-памяти (FTL).',
          hotspot: { left: '55%', top: '20%', width: '22%', height: '24%' }
        },
        { 
          name: 'Блок ячеек флеш-памяти (NAND Flash Cell)', 
          desc: 'Сложная полупроводниковая матрица. Запись на SSD происходит страницами (обычно 4 КБ или 8 КБ), но стирание ячеек возможно только целыми физическими блоками (блоки стирания, обычно 2–8 МБ). Из-за этого возникает фрагментация.',
          hotspot: { left: '62%', top: '46%', width: '22%', height: '42%' }
        }
      ]
    }
  },
  {
    id: 'block-io',
    number: 10,
    title: 'Блочный I/O',
    mnemonic: 'FBD',
    mnemonicExpansion: 'Filesystem → Block layer → Device',
    epigraph: {
      text: 'Память — это новый диск, диск — это новая лента.',
      author: 'Джим Грей',
    },
    summary: 'Приложение → FS → block layer → драйвер → диск. iowait = диск bottleneck.',
    explainer: [
      'Что такое блочное устройство. Диски (HDD, SSD, NVMe) — это блочные устройства: данные читаются и пишутся фиксированными блоками и в произвольном порядке, в отличие от потоковых, «символьных», устройств. Между прикладной программой и пластиной или флеш-памятью лежит несколько слоёв ядра, и узкое место чаще оказывается именно здесь, а не в процессоре. Мнемоника FBD перечисляет участников по ходу запроса сверху вниз: Filesystem → Block layer → Device.',
      'Путь запроса вниз. read() или write() от приложения попадает в файловую систему (ext4/XFS), которая переводит «файл + смещение» в номера блоков устройства. Дальше блочный слой (block layer) собирает запросы в очередь, объединяет соседние и упорядочивает их планировщиком ввода-вывода, после чего драйвер устройства передаёт их контроллеру. По направлению движения сверху вниз порядок такой: ФС → блочный слой → драйвер → устройство.',
      'Что ещё стоит на пути. Часто между ФС и железом есть слои device-mapper — LVM и шифрование LUKS (видны в lsblk -f). Блочный слой использует планировщик (/sys/block/*/queue/scheduler — обычно mq-deadline, а для NVMe нередко none). А чтобы реже обращаться к диску вообще, ядро держит page cache: повторные чтения обслуживаются прямо из RAM.',
      'Главный симптом — iowait. Когда CPU простаивает в ожидании диска, это видно как iowait в top и vmstat и как высокие await и %util в iostat -x. Высокий iowait означает, что система упёрлась в диск (I/O-bound), а не в процессор. Параллельно стоит проверить здоровье самого носителя — smartctl -a: растущие Reallocated_Sector или ошибки часто и есть причина «тормозов».',
      'Пример. Всё тормозит, CPU свободен. iostat -x 1 показывает %util около 100% и большой await на /dev/sda → диск насыщен. iotop -o назовёт процесс, который реально читает или пишет (например ночной бэкап или индексатор). Если же нагрузки нет, а диск всё равно медленный и в dmesg сыплются ошибки I/O — smartctl -a проверит, не умирает ли носитель.',
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
    hardwareMap: {
      image: '/hardware/dma_block_io.jpg',
      text: 'Аппаратный ввод-вывод данных (Block I/O) и механизм DMA (Direct Memory Access): передача блоков данных контроллером диска в оперативную память напрямую по шине System Bus без нагрузки на процессор.',
      details: [
        { 
          name: 'Дисковый контроллер и сектора', 
          desc: 'Собственный микропроцессор накопителя (SSD/HDD), который управляет чтением секторов и формирует блоки данных для отправки.',
          hotspot: { left: '7%', top: '32%', width: '28%', height: '34%' }
        },
        { 
          name: 'Контроллер DMA (Direct Memory Access)', 
          desc: 'Специальный аппаратный блок (движок DMA), который берет на себя управление шиной данных для непосредственной пересылки байт в память RAM.',
          hotspot: { left: '23%', top: '44%', width: '11%', height: '22%' }
        },
        { 
          name: 'Шина данных System Bus', 
          desc: 'Физическая системная шина материнской платы, по которой транслируются потоки данных от контроллера в ячейки памяти.',
          hotspot: { left: '44%', top: '51%', width: '31%', height: '8%' }
        },
        { 
          name: 'Физическая память RAM', 
          desc: 'Ячейки оперативной памяти (DDR5), куда записываются страницы кэша (Page Cache). Ввод-вывод завершается генерацией прерывания для CPU.',
          hotspot: { left: '74%', top: '32%', width: '21%', height: '36%' }
        }
      ]
    }
  },
  {
    id: 'networking',
    number: 11,
    title: 'Сеть',
    mnemonic: 'STN',
    mnemonicExpansion: 'Socket · TCP stack · Netfilter',
    epigraph: {
      text: 'Сеть — это компьютер.',
      author: 'Джон Гейдж, Sun Microsystems',
    },
    summary: 'Пакет: NIC → стек → netfilter → socket → приложение.',
    explainer: [
      'Как пакет попадает в программу. Сетевая карта (NIC) принимает кадр и сигналит ядру; сетевой стек разбирает заголовки слой за слоем (Ethernet → IP → TCP/UDP), пакет проходит через netfilter (фаервол), ядро находит сокет, которому он адресован, и кладёт данные в его буфер — откуда их и читает приложение. Мнемоника STN — ключевые звенья: Socket · TCP stack · Netfilter.',
      'Сокет — точка входа приложения в сеть. Сервер делает bind() на пару адрес:порт и слушает (listen) — это «слушающий» сокет. Если программа слушает 0.0.0.0:порт, она доступна со всех интерфейсов, в том числе извне; если 127.0.0.1:порт — только локально. Команда ss -tulnp выводит все слушающие TCP/UDP-сокеты вместе с процессом (PID и имя) — это первое, что смотрят на вопрос «что у меня открыто наружу».',
      'Netfilter — фаервол внутри ядра. Весь трафик проходит через хуки netfilter, где правила решают: пропустить, отбросить или перенаправить пакет. Сегодня правила задаёт nftables (nft list ruleset); привычный iptables — это совместимый фронтенд к тому же механизму. Здесь же живут NAT и conntrack — таблица отслеживания соединений; её переполнение (виден через conntrack -L, «table full» в dmesg) роняет новые соединения на нагруженных шлюзах.',
      'Диагностика — снизу вверх. Линк: ip -br link и ip -br addr — поднят ли интерфейс (не в DOWN). Маршрутизация: ip route — есть ли маршрут и шлюз по умолчанию, плюс ping шлюза. Имена: DNS (getent hosts имя, /etc/resolv.conf) — частая причина ситуации «интернета нет, а ping по IP идёт». Транспорт и приложение: ss -tulnp — слушает ли сервис нужный порт, и не режет ли его фаервол.',
      'Пример. «Сервис не отвечает снаружи». На сервере ss -tlnp: если он слушает 127.0.0.1:порт вместо 0.0.0.0 — наружу он принципиально недоступен (правится в конфиге сервиса). Если слушает 0.0.0.0, но снаружи всё равно тишина — nft list ruleset проверит, не блокирует ли порт фаервол. А неизвестный слушающий порт всегда сопоставляйте с процессом через ss -tlnp (PID и имя) и ls -l /proc/PID/exe.',
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
    hardwareMap: {
      image: '/hardware/ethernet_port.jpg',
      text: 'Аппаратный уровень сети: физический разъем RJ-45, защитный изолирующий трансформатор и чип контроллера сетевой карты, кодирующий биты в аналоговые электрические сигналы.',
      details: [
        { 
          name: 'Сетевой разъем RJ-45 и кабель (CAT6)', 
          desc: 'Физический интерфейс подключения. Витая пара CAT6 содержит 8 медных жил. На схеме отмечены контакты приема (RX) и передачи (TX) электрических сигналов.',
          hotspot: { left: '4%', top: '48%', width: '28%', height: '37%' }
        },
        { 
          name: 'LAN-трансформатор (LAN Transformer)', 
          desc: 'Физический элемент гальванической развязки и фильтрации помех. Он защищает чувствительный чип сетевой карты от скачков напряжения и статического электричества в длинных кабелях.',
          hotspot: { left: '40%', top: '47%', width: '15%', height: '22%' }
        },
        { 
          name: 'Контроллер сетевой карты (Ethernet Controller)', 
          desc: 'Собственная микросхема (PHY/MAC чип) на плате. Она преобразует поток цифровых байт, приходящих от процессора компьютера по шине PCIe, в аналоговый сигнал определенной частоты и передает его в кабель.',
          hotspot: { left: '55%', top: '23%', width: '24%', height: '25%' }
        },
        { 
          name: 'Медные дорожки передачи данных (Differential Pairs)', 
          desc: 'Выверенные по длине парные дорожки на текстолите платы. По ним идут высокочастотные дифференциальные электрические сигналы между трансформатором и контроллером.',
          hotspot: { left: '33%', top: '15%', width: '20%', height: '31%' }
        }
      ]
    }
  },
  {
    id: 'security',
    number: 12,
    title: 'Безопасность',
    mnemonic: 'CAPNS',
    mnemonicExpansion: 'Capabilities · AppArmor · PAM · Namespaces · Seccomp',
    epigraph: {
      text: 'По-настоящему безопасна лишь система, которая выключена, залита в бетон и заперта в свинцовой комнате под охраной, — да и тогда я не поручусь.',
      author: 'Юджин Спаффорд',
    },
    summary: 'Защита в глубину: DAC → capabilities → LSM → namespaces → seccomp.',
    explainer: [
      'Защита в глубину, а не единственный забор. Безопасность Linux собрана из нескольких независимых слоёв, и атакующему нужно пробить каждый. Базовый слой — DAC (права владелец/группа/прочие), затем дробление root на capabilities, поверх — мандатный контроль LSM (AppArmor или SELinux), изоляция через namespaces и фильтр системных вызовов seccomp. Мнемоника CAPNS перечисляет эти рубежи; падение одного из них ещё не означает компрометацию всей системы. Тонкость осей: на схеме слои стоят в порядке исполнения во время syscall — seccomp срабатывает первым, прямо на входе в ядро, а DAC, capabilities и LSM проверяются уже внутри обработчика вызова; перечисление выше и мнемоника CAPNS идут по логике защиты в глубину (от привычного DAC к продвинутым рубежам), а не по моменту срабатывания.',
      'DAC и опасность SUID. Обычные права (rwx для owner/group/other) — это дискреционный контроль: их назначает владелец файла. Особый случай — бит SUID: программа с ним выполняется с правами владельца файла, а не того, кто её запустил. SUID-бинарник, принадлежащий root (например passwd, sudo), нужен по делу, но любой лишний или незнакомый SUID-root — прямой путь к повышению привилегий. Инвентаризация: find / -perm -4000 -type f 2>/dev/null.',
      'Capabilities дробят всемогущество root. Раньше было «или root, или никто». Capabilities разбивают права суперпользователя на отдельные способности: например CAP_NET_BIND_SERVICE (слушать порты ниже 1024), CAP_NET_RAW (сырые сокеты — например traceroute или сниффинг; современный ping их уже не требует), CAP_SYS_ADMIN (почти всё сразу). Демону можно выдать только нужную способность вместо полного root; getcap покажет, у каких бинарников какие capabilities выставлены.',
      'Изоляция: LSM, namespaces, seccomp — фундамент контейнеров. LSM (AppArmor работает по профилям путей, SELinux — по меткам-контекстам) ограничивает то, что процесс вообще может, даже будучи root: состояние смотрят через aa-status или sestatus. Namespaces дают процессу собственный изолированный вид системы — свои PID, сеть, точки монтирования (lsns), а cgroups v2 при этом лимитируют ресурсы. seccomp обрезает набор доступных процессу системных вызовов. Вместе это и есть то, на чём стоят Docker и песочницы systemd.',
      'Пример. Аудит хоста. find / -perm -4000 2>/dev/null сверяют с эталоном — новый SUID-root вне списка штатных подозрителен. sudo -l показывает, что текущему пользователю разрешено через sudo (и нет ли там опасного NOPASSWD на оболочку). aa-status или sestatus подтвердят, что мандатная защита реально включена (enforce), а не просто числится. Для контейнера grep Seccomp /proc/PID/status и lsns скажут, изолирован ли он на самом деле.',
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
    hardwareMap: {
      image: '/hardware/tpm_hardware_security.jpg',
      text: 'Аппаратная безопасность системы: выделенный чип TPM 2.0 для криптографического контроля целостности загрузки, и физическая изолированная зона выполнения Secure Enclave.',
      details: [
        { 
          name: 'Чип TPM 2.0 (Trusted Platform Module)', 
          desc: 'Специализированная защищенная микросхема на плате. Она аппаратно вычисляет хэши компонентов загрузки (PCR), безопасно хранит ключи шифрования диска (LUKS) и генерирует истинно случайные числа.',
          hotspot: { left: '38%', top: '35%', width: '23%', height: '27%' }
        },
        { 
          name: 'Изолированная зона Secure Enclave', 
          desc: 'Аппаратно защищенная область процессора (Secure World / TrustZone). Работающий в ней код изолирован от основной операционной системы и ядра Linux на уровне трансляции шин данных.',
          hotspot: { left: '26%', top: '12%', width: '47%', height: '74%' }
        },
        { 
          name: 'Микросхема BIOS/UEFI ROM', 
          desc: 'Flash-память BIOS. С её чтения начинается запуск системы; TPM измеряет её хэш для проверки, не была ли прошивка модифицирована.',
          hotspot: { left: '4%', top: '44%', width: '13%', height: '21%' }
        }
      ]
    }
  },
]

export function getModule(id: string): Module | undefined {
  return MODULES.find((m) => m.id === id)
}
