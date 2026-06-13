export type HygieneItem = {
  id: string
  section: string
  moduleRef?: number
  text: string
}

export const HYGIENE_ITEMS: HygieneItem[] = [
  // §1 Архитектура
  { id: 'h1', section: '§1 Архитектура', moduleRef: 1, text: 'Знаю версию ядра: uname -r' },
  { id: 'h2', section: '§1 Архитектура', moduleRef: 1, text: 'Знаю RAM/CPU: free -h && nproc' },
  { id: 'h3', section: '§1 Архитектура', moduleRef: 1, text: 'Запускал user_audit.sh на своей машине' },

  // §2 Загрузка
  { id: 'h4', section: '§2 Загрузка', moduleRef: 2, text: 'Проверил время загрузки: systemd-analyze' },
  { id: 'h5', section: '§2 Загрузка', moduleRef: 2, text: 'Нет failed-сервисов: systemctl --failed' },
  { id: 'h21', section: '§2 Загрузка', moduleRef: 2, text: 'Знаю, что стартует при boot: systemctl list-unit-files --state=enabled' },

  // §3 Процессы
  { id: 'h6', section: '§3 Процессы', moduleRef: 4, text: 'Нет незнакомых процессов в top CPU: ps aux --sort=-%cpu | head' },
  { id: 'h7', section: '§3 Процессы', moduleRef: 4, text: 'Нет zombie-процессов: ps aux | awk \'$8~/Z/\'' },
  { id: 'h22', section: '§3 Процессы', moduleRef: 4, text: 'Знаю PPID подозрительных процессов: pstree -p' },

  // §4 Память
  { id: 'h8', section: '§4 Память', moduleRef: 6, text: 'RAM не забита постоянно: free -h' },
  { id: 'h23', section: '§4 Память', moduleRef: 6, text: 'Swap не активен при простое: vmstat 1 3' },
  { id: 'h9', section: '§4 Память', moduleRef: 6, text: 'Проверил OOM в логах: dmesg | grep -i oom' },

  // §5 Файлы и права
  { id: 'h10', section: '§5 Файлы и права', moduleRef: 9, text: '~/.ssh = 700, ключи = 600: chmod 700 ~/.ssh' },
  { id: 'h24', section: '§5 Файлы и права', moduleRef: 9, text: 'Ключи защищены: chmod 600 ~/.ssh/id_*' },
  { id: 'h11', section: '§5 Файлы и права', moduleRef: 9, text: 'Создан baseline: hash_checker.sh --baseline /etc > ~/baseline.sha256' },
  { id: 'h25', section: '§5 Файлы и права', moduleRef: 9, text: 'Нет лишних SUID: find /usr -perm -4000 2>/dev/null' },

  // §6 Пароли и аккаунты
  { id: 'h12', section: '§6 Пароли и аккаунты', text: 'Уникальный пароль на каждый сервис (менеджер паролей)' },
  { id: 'h26', section: '§6 Пароли и аккаунты', text: '2FA включена: почта, банк, GitHub, Google' },
  { id: 'h27', section: '§6 Пароли и аккаунты', text: 'Нет автологина root/sudo без пароля' },

  // §7 Сеть
  { id: 'h13', section: '§7 Сеть', moduleRef: 11, text: 'Пароль роутера сменён с заводского' },
  { id: 'h14', section: '§7 Сеть', moduleRef: 11, text: 'Wi-Fi: WPA3 или WPA2-AES, WPS выключен' },
  { id: 'h28', section: '§7 Сеть', moduleRef: 11, text: 'Прошёл аудит домашней сети (§11 ниже)' },
  { id: 'h15', section: '§7 Сеть', moduleRef: 11, text: 'Запускал: cd bash-security-toolkit && ./port_scanner.sh 127.0.0.1' },

  // §8 Резервные копии
  { id: 'h16', section: '§8 Резервные копии', text: '3-2-1: 3 копии, 2 носителя, 1 офсайт — проверено восстановление' },
  { id: 'h29', section: '§8 Резервные копии', text: 'Шифрование бэкапа (LUKS / VeraCrypt / cloud E2E)' },

  // §9 Обновления
  { id: 'h17', section: '§9 Обновления', moduleRef: 12, text: 'ОС обновлена: sudo apt update && sudo apt upgrade (или аналог)' },
  { id: 'h30', section: '§9 Обновления', moduleRef: 12, text: 'Автообновления безопасности включены' },
  { id: 'h18', section: '§9 Обновления', moduleRef: 12, text: 'Запускал: cd python-security && python3 cve_monitor.py openssh' },

  // §10 Фишинг и социнженерия
  { id: 'h19', section: '§10 Фишинг', text: 'Не открываю вложения от незнакомых' },
  { id: 'h20', section: '§10 Фишинг', text: 'Проверяю URL перед вводом пароля' },
  { id: 'h31', section: '§10 Фишинг', text: 'Знаю, как сообщить о фишинге (банк, провайдер, cert.gov.ua)' },

  // §11 Аудит домашней сети (из home-network-audit.md)
  { id: 'hn01', section: '§11 Роутер', moduleRef: 11, text: 'Пароль admin ≠ factory default (зайти в 192.168.0.1 / 192.168.1.1)' },
  { id: 'hn02', section: '§11 Роутер', moduleRef: 11, text: 'Firmware роутера актуален (раздел обновлений)' },
  { id: 'hn03', section: '§11 Роутер', moduleRef: 11, text: 'WPS выключен (Wi-Fi settings роутера)' },
  { id: 'hn04', section: '§11 Роутер', moduleRef: 11, text: 'UPnP выключен (advanced settings, если не нужен)' },
  { id: 'hn05', section: '§11 Роутер', moduleRef: 11, text: 'Remote admin выключен (WAN settings)' },
  { id: 'hn06', section: '§11 Роутер', moduleRef: 11, text: 'Гостевая сеть отдельная (guest Wi-Fi)' },
  { id: 'hn07', section: '§11 Wi-Fi', moduleRef: 11, text: 'Шифрование: WPA2-AES или WPA3' },
  { id: 'hn08', section: '§11 Wi-Fi', moduleRef: 11, text: 'Пароль Wi-Fi: 16+ символов, не словарная фраза' },
  { id: 'hn09', section: '§11 Wi-Fi', moduleRef: 11, text: 'SSID не раскрывает модель роутера' },
  { id: 'hn10', section: '§11 Wi-Fi', moduleRef: 11, text: '2.4 GHz: отдельный пароль или отключён если не нужен' },
  { id: 'hn11', section: '§11 DNS и IoT', moduleRef: 11, text: 'DNS-over-HTTPS в браузере (Firefox/Chrome настройки)' },
  { id: 'hn12', section: '§11 DNS и IoT', text: 'Умные устройства в отдельной VLAN / гостевой сети' },
  { id: 'hn13', section: '§11 DNS и IoT', text: 'Камеры не смотрят в интернет без VPN' },
  { id: 'hn14', section: '§11 DNS и IoT', text: 'Пароли IoT-устройств сменены с заводских' },

  // §12 NCSC 10 шагов (из ncsc-10-steps.md)
  { id: 'nc01', section: '§12 NCSC: Управление рисками', moduleRef: 1, text: 'Определил, что защищаю (данные, устройства, аккаунты)' },
  { id: 'nc02', section: '§12 NCSC: Управление рисками', moduleRef: 12, text: 'Оценил: что потеряю при взломе почты / телефона / ПК' },
  { id: 'nc03', section: '§12 NCSC: Обучение', text: 'Прошёл 4 модуля linux-brain-map' },
  { id: 'nc04', section: '§12 NCSC: Обучение', text: 'Запускал bash-toolkit на своей системе' },
  { id: 'nc05', section: '§12 NCSC: Активы', moduleRef: 9, text: 'Список устройств в сети (§11 аудит)' },
  { id: 'nc06', section: '§12 NCSC: Активы', moduleRef: 9, text: 'Baseline хешей: cd bash-security-toolkit && ./hash_checker.sh --baseline /etc' },
  { id: 'nc07', section: '§12 NCSC: Архитектура', moduleRef: 11, text: 'Сегментация: гостевая сеть / IoT отдельно' },
  { id: 'nc08', section: '§12 NCSC: Архитектура', moduleRef: 11, text: 'Нет сервисов на 0.0.0.0 без необходимости: ss -tulnp' },
  { id: 'nc09', section: '§12 NCSC: Уязвимости', moduleRef: 12, text: 'ОС и приложения обновлены' },
  { id: 'nc10', section: '§12 NCSC: Уязвимости', moduleRef: 12, text: 'Мониторинг CVE: cd python-security && python3 cve_monitor.py openssh' },
  { id: 'nc11', section: '§12 NCSC: Защита сервисов', moduleRef: 11, text: 'Нет лишних портов: cd bash-security-toolkit && ./port_scanner.sh 127.0.0.1' },
  { id: 'nc12', section: '§12 NCSC: Защита сервисов', moduleRef: 11, text: 'Firewall включён: ufw status / nft list ruleset' },
  { id: 'nc13', section: '§12 NCSC: Идентификация и доступ', moduleRef: 12, text: 'Нет лишних UID 0: cd bash-security-toolkit && ./user_audit.sh' },
  { id: 'nc14', section: '§12 NCSC: Идентификация и доступ', text: '2FA на критичных аккаунтах' },
  { id: 'nc15', section: '§12 NCSC: Безопасность данных', moduleRef: 9, text: 'Шифрование диска (LUKS) или хотя бы ~/Documents' },
  { id: 'nc16', section: '§12 NCSC: Безопасность данных', text: 'Бэкап 3-2-1 (§8 выполнен)' },
  { id: 'nc17', section: '§12 NCSC: Логирование', moduleRef: 6, text: 'Анализ логов: cd bash-security-toolkit && ./log_analyzer.sh /var/log/auth.log' },
  { id: 'nc18', section: '§12 NCSC: Логирование', moduleRef: 6, text: 'Аномалии: cd python-security && python3 log_anomaly.py /var/log/auth.log' },
  { id: 'nc19', section: '§12 NCSC: Реагирование на инциденты', text: 'Знаю порядок: отключить сеть → сменить пароли → проверить логи' },
  { id: 'nc20', section: '§12 NCSC: Реагирование на инциденты', text: 'Контакты под рукой: банк, почта, провайдер, cert.gov.ua' },
]
