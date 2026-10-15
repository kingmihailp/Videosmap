# Flora0world: Butterflies → Steam: чек-лист выпуска

Что уже сделано в репозитории, а что нужно сделать тебе руками (аккаунт, деньги и юридическое — за меня их не сделать).

## 0. Важно: проверь до релиза (юридическое)
Это самое рискованное место, лучше разобраться **до** оплаты взноса:
1. **Бабочка-«скритчик» и крик.** В игре есть существо «скритчушка/screech» и записанный крик `assets/skrichushka_break.mp3` (вшит в игру), а в `src/art.js` — значки «в стиле Doors» на крыльях. Это отсылки к Roblox *Doors* (Screech). Если mp3 — не твоя запись или не имеет явной свободной лицензии, а существо и значки слишком узнаваемы, Valve/Roblox могут снять игру по жалобе на IP. Либо подтверди права на звук, либо замени звук и сделай существо оригинальным.
2. **Названия и данные видов** взяты из открытых источников (в игре так и написано); латинские названия — не объект авторского права, но тексты-описания проверь, что написаны своими словами.
3. **Название «Flora0world» / «Flora0world: HUB»** — убедись, что бренд твой (для строки «Publisher» и копирайта в игре).
4. **Раскрытие ИИ (AI disclosure).** Steam требует отметить в анкете, если игра сделана с применением генеративного ИИ (в т. ч. код, графика, звуки). Заполни честно в Steamworks → Store Presence → Content Survey / AI Disclosure.
5. **Возрастной рейтинг:** игра без насилия и мата — заполни анкету IARC в Steamworks (ожидаемо «Для всех»).

## 1. Аккаунт и приложение
1. Зарегистрируйся в Steamworks (https://partner.steamgames.com), оформи налоговые и банковские данные, оплати взнос **$100 за приложение** (возвращается после $1000 выручки).
2. Создай приложение — получишь **AppID** и 2 депо ID (Windows, Linux).
3. Впиши AppID в `steam/steam_appid.txt` (сейчас `0` = «Steam выключен», игра работает как обычно).

## 2. Страница магазина (≥ 2 недели до релиза: страницу нужно опубликовать как «Скоро» минимум за 2 недели, Valve проверяет её ~ 3–5 дней)
* Тексты (RU/EN), теги, цена, системные требования — `steam/store_page.md`.
* Графика — `steam/capsules/` (все размеры уже подогнаны):

| Куда в Steamworks | Файл |
|---|---|
| Header Capsule 460×215 | `capsules/header_460x215.png` |
| Small Capsule 231×87 | `capsules/small_231x87.png` |
| Main Capsule 616×353 | `capsules/main_616x353.png` |
| Vertical Capsule 374×448 | `capsules/vertical_374x448.png` |
| Library Capsule 600×900 | `capsules/library_capsule_600x900.png` |
| Library Hero 3840×1240 | `capsules/library_hero_3840x1240.png` |
| Library Logo (прозрачный) | `capsules/library_logo_transparent.png` |
| Page Background 1438×810 | `capsules/page_background_1438x810.png` |
| Community/Client Icon 184×184 | `capsules/icon_184x184.jpg` |
| Скриншоты (1920×1080), 10 шт. — русские | `screenshots/*.png` (для русской страницы) |
| Скриншоты — английские | `screenshots_en/*.png` (для английской страницы; в Steamworks можно загрузить отдельно для каждого языка) |

* Клиентская иконка `.ico`: `desktop/build/icon.ico`. Нужен ещё **трейлер** (видео): тизер лежит в `../../teaser`, но он для Flora0world HUB — запиши отдельный ролик геймплея 30–60 с (OBS).
* Пересоздать графику: `node tools/test/steam_art_src.js` → `python3 tools/make_steam_art.py`; скриншоты: `node tools/test/steam_shots.js`.

## 3. Достижения (12 штук)
Игра сама сообщает о них (`src/steam.js` + `desktop/preload.js`). Заведи в Steamworks → Stats & Achievements ровно эти **API Name** (тексты RU/EN — в `achievements.json`; иконки 256×256 (в цвете и серые) нужно нарисовать — можно взять изображения бабочек из журнала):
`ACH_FIRST_CATCH, ACH_TEN_SPECIES, ACH_FIFTY_SPECIES, ACH_HUNDRED_SPECIES, ACH_RARE, ACH_ALL_RARE, ACH_LOCATION_COMPLETE, ACH_FIVE_LOCATIONS, ACH_DESERT, ACH_RICH, ACH_COLLECTOR, ACH_PROFESSIONAL`. Опубликуй изменения («Publish») — без этого достижения в игре не сработают.

## 4. Облачные сохранения (Steam Auto-Cloud)
Сохранение пишется настоящим файлом `saves/save.json` (+ `save.json.bak`) в папке данных приложения. В Steamworks → Application → Cloud включи **Steam Auto-Cloud** и добавь правило:
* Root: **WinAppDataRoaming**, Subdirectory: `Flora0world Butterflies/saves`, Pattern: `*.json`, OS: Windows
* Root: **LinuxXdgConfigHome**, Subdirectory: `Flora0world Butterflies/saves`, Pattern: `*.json`, OS: Linux
* Quota: 1 МБ достаточно (сейв — несколько сотен КБ), 100 файлов.
При первом запуске нового Steam-билда старый сейв из браузера не переносится (другое хранилище) — предупреди игроков или добавь импорт позже.

## 5. Сборка и загрузка
Нужны: Node.js 18+, steamcmd, твой Steamworks-логин.
1. Windows: `steam\build\prepare_content.bat` → `steam/content/windows`. Linux: `steam/build/prepare_content.sh` → `steam/content/linux` (или GitHub Actions: workflow **Steam build** собирает оба артефакта).
2. В `steam/build/app_build.vdf` впиши AppID и ID депо; в Steamworks → Installation → Launch options: Windows `Flora0world Butterflies.exe`, Linux `flora0world-butterflies` (имя проверь в `content/linux`).
3. `steam\build\upload.bat <steam-логин>` → в Steamworks назначь билд ветке `default`/`beta`, проверь установку через Steam-клиент и запусти игру (должна появиться Steam-оверлей Shift+Tab и работать достижения).
4. Отправь приложение и билд на ревью (Release → Submit), после одобрения нажми «Release».

## 6. Что учесть в самой игре
* Интерфейс на русском и английском (кнопка «Язык / Language» в главном меню и в настройках; при первом запуске язык берётся из системы). В Steamworks в «Supported Languages» отметь Russian и English (Interface + Subtitles).
* Мультиплеер работает на сервере, который запускает сам игрок (`server/`); адрес вводится вручную. Если нужен публичный сервер — его нужно арендовать и вписать адрес по умолчанию.
* Steam Deck: управление — клавиатура+мышь; Deck Verified не заявляй, пока не проверишь с геймпадом.
* F11 / Alt+Enter — полный экран.
* Платформы: Windows и Linux (macOS без подписи Apple Developer ID не запустится у людей — не публикуй).
* Игра без Steam-клиента не падает: `steamworks.js` загружается опционально.

## 7. Проверка перед отправкой
- [ ] AppID вписан, достижения опубликованы, Auto-Cloud настроен
- [ ] Установка из Steam на чистой машине запускается, виден оверлей, сейв переживает перезапуск
- [ ] Права на крик и существо «скритчушка» подтверждены или заменены (п. 0.1)
- [ ] Трейлер и 5+ скриншотов загружены, страница «Скоро» опубликована
