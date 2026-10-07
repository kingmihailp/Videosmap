# Flora0world: Butterflies

Пиксельная 3D-игра про энтомологическую ловлю бабочек — в стилистике роликов и аватарки Flora0world: HUB.
Выбираешь на карте мира место с определённым биомом, идёшь по полю с сачком и ловишь **реальных бабочек**,
которые действительно там обитают. Все пойманные виды попадают в энтомологическую коллекцию (с датой и местом поимки).

## Как запустить (проще некуда)

1. Скачайте файл **`Flora0world_Butterflies.html`** (это вся игра в одном файле, ~830 КБ, без установки и без интернета).
2. Откройте его двойным кликом в **Chrome / Edge / Firefox** (или запустите `Запустить игру.bat` / `./run.sh`).

Требуется браузер с WebGL 2 (любой современный ПК). Прогресс сохраняется в браузере автоматически.
Если игра тормозит — она сама включит «низкое качество» (также переключается в паузе). В паузе можно сгенерировать новую местность.

## Управление

| Клавиша | Действие |
|---|---|
| WASD | ходьба |
| Мышь | осмотреться (курсор захватывается) |
| ЛКМ / Пробел | взмах сачком |
| Ctrl / C | красться (тихий шаг) |
| Shift | бег (бабочки пугаются) |
| H | «нюх»: стрелка к ближайшей бабочке |
| Tab | журнал-коллекция |
| F | полный экран |
| Esc | пауза |

## Процедурная генерация

Каждый заход в биом — **новый мир** (зерно показано в паузе; `#seed=XXXXX` в адресе повторит конкретный мир):

* рельеф, реки (петляют по долине, течение вниз по уклону) и пруды (дно и берега вырезаются в земле — вода всегда «сидит» в ней);
* рощи, поляны и опушки по шуму плотности леса; у каждого биома свой «рецепт»: берёзовые рощи, оливковые террасы рядами и аллея кипарисов,
  сплошной тропический лес с просекой, акации на возвышенностях, ивы и тополя вдоль ручья, криптомерии на склонах и клёны у воды;
* ориентиры (по два на заход): поваленные брёвна, стога и изгороди, шале, пирамидки-кэрны, руины колонн, ветряная мельница,
  тории и каменные фонари, камни-переправа, скалы-копьё; термитники и скальные островки в саванне;
* свет и погода: время суток (день / «золотой час»), дымка, облака; поля цветов тяготеют к полянам, берегам и стартовой точке;
* приманки для бабочек (соляные площадки, спелые плоды, сок деревьев) раскладываются заново.

## Геймплей

* **8 биомов × 31 вид = 248 реальных бабочек.** У каждой — своё место: среда, ареал, кормовое растение, размах крыльев. Виды подобраны под биом (например, чернушки и аполлоны — Альпы, морфо и геликонии — Амазония, птицекрылы — Борнео, перламутровки и парусники-кресфонты — прерия).
* **Местная фауна:** при каждом заходе в биом встречается 9 из 31 видов (непойманные выпадают чаще) — перегенерация местности даёт новый набор.
* Бабочки сидят на цветах, летают между ними, пьют на солончаках и у спелых плодов, парят над кронами.
  Чем больше **шум** (шкала слева внизу), тем раньше они улетают: подкрадывайтесь с Ctrl, делайте взмах, когда прицел зеленеет.
* У каждого вида свой характер: осторожность, скорость, высота полёта, любимые места (цветы / плоды / соль / сок деревьев).
* Редкие виды (★★★) встречаются реже и осторожнее.
* Журнал: «ящик коллекционера» с листанием по страницам (стрелки ↑↓ или колесо мыши), с булавками, силуэты ненайденных видов, подсказки «где искать», карточка с фактами.

## Секретная локация «???»

Девятая булавка на карте — в открытом океане (Точка Немо). Ночь, ливень, молнии, остров с маяком, дверями и светящимися грибами.
Есть **фонарь (F)** и сачок. Здесь летают выдуманные «ночные» бабочки по мотивам существ из Doors; их число и названия скрыты («???»), пока не поймаешь.

* Скрич — подлетает в темноте, убегает от луча. Дред — невидим, пока не попадёт в луч. Сик — замирает, если на него смотреть.
* Грамбл — медленный и ворчливый. Раш и Амбуш — мигает свет, и они пролетают на огромной скорости (Амбуш — до трёх раз).
* Глаза — исчезают от прямого взгляда. Фигура — слепая, реагирует на шум. Хальт — замирает в луче. Тимоти — крошечный.
  Глитч — телепортируется. Джефф — торговец с золотым отливом.
* **Путеводная** (голубая, с луной на крыле) — поймаешь: 60 с стрелка к ближайшей новой бабочке. **Любопытная** (жёлтая, со звездой) — 30 с подсвечивает всех.
  **Модификатор** (красная, с завитком) — случайный модификатор ночи на 90 с: 80% — плохой (15 вариантов: лихорадка, шторм, севший фонарь, тьма, невидимки, зеркало, головокружение…), 20% — хороший (5 вариантов: штиль, лунная ночь, большой обруч, тихие шаги, сонные бабочки). Цветные бабочки встречаются примерно втрое реже обычных.

## Кабинет энтомолога

Отдельная 3D-локация (кнопка «Кабинет энтомолога» на титуле, на карте и в паузе; клавиша **K** на титуле и карте).
Каждая пойманная бабочка попадает сюда «сырой» — с поднятыми крыльями.

* **Расправилка** (стол у окна, `E`): выберите бабочку, подцепите иглой кончик крыла (белая рамка), плавно переведите его
  к золотой точке и нажмите **Пробел**, когда сужающееся кольцо сойдётся на точке. Порядок: правое переднее → левое переднее →
  правое заднее → левое заднее. Резкие движения рвут крыло («Хрупкость»), у редких видов дрожит рука.
  В конце — результат: **точность булавок, ритм, бережность, симметрия** и общая оценка (от «Небрежно» до «Музейный экземпляр»).
* **Мастерская коробок** (верстак справа): создайте коробку **S** (1 бабочка), **M** (2×2) или **L** (3×3), выберите стиль
  (орех / дуб / чёрный лак), кладите расправленных бабочек щелчком, «Авто» заполняет лучшими. На коробке — этикетки с видом и оценкой.
* **Выставка**: «Стена» — 6 мест на северной стене (L принимает любую коробку, M — малую и среднюю, S — малую);
  «Стол» — 2 места под стеклом на столешнице и 3 выдвижных ящика (4 места: S=1, M=2, L=4). Всё сразу видно в комнате.
* Дверь в углу возвращает на карту экспедиций. Всё сохраняется в браузере.

## Биомы и виды

| Биом | Место | Виды |
|---|---|---|
| Среднерусский луг | Подмосковье, Россия | махаон, павлиний глаз, лимонница, боярышница, перламутровка пафия, голубянка икар |
| Альпийские луга | Швейцарские Альпы | аполлон, феб малый, желтушка горная, чернушка горная, перламутровка пастушья, голубянка альпийская |
| Средиземноморский маквис | Пелопоннес, Греция | подалирий, поликсена, харакс ясий, лимонница клеопатра, пестроглазка галатея, бабочка-клювик |
| Тропический лес Амазонии | Перу | морфо менелай, калиго мемнон, геликония мельпомена, дриада юлия, малахитница, феба филея |
| Тропический лес Борнео | Сабах, Малайзия | птицекрыл раджи Брука, птицекрыл елена, парусник агамемнон, парусник политес, кружевница красная, сатурн обыкновенный |
| Саванна Восточной Африки | Масаи-Мара, Кения | парусник дарданус, парусник демодок, данаида хризипп, гиполимнас мизиппус, катопсилия флорелла, алый кончик |
| Североамериканская прерия | Канзас, США | монарх, тигровый парусник, перламутровка кибела, желтушка эвритема, вице-король, чёрный парусник |
| Горные леса Японии | Нагано, Хонсю | император японский, парусник ксут, люэдорфия японская, парусник сарпедон, парусник бианор, аполлон ледниковый |

Данные о видах (размах крыльев, местообитание, ареал, кормовые растения, факты) сверены по открытым источникам —
Wikipedia, euroButterflies, Butterfly Conservation, butterflyidentification.com, Animal Diversity Web, GBIF-справочники и др.
У нескольких видов источники не дают чёткого размаха (*Hypolimnas misippus*, *Sasakia charonda*, *Parnassius glacialis*) —
в игре эти значения помечены как приблизительные (≈). Рисунок крыльев — процедурный пиксель-арт «по мотивам» реальных видов
(не копия фотографий).

## Технологии

* Three.js r149 (MIT) — 3D; рендер в 480×270 с увеличением «пиксель в пиксель» + постобработка:
  квантование палитры с упорядоченным дизерингом и контуры по буферу глубины.
* Всё процедурное: рельеф, деревья, трава и цветы (инстансинг), небо, облака, водоёмы, частицы, текстуры крыльев, звук (WebAudio).
* Береговые линии карты мира — Natural Earth 110m (общественное достояние), растеризованы в пиксельную маску.
* Шрифт: пиксельный атлас с кириллицей, сгенерированный из DejaVu Sans Bold.

## Сборка из исходников

```bash
pip install pillow
python tools/make_assets.py   # шрифт-атлас и маска карты -> src/assets_gen.js
python tools/build.py         # собирает Flora0world_Butterflies.html (three.js + src/*.js)
```

Автотесты (Playwright + Chromium): `tools/test/` (`shot.js` — скриншоты, `e2e.js` — сквозной сценарий меню → карта → игра,
`bot.js` — бот-ловец для проверки баланса и ИИ бабочек, `cab.js`/`cab2.js`/`cab3.js` — кабинет: комната, расправление, коробки, размещение, миграция старого сохранения).

## Скриншоты

См. папку `screenshots/`.

## Мультиплеер (Node.js)

```
cd server && npm install && node server.js [порт]   # по умолчанию 3000
```

Откройте `http://<адрес-сервера>:3000` (сервер сам отдаёт игру) и выберите «Мультиплеер» в главном меню.
На одном сервере общие: локации (одинаковые миры и бабочки), кабинет энтомолога, коробки, стена и стол.
Пойманную бабочку получает тот, кто успел первым; расправлять и раскладывать по коробкам можно и чужих бабочек.
Дневник и настройки у каждого свои. Состояние кабинета хранится в `server/data/state.json`.

## Аберранты

Любая бабочка настоящих локаций (кроме океана) с шансом ~3,5% рождается аберрантом: окраска, рисунок или размер слегка отличаются от обычной формы
(оттенок сдвигается не больше чем на ~18°, поэтому красная остаётся красной, а голубая — голубой). Каждый аберрант генерируется процедурно
из короткого кода (`<вид>~КОД`, см. `src/aberr.js`), поэтому их бесконечно много, а один и тот же код всегда даёт одну и ту же бабочку — в том числе у других игроков.
Пойманный аберрант засчитывается как поимка вида, кладётся в кабинет как обычный экземпляр, а в журнале под видом появляется кнопка «Аберранты» со списком всех пойманных.

## Рынок насекомых и торговля

Новая локация: рынок — длинная улица (56 м) с тремя боковыми ответвлениями, коротким переулком с чайным садом и площадью с фонтаном, десятками стоек разных форм
(столы под навесами, киоски, тележки, круглые палатки, стеллажи) с коробками бабочек, фонарями, флажками и гуляющими покупателями.
Попасть можно с карты мира (кнопка «Рынок»), из паузы кабинета или с площади рядом с кабинетом; выход — западные ворота (на карту) или дверь кабинета на востоке площади.
Время суток следует часам компьютера, как в кабинете.

За красно-белой стойкой «Скупка бабочек» стоит торговец: он покупает экземпляры из кабинета (не лежащие в коробках) за монеты (`src/econ.js`):
цена = ценность вида (по редкости: ~6 / ~16 / ~42 монеты) × состояние (сырой ×0,55; расправленный ×0,8…1,7 по качеству) × аберрант (×~6);
бабочки океана стоят 150–250 монет. Кнопка «Продать обычных» не трогает аберрантов и океанских, а их продажа требует подтверждения.
Монеты у каждого игрока свои (в мультиплеере проданный экземпляр исчезает из общего кабинета, сервер защищает от двойной продажи).

## Заброшенный дом в Альпах

В локации «Альпы» всегда стоит старый заброшенный шале (`src/chalet.js`): бревенчатые стены, прогнившая крыша с дырами и обвалом, разбитые окна с повисшими ставнями,
сломанная веранда, покосившийся забор, поленница, бочка, колесо, заросли травы вокруг. Дверью можно воспользоваться: «E — войти в заброшенный дом» —
звучит таинственный звук (`Snd.sfx.mystery`), и игрок оказывается в пустой комнате-заглушке (`src/room.js`); «E» у двери возвращает его к дому.

## Desktop app (Windows .exe with an icon)
`desktop/` wraps the game in an Electron window (own icon, no browser UI, F11 = fullscreen).
- Ready exe: GitHub → Actions → "Windows exe" → artifact `Flora0world-Butterflies-exe` (built automatically on each push that changes the game).
- Or build locally on Windows: install Node.js, run `desktop\Собрать exe.bat` → `desktop\dist\Flora0world-Butterflies.exe` (portable, no installer).
- The icon is drawn by `tools/make_icon.py`. In the app the multiplayer address must be typed manually (`host:port`).

## Phones / tablets (touch controls)
`src/touch.js` turns on automatically on touch screens (or with `#touch` in the URL): left thumb = floating stick (push to the edge = run), right thumb drag = look, tap = swing the net,
buttons: ☰ pause, 📖 journal, E interact, 👁 scent, ⬇ crouch (toggle, = Ctrl), 🔦 torch, ПРОБЕЛ (spreading board), ✕ back. Menus are tapped; lists scroll by dragging; the multiplayer fields open the on-screen keyboard.
Play in landscape. How to get the game on a phone: run `node server/server.js` on the PC and open `http://<PC-LAN-IP>:3000` on the phone (same Wi-Fi) — this also gives multiplayer;
or host the single HTML file anywhere over https (then the multiplayer server must be wss://). Test: `tools/test/touch.js`, `touch2.js`.

## Catch card position
The "caught a butterfly" card now sits at the top left, below the online-players line. Pause menu → «Карточка улова: положение и размер»: drag the card anywhere (mouse or finger), −/+ or the mouse wheel change the size, «Сброс» restores the default. Saved in the settings (`settings.card`).

## Re-binding the controls
Title screen → «Клавиши управления», or Pause → «Клавиши»: click an action, press the new key (a key already used by another action is swapped with it; Esc cancels, Enter/Esc cannot be assigned).
Defaults: W/A/S/D, Shift = run, Ctrl or C = sneak, Space (and the left mouse button) = swing, E = interact, Tab = journal, H = scent, F = torch, P = pause.
Implementation: `src/keys.js` translates the chosen physical key into the default code in a capture-phase listener (gameplay only), and rewrites key names in on-screen texts. Saved in `settings.keys`. Test: `tools/test/keys.js`.

## Pause menu
Pause (Esc / P): Продолжить · Журнал · Кабинет · Управление · **Настройки** (звук, музыка, качество, клавиши управления, положение карточки улова) · новая местность · другое место · **Выход в главное меню**.
The cabinet / market / house pause menus have the same «Настройки» and «Выход в главное меню». Esc inside Настройки closes only Настройки; the next Esc closes the menu. If the browser drops the pointer lock together with the Esc that closed the menu, the game re-takes it instead of reopening the menu (`App.escT`, `App.pauseT` in `src/main.js`). Test: `tools/test/pause_menu.js`.

## Multiplayer: landscape and butterfly leadership
- A biome that nobody is in gets a **new seed** (new landscape, new butterflies) every time a player walks into it; later joiners get the same landscape. The cabinet and the market keep theirs.
- The butterflies of a location are simulated by its host. The host keeps simulating (and sending) under the pause menu / journal / help, and if the host stays silent for 12 s (hidden tab, frozen client) the server hands the lead to the next player (`host` message); the old host becomes a follower again. A new host fills an empty location with a fresh population.
- Server change: `joinLoc` re-seeds empty biomes, watchdog in `server.js`. Test: `tools/test/mp_host.js`.

## Misc
- World map (online): figures next to a pin show who is in that place, hovering a pin lists their names, a corner panel lists everybody and where they are (cabinet / market / map).
- Spreading desk: unspread specimens of one species are stacked into one card with a «×N» badge; aberrants are separate cards (identical aberration codes stack together).
- Birch trunks now end inside the crown.

## Chat and the spreading desk
- Multiplayer chat: **T** opens a line (Enter sends, Esc cancels; rebindable in «Клавиши»; a 💬 button on phones). Messages go to everybody online and fade after ~12 s. Offline, T only says that the chat needs multiplayer. Uses the server's existing `chat` message (no server change). Test: `tools/test/chat.js`.
- Spreading desk: aberrations are purple cards with an «аберрант» tag and stand right after the normal form of their species.

## Butterfly nets: parts, workbench, shop
A net has three parts — **handle, hoop, mesh** (`src/nets.js`). Effects of the parts add up:

| Part | Effect |
|---|---|
| Сетка из прочного полотна (700) | +12% swing speed |
| Увеличенная сетка (750) | +12% catch radius |
| Сетка из шёлка (2200) | +0.5% chance a caught butterfly is an aberration |
| Обруч из стали (850) | +12% swing speed |
| Увеличенный обруч (1100) | +15% catch radius |
| Обруч из пластика (1600) | +30% swing speed |
| Удлинённая ручка (800) | +10% catch radius (and a longer pole) |
| Ручка из пластика (950) | +15% swing speed |
| Ручка из хрома (2400) | +0.5% aberration chance |

- **Buy** the parts from the net seller at the insect market (E at his stall).
- **Assemble / take apart / equip** at the workbench in the entomologist's cabinet — the new «Сачки» tab (nets can only be changed in the cabinet). The plain net (basic parts) is always available.
- The equipped net is shown in first person and on other players (`nt` field of the `pos` message; **the server relays it, so `server.js` changed**), and changes live when a player swaps nets in the cabinet.
- Parts, nets and the equipped net are personal (saved with the coins). Tests: `tools/test/nets.js`, `mp_nets.js`.

### More net parts (second batch, all 500+ coins)
Handles: Ручка из бамбука (500: +10% speed, +4% radius) · Телескопическая (1400: +18% radius) · Из карбона (1600: +22% speed) · Из эбенового дерева (1900: −20% swing noise, +0.3% aberration) · С самоцветом (2100: 8% double catch).
Hoops: Из углепластика (1300: +18% speed, −15% noise) · Из титана (1500: +20% speed, +5% radius) · Двойной (1700: +22% radius) · Из серебра (2000: +0.4% aberration).
Meshes: Паутинный шёлк (900: −25% noise, +8% speed) · Глубокая (1200: +8% radius, 5% double catch) · Позолоченная (1800: +8 coins per catch).
New effect kinds: **quiet** (less swing noise, so butterflies are scared less), **dbl** (a second specimen of the same butterfly), **coin** (coins per catch). The shop has tabs Ручки / Обручи / Сетки (Tab or ←/→ switch them). Test: `tools/test/nets2.js`.

## Secret chain

- Code lock door (8 digits, code `27378801`) in the NE corner of the market's north plaza.
- Fragments: `27` – hooded trader in the strange stall (west end of the first alley); `37` – NE corner room of the abandoned chalet in the Alps; `88` – note on the ocean lighthouse; `01` – last page of the last tab of the butterfly journal.
- Fragments can be moved to the stash (key `I`, or the pause button "Склад"). Fragments, the door state and the secret market are per player (stored in `Save.data.secret`); the server relays nothing about them.
- After the code is entered the door opens into the secret market (several dusty rooms, curtained windows, a hooded seller with nothing to sell yet).
