export type HygieneItem = {
  id: string
  section: string
  moduleRef?: number
  text: string
}

export const HYGIENE_ITEMS: HygieneItem[] = [
  { id: 'h1', section: '§1 Архитектура', moduleRef: 1, text: 'Знаю версию ядра: uname -r' },
  { id: 'h2', section: '§1 Архитектура', moduleRef: 1, text: 'Знаю RAM/CPU: free -h && nproc' },
  { id: 'h3', section: '§1 Архитектура', moduleRef: 1, text: 'Запускал user_audit.sh' },
  { id: 'h4', section: '§2 Загрузка', moduleRef: 2, text: 'Проверил systemd-analyze' },
  { id: 'h5', section: '§2 Загрузка', moduleRef: 2, text: 'Нет failed-сервисов: systemctl --failed' },
  { id: 'h6', section: '§3 Процессы', moduleRef: 4, text: 'Нет незнакомых процессов в top CPU' },
  { id: 'h7', section: '§3 Процессы', moduleRef: 4, text: 'Нет zombie-процессов' },
  { id: 'h8', section: '§4 Память', moduleRef: 6, text: 'RAM не забита постоянно' },
  { id: 'h9', section: '§4 Память', moduleRef: 6, text: 'Проверил OOM в dmesg' },
  { id: 'h10', section: '§5 Файлы', moduleRef: 9, text: '~/.ssh = 700, ключи = 600' },
  { id: 'h11', section: '§5 Файлы', moduleRef: 9, text: 'Создан baseline hash_checker' },
  { id: 'h12', section: '§6 Пароли', text: 'Менеджер паролей + 2FA на критичных аккаунтах' },
  { id: 'h13', section: '§7 Сеть', moduleRef: 11, text: 'Пароль роутера сменён' },
  { id: 'h14', section: '§7 Сеть', moduleRef: 11, text: 'Wi-Fi WPA2/WPA3, WPS выключен' },
  { id: 'h15', section: '§7 Сеть', moduleRef: 11, text: 'Запускал port_scanner.sh 127.0.0.1' },
  { id: 'h16', section: '§8 Бэкапы', text: 'Правило 3-2-1, проверено восстановление' },
  { id: 'h17', section: '§9 Обновления', moduleRef: 12, text: 'ОС обновлена' },
  { id: 'h18', section: '§9 Обновления', moduleRef: 12, text: 'Запускал cve_monitor.py' },
  { id: 'h19', section: '§10 Фишинг', text: 'Не открываю вложения от незнакомых' },
  { id: 'h20', section: '§10 Фишинг', text: 'Проверяю URL перед вводом пароля' },
]