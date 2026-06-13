# NCSC: 10 шагов кибербезопасности

Адаптация [10 Steps to Cyber Security](https://www.ncsc.gov.uk/collection/10-steps) для личного и малого бизнес-использования.

Связь с проектами:

| Шаг NCSC | Модуль Кетова | Инструмент |
|----------|---------------|------------|
| 1. Risk management | 01, 12 | checklist.md |
| 2. Engagement & training | все | linux-brain-map |
| 3. Asset management | 09 | hash_checker.sh |
| 4. Architecture | 01, 11 | home-network-audit |
| 5. Vulnerability management | 12 | cve_monitor.py |
| 6. Service protection | 11, 12 | port_scanner.sh |
| 7. Identity & access | 04, 12 | user_audit.sh |
| 8. Data security | 09, 06 | hash_checker + backup |
| 9. Logging & monitoring | 06, 11 | log_analyzer.sh |
| 10. Incident management | 02, 12 | log_analyzer + playbook |

## Чеклист 10 шагов

### 1. Управление рисками
- [ ] Определил, что защищаю (данные, устройства, аккаунты)
- [ ] Оценил: что потеряю при взломе почты / телефона / ПК

### 2. Обучение
- [ ] Прошёл 4 модуля linux-brain-map
- [ ] Запускал bash-toolkit на своей системе

### 3. Управление активами
- [ ] Список устройств в сети (home-network-audit §3)
- [ ] Baseline хешей: `hash_checker.sh --baseline /etc`

### 4. Архитектура
- [ ] Сегментация: гостевая сеть / IoT отдельно
- [ ] Нет сервисов на 0.0.0.0 без необходимости

### 5. Уязвимости
- [ ] ОС и приложения обновлены
- [ ] `cve_monitor.py` для критичных пакетов

### 6. Защита сервисов
- [ ] `port_scanner.sh` — нет лишних портов
- [ ] Firewall включён: `ufw status` / `nft list ruleset`

### 7. Идентификация и доступ
- [ ] `user_audit.sh` — нет лишних UID 0
- [ ] 2FA на критичных аккаунтах

### 8. Безопасность данных
- [ ] Шифрование диска (LUKS) или хотя бы ~/Documents
- [ ] Бэкап 3-2-1 (checklist §8)

### 9. Логирование и мониторинг
- [ ] `log_analyzer.sh /var/log/auth.log`
- [ ] `log_anomaly.py` с порогом алертов

### 10. Реагирование на инциденты
- [ ] Знаю: отключить сеть → сменить пароли → проверить логи
- [ ] Контакты: банк, почта, провайдер

---

**Прогресс:** ___ / 20 шагов