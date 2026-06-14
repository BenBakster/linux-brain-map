import type { QuizQuestion } from './modules'

export type IbmConcept = {
  term: string
  meaning: string
  signal: string
}

export type IbmTopic = {
  id: string
  number: number
  title: string
  mnemonic: string
  summary: string
  concepts: IbmConcept[]
  takeaways: string[]
  quiz: QuizQuestion[]
}

export const KILL_CHAIN = [
  {
    stage: 'Reconnaissance',
    ru: 'Разведка',
    detail: 'Сбор адресов, доменов, сотрудников, технологий и другой информации о цели.',
    defense: 'Уменьшать публичный след, отслеживать сканирование и утечки учётных данных.',
  },
  {
    stage: 'Weaponization',
    ru: 'Подготовка',
    detail: 'Связка эксплойта с полезной нагрузкой или бэкдором.',
    defense: 'Threat intelligence, управление уязвимостями и безопасная конфигурация.',
  },
  {
    stage: 'Delivery',
    ru: 'Доставка',
    detail: 'Передача через почту, веб, съёмный носитель или цепочку поставок.',
    defense: 'Фильтрация почты и веба, обучение пользователей, контроль устройств.',
  },
  {
    stage: 'Exploitation',
    ru: 'Эксплуатация',
    detail: 'Использование уязвимости для выполнения кода на системе жертвы.',
    defense: 'Патчи, hardening, EDR и ограничение исполняемого контента.',
  },
  {
    stage: 'Installation',
    ru: 'Установка',
    detail: 'Закрепление вредоносного кода или другого механизма persistence.',
    defense: 'Application control, контроль автозапуска и мониторинг изменений.',
  },
  {
    stage: 'Command & Control',
    ru: 'Управление',
    detail: 'Удалённый канал, через который оператор управляет скомпрометированной системой.',
    defense: 'DNS/proxy/network monitoring, egress-фильтрация и сегментация.',
  },
  {
    stage: 'Actions on Objectives',
    ru: 'Действия по цели',
    detail: 'Кража, шифрование, уничтожение данных, мошенничество или нарушение работы.',
    defense: 'DLP, резервные копии, журналирование и отработанный incident response.',
  },
] as const

export const ATTACK_TACTICS = [
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
] as const

export const IBM_TOPICS: IbmTopic[] = [
  {
    id: 'security-foundations',
    number: 1,
    title: 'Основы информационной безопасности',
    mnemonic: 'CIA + AAN',
    summary:
      'Безопасность описывается не одним замком, а свойствами данных: конфиденциальностью, целостностью, доступностью, подлинностью, подотчётностью и неотказуемостью.',
    concepts: [
      {
        term: 'Confidentiality',
        meaning: 'Данные доступны только авторизованным субъектам.',
        signal: 'Шифрование, контроль доступа, физическая защита.',
      },
      {
        term: 'Integrity',
        meaning: 'Данные не изменены или не уничтожены без разрешения.',
        signal: 'Хэши, HMAC, цифровые подписи, контроль версий.',
      },
      {
        term: 'Availability',
        meaning: 'Информация и сервис доступны вовремя и в требуемом объёме.',
        signal: 'RAID, кластеры, резервирование провайдера, backups.',
      },
      {
        term: 'Authenticity',
        meaning: 'Объект или сообщение действительно принадлежат заявленному источнику.',
        signal: 'Сертификаты, подписи, проверка идентичности.',
      },
      {
        term: 'Accountability',
        meaning: 'Действия можно связать с конкретной идентичностью.',
        signal: 'Именные учётные записи, журналы и audit trail.',
      },
      {
        term: 'Non-repudiation',
        meaning: 'Отправитель или получатель не может правдоподобно отрицать действие.',
        signal: 'Цифровая подпись, защищённые метки времени и логи.',
      },
    ],
    takeaways: [
      'Шифрование поддерживает конфиденциальность, но само по себе не гарантирует доступность.',
      'Хэш обнаруживает изменение; цифровая подпись дополнительно связывает данные с владельцем ключа.',
      'Backup полезен только после проверенного восстановления.',
    ],
    quiz: [
      {
        question: 'Какое свойство проверяет, что данные не были незаметно изменены?',
        options: ['Integrity', 'Availability', 'Confidentiality', 'Accounting'],
        correctIndex: 0,
        explanation: 'Целостность отвечает за обнаружение несанкционированного изменения или уничтожения.',
      },
      {
        question: 'Что лучше всего поддерживает non-repudiation?',
        options: ['Цифровая подпись', 'RAID', 'Сжатие', 'NAT'],
        correctIndex: 0,
        explanation: 'Подпись позволяет проверить источник и целостность подписанных данных.',
      },
    ],
  },
  {
    id: 'identity-access',
    number: 2,
    title: 'Идентичность и управление доступом',
    mnemonic: 'IAAA',
    summary:
      'Сначала субъект называется, затем доказывает личность, получает разрешения, а его действия учитываются: Identification → Authentication → Authorization → Accountability.',
    concepts: [
      {
        term: 'Authentication factors',
        meaning: 'Что знаешь, что имеешь, кем являешься.',
        signal: 'Пароль + токен/смарт-карта + биометрия.',
      },
      {
        term: 'SSO',
        meaning: 'Одна аутентификация открывает несколько доверяющих сервисов.',
        signal: 'Kerberos, федерация идентичности; единая точка требует усиленной защиты.',
      },
      {
        term: 'DAC',
        meaning: 'Владелец объекта назначает доступ.',
        signal: 'Классические Unix owner/group/mode и ACL.',
      },
      {
        term: 'MAC',
        meaning: 'Доступ определяется централизованной политикой и метками.',
        signal: 'Военные/регулируемые среды, SELinux.',
      },
      {
        term: 'RBAC',
        meaning: 'Права назначаются ролям, пользователи получают роли.',
        signal: 'Упрощает управление доступом по должностным функциям.',
      },
      {
        term: 'Control types',
        meaning: 'Administrative, technical и physical; preventive, detective, corrective и другие.',
        signal: 'Политика + MFA + замок работают как защита в глубину.',
      },
    ],
    takeaways: [
      'Need to know и least privilege ограничивают доступ только необходимым объёмом.',
      'Разделение обязанностей снижает риск злоупотребления одной учётной записью.',
      'Периодическая проверка прав, ротация обязанностей и журналирование замыкают цикл контроля.',
    ],
    quiz: [
      {
        question: 'На каком шаге определяется, что пользователь может делать?',
        options: ['Authorization', 'Identification', 'Authentication', 'Availability'],
        correctIndex: 0,
        explanation: 'Authentication подтверждает личность, authorization назначает разрешённые действия.',
      },
      {
        question: 'Какая модель выдаёт права через должностные роли?',
        options: ['RBAC', 'DAC', 'MAC', 'RAID'],
        correctIndex: 0,
        explanation: 'Role-Based Access Control связывает пользователей с ролями, а роли с правами.',
      },
    ],
  },
  {
    id: 'governance-incidents',
    number: 3,
    title: 'Governance и инциденты',
    mnemonic: 'PIRR',
    summary:
      'Управление задаёт правила до инцидента, а incident response превращает событие в контролируемый процесс: Prepare → Identify → Respond → Recover/Improve.',
    concepts: [
      {
        term: 'Policy',
        meaning: 'Обязательное правило и намерение руководства.',
        signal: 'Что требуется и почему; детали реализации живут в процедурах.',
      },
      {
        term: 'Procedure',
        meaning: 'Повторяемые шаги выполнения политики.',
        signal: 'Кто, когда, чем и в какой последовательности действует.',
      },
      {
        term: 'Framework / baseline',
        meaning: 'Структура практик и минимальный набор контролей.',
        signal: 'COBIT, ITIL, ISO, COSO и отраслевые рекомендации.',
      },
      {
        term: 'Compliance',
        meaning: 'Соответствие обязательным нормам и договорным требованиям.',
        signal: 'SOX, HIPAA, GLBA, PCI DSS в зависимости от юрисдикции и отрасли.',
      },
      {
        term: 'Audit',
        meaning: 'Независимая проверка требований, доказательств и эффективности контролей.',
        signal: 'Scope → evidence → tests → findings → remediation.',
      },
      {
        term: 'Incident management',
        meaning: 'Обнаружение, анализ, сдерживание, устранение, восстановление и lessons learned.',
        signal: 'Событие становится инцидентом после оценки влияния и нарушения политики.',
      },
    ],
    takeaways: [
      'Policy не заменяет procedure: правило без исполнимых шагов трудно проверить.',
      'Compliance задаёт нижнюю границу, а не доказательство полной безопасности.',
      'После восстановления нужны root cause и корректирующие действия, иначе инцидент повторится.',
    ],
    quiz: [
      {
        question: 'Что содержит конкретные повторяемые шаги работы?',
        options: ['Procedure', 'Policy', 'Risk appetite', 'Asset inventory'],
        correctIndex: 0,
        explanation: 'Процедура переводит политику в последовательность исполнимых действий.',
      },
      {
        question: 'Что должно идти после восстановления сервиса?',
        options: ['Lessons learned', 'Удаление логов', 'Отключение мониторинга', 'Новый пароль всем'],
        correctIndex: 0,
        explanation: 'Разбор причин и улучшение контролей закрывают цикл incident response.',
      },
    ],
  },
  {
    id: 'threats-assessment-forensics',
    number: 4,
    title: 'Угрозы, assessment и форензика',
    mnemonic: 'TAVF',
    summary:
      'Threat actor имеет мотив и возможности; assessment ищет слабости, pentest проверяет эксплуатацию, форензика сохраняет и объясняет цифровые доказательства.',
    concepts: [
      {
        term: 'Threat actors',
        meaning: 'Script kiddies, hacktivists, преступные группы, insiders, конкуренты и государства.',
        signal: 'Мотив, ресурсы, доступ и устойчивость отличают профиль угрозы.',
      },
      {
        term: 'Vulnerability assessment',
        meaning: 'Систематический поиск и приоритизация уязвимостей.',
        signal: 'Asset → weakness → likelihood/impact → remediation.',
      },
      {
        term: 'Penetration test',
        meaning: 'Разрешённая попытка подтвердить, что слабость реально эксплуатируется.',
        signal: 'Scope, rules of engagement, доказательство и отчёт без лишнего ущерба.',
      },
      {
        term: 'OWASP',
        meaning: 'Практические категории рисков и рекомендации для web/mobile приложений.',
        signal: 'Использовать актуальную версию, а старые списки со слайдов считать историческими.',
      },
      {
        term: 'Digital forensics',
        meaning: 'Идентификация, сбор, восстановление, анализ, проверка и представление доказательств.',
        signal: 'Целостность носителя и chain of custody важнее скорости просмотра.',
      },
      {
        term: 'Forensic toolkit',
        meaning: 'Write blockers, Faraday bag, FTK, EnCase, Autopsy/The Sleuth Kit и средства памяти.',
        signal: 'Инструмент выбирают по источнику данных и требованиям доказательности.',
      },
    ],
    takeaways: [
      'Сканер сообщает о вероятной слабости; pentest подтверждает путь атаки в согласованном scope.',
      'Форензика работает с копией, фиксирует хэши и документирует каждое действие.',
      'Старые OWASP Top 10 на снимках полезны как история, но не как актуальный стандарт.',
    ],
    quiz: [
      {
        question: 'Что отличает pentest от vulnerability assessment?',
        options: ['Подтверждение эксплуатации', 'Полное отсутствие scope', 'Удаление логов', 'Только физический доступ'],
        correctIndex: 0,
        explanation: 'Pentest пытается подтвердить практический путь эксплуатации в разрешённых границах.',
      },
      {
        question: 'Зачем форензике write blocker?',
        options: ['Не менять исследуемый носитель', 'Ускорить сеть', 'Расшифровать пароль', 'Сжать образ'],
        correctIndex: 0,
        explanation: 'Write blocker предотвращает запись на исходный носитель и помогает сохранить доказательность.',
      },
    ],
  },
  {
    id: 'cryptography',
    number: 5,
    title: 'Криптография',
    mnemonic: 'PCAE',
    summary:
      'Plaintext проходит через cipher с ключом и становится ciphertext; безопасность должна зависеть от ключа и проверенного алгоритма, а не от секретности схемы.',
    concepts: [
      {
        term: 'Plaintext / ciphertext',
        meaning: 'Исходные данные и результат шифрования.',
        signal: 'Алгоритм + ключ преобразуют сообщение в обе стороны.',
      },
      {
        term: 'Symmetric encryption',
        meaning: 'Один общий секретный ключ используется для шифрования и расшифрования.',
        signal: 'Быстро, но требует безопасного обмена ключом.',
      },
      {
        term: 'Stream cipher',
        meaning: 'Обрабатывает поток по битам или байтам.',
        signal: 'Критично не повторять nonce/keystream.',
      },
      {
        term: 'Block cipher',
        meaning: 'Обрабатывает блоки фиксированного размера в выбранном режиме.',
        signal: 'Режим и IV/nonce так же важны, как сам алгоритм.',
      },
      {
        term: 'Cryptographic attacks',
        meaning: 'Brute force, rainbow tables, social engineering, known/chosen plaintext.',
        signal: 'Соль и медленный password hash мешают готовым таблицам.',
      },
      {
        term: 'DES / 3DES',
        meaning: 'Исторические 64-битные блочные шифры с эффективным ключом DES 56 бит.',
        signal: 'Учебный пример; для новых систем устарели, выбирать современные AEAD.',
      },
    ],
    takeaways: [
      'XOR обратим, но не становится безопасным без правильно созданного и защищённого ключевого потока.',
      'Длина ключа не спасает слабый алгоритм, режим или управление ключами.',
      'Для новых систем предпочтительны проверенные AEAD-конструкции, например AES-GCM или ChaCha20-Poly1305.',
    ],
    quiz: [
      {
        question: 'Главная операционная проблема симметричного шифрования?',
        options: ['Безопасный обмен ключом', 'Невозможность шифровать файлы', 'Отсутствие plaintext', 'Только 8-битные данные'],
        correctIndex: 0,
        explanation: 'Обе стороны должны получить один секрет, не раскрыв его посторонним.',
      },
      {
        question: 'Как следует воспринимать DES сегодня?',
        options: ['Как устаревший учебный алгоритм', 'Как лучший выбор для новых систем', 'Как хэш-функцию', 'Как протокол SSO'],
        correctIndex: 0,
        explanation: '56-битный ключ DES недостаточен; современные системы используют более стойкие конструкции.',
      },
    ],
  },
  {
    id: 'operating-systems',
    number: 6,
    title: 'Файлы, команды и права',
    mnemonic: 'FPRO',
    summary:
      'Файловая система хранит данные и метаданные в иерархии; в Linux всё начинается с /, а доступ читается как type + owner/group/other + rwx.',
    concepts: [
      {
        term: 'Filesystem hierarchy',
        meaning: 'Файлы и каталоги образуют дерево; / — корень Linux, а /root — домашний каталог root.',
        signal: 'Не путать корневой каталог с учётной записью суперпользователя.',
      },
      {
        term: 'File commands',
        meaning: 'cp, mv, ls, mkdir, rmdir/rm, cat, more/less, tail, nano.',
        signal: 'Перед destructive-командой проверять путь и текущий каталог.',
      },
      {
        term: 'System commands',
        meaning: 'ifconfig/ip, locate/find, kill, chmod и chown.',
        signal: 'Предпочитать современные ip/ss; locate зависит от обновлённой базы.',
      },
      {
        term: 'Run levels',
        meaning: 'Историческая SysV-модель режимов 0–6.',
        signal: 'В systemd используются targets; runlevels нужны для чтения старых систем.',
      },
      {
        term: 'rwx and octal',
        meaning: 'read=4, write=2, execute=1 для owner, group и other.',
        signal: 'chmod 750 = rwx для owner, r-x для group, --- для other.',
      },
      {
        term: 'Ownership',
        meaning: 'chown меняет владельца и группу объекта.',
        signal: 'chown user:group file; изменение владельца требует соответствующих прав.',
      },
    ],
    takeaways: [
      'Каталог использует x как право прохода, а не запуска файла.',
      'chmod меняет mode bits, chown — владельца; это разные операции.',
      'Старые команды и runlevels со снимков полезны для legacy, но проект помечает современные аналоги.',
    ],
    quiz: [
      {
        question: 'Что означает chmod 750?',
        options: ['rwxr-x---', 'rwxrwxrwx', 'rw-r-----', 'r-xr-x---'],
        correctIndex: 0,
        explanation: '7=4+2+1, 5=4+1, 0 не даёт прав.',
      },
      {
        question: 'Чем /root отличается от /?',
        options: ['Это home root, а / — корень дерева', 'Ничем', '/root — Windows-диск', '/ — только временный каталог'],
        correctIndex: 0,
        explanation: '/ — начало всей иерархии, /root — один каталог внутри неё.',
      },
    ],
  },
]
