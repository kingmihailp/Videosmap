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
сырые бабочки океана стоят 60–80 монет (базовые 30–40, как и на других секретных картах умножаются на 2). Кнопка «Продать обычных» не трогает аберрантов и океанских, а их продажа требует подтверждения.
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

## Location maps (secret locations)

- The hooded trader of the secret market sells maps of secret locations (Save: `Save.data.maps`, personal). The first one, **Torfyanoe boloto** (peat bog, Vasyugan mire, 4500 coins), adds a pin to the world map, a tab to the journal and 24 new species.
- Without the map the location is invisible and cannot be entered (client check in `App.start`, and the server denies a forged join: `server/server.js` `SECRET_MAP`, the client sends `maps` with every `join`). Players who own the same map play there together as in any other location.
- The bog is generated by `World` from the `ENV.bog` recipe (overcast light, hummocks, brown pools, stunted pines, tussocks, a boardwalk). Tests: `tools/test/maps_flow.js`, `mp_maps.js`, `bog_view.js`, `bog_models.js`.
- The second map, **Novaya Gvineya** (10500 coins), opens the relic jungle around Mount Lamington (Oro province): `ENV.papua`, giant `relic` trees that close the sky, a frozen lava flow with basalt columns, 27 species. **Queen Alexandra's birdwing** (`fixedPrice` 2000, `scarce` 0.18): the merchant pays exactly 2000 whatever the condition (aberrations multiply it), "sell all" never takes it, it shows up in about 5% of visits and does not respawn. Test: `tools/test/papua_check.js`.
- The third map, **Vysokogorya Vietnama** (8000 coins), opens the limestone highlands of Hoang Lien Son (Lao Cai province, northern Vietnam): `ENV.vietnam` (`highland: true`, `mist: true`), 28 species. The location is a **big map** (radius 120 instead of 58, a 360 m terrain grid; the world builder shadows the size constants for `highland` locations) and an **archipelago of mountain islands** (the home island under the spawn and up to 16 more, `world.islands`): from small ones (about 10 m) to huge ones (34-46 m, with several hills) standing in a sea of mist. **An island can have any shape**: its outline is a skeleton of capsules (`mkShape`: blob, ridge, crescent, L, Y, clover) with a wobbly edge, and the signed distance to it (`sdOf`) gives the cliff, the pads and the terraces; `tools/test/vn_map.js` draws a plan of the archipelago. Islands are parted by chasms and joined either by **rope bridges** (`world.bridges`, built in `World.build`) or by **solid ground** (an isthmus: two islands whose outlines overlap, `world.links` with `land: true`; the huge island next to the home one is always joined that way). The edge of the map is the cliff at the end of the chain of islands: there is no ground outside the islands, it falls into the mist (two translucent mist layers that follow the player + banks of mist; no far mountains). Each island has its own height, a hill, an irregular outline and sometimes rice terraces; uphill walking is slower (`world.moveK`), cliffs are not walkable (`world.canWalk`). Bridges: the chain is held together by sound bridges; a dead-end island behind a bridge and the spare (loop) bridges may be worn. A worn bridge (darker planks, gaps, torn ropes; at least one in every location) creaks when stepped on and only snaps under a player who **runs** on it: while he is on the deck faster than 4.6 m/s the bridge's `strain` grows (it relaxes when he walks or leaves), at 0.45 it warns, at 1 it shakes for about a second and snaps (`world.pstate` carries the player's speed from `Play`); walking carefully only makes it creak: the planks fall, the player falls into the chasm (`Play.fall`) and is thrown out to the world map with a note (`F0W.mapNote`). A bridge that starts to shake or snaps does so for everybody in the location: the client that triggers it sends `bridge` (`{i, k: 'shake'|'snap'}`), the server relays it and remembers the state for later visitors (`loc.bridges`); everybody standing on the deck when it snaps falls. Butterflies do not spawn over the void (`world.noFly`), on a big map they live within about 60 m of the player, and they cross chasms at the height of the islands (`world.flyH`). Counts of plants, rocks and flowers grow with the area of land (`K`). The cliffs are dressed with a merged decor mesh (lianas, moss cushions, outcrops, roots, strata ledges, crooked pines; `noFloat`) and coloured with strata bands and moss streaks. Plants: Khasi pine, moss-covered montane oaks, tree ferns, rhododendrons, bamboo, wild bananas, limestone karst spires. **Golden Kaiser-i-Hind** (`teinopalpus_aureus`, `fixedPrice` 1400): flat 1400 for a raw one (no x2 of the secret places), spreading/aberration multipliers apply, ordinary rarity (3). All the other species cost double like on the other secret places. Tests: `tools/test/vn_check.js` (the archipelago, islands reachable only over the bridges, the way off the bridges, spires not over the void, a sound bridge, a worn one breaking, the fall to the map), `tools/test/mp_bridge.js`, `tools/test/vn_aerial.js` / `vn_view.js` (pictures), `tools/test/model_float.js`, `tools/test/bog_float.js <seed> vietnam`.

## Hidden console

The backslash key (`\`) opens a one-line console (Enter runs, Esc or `\` closes, arrow up recalls the previous line). The only command: `give gold <amount>` (a leading `:` is accepted) gives the gold to the player who typed it. Test: `tools/test/console.js`.

- **Regenerating a landscape with other players present** needs a vote: the pause-menu button sends `regen`; alone it works at once, with others the server (`loc.vote`, 30 s, one vote per 15 s) asks everybody (`vote`/`voteUpd`/`voteEnd`, answers `voteReply`). Everybody has to say yes; one no, a timeout or a newcomer cancels it; on success all get `reseed` with the same new seed. The card is drawn by `Chat.drawVote` (Yes/No buttons are clickable while the cursor is free, e.g. in the pause menu; Y / N work always). Test: `tools/test/mp_vote.js`.
- **Rare finds** (`Rare.is`: Queen Alexandra's birdwing, the false ringlet, the golden Kaiser-i-Hind and their aberrations) get a red frame on the catch card, journal, box labels and the market, and their own catch sound (`Snd.sfx.catchRare`).
- The entomologist's bench (`specCard` in `src/spread.js`) shows rare finds with a red card and a «редкий» label (an aberration of a rare species keeps the purple card with a red frame and both labels). `tools/test/ui_overflow.js` finds texts that run out of the plate they start in (journal, cabinet, market, secret room, modals, play HUD).
- The pixel-art post pass (`postMat` in `src/main.js`) outlines depth discontinuities; the range of the outline is `edgeD` (380 m, in the highlands 90 m): on a flat sea seen at a grazing angle the outline would otherwise draw a dark band along the horizon, and on the terrain below the mist it drew the square edge of the map.
- **The museum** (`src/museum.js`, class `Museum`): a new room behind the second door in the east wall of the cabinet (between the way out and the workshop); a shared location of its own online (`museum`, so `server.js` changed: it accepts the location, the new places in `fits` and up to 120 boxes). A 24 x 16 m hall with 88 places for the framed boxes: 12 display tables with 2 places (`mt`, small and medium boxes), 4 large tables with 1 place (`ml`, any), 6 racks with 3 shelves x 2 upright places (`mr`, small and medium) and 24 wall places (`mw`, size classes L M S S M L ...); the rules are in `Boxes.MUS` / `MWCLS` (and mirrored in the server). Furniture is one merged mesh (`Batch`), the frames (`refresh`) are rebuilt when boxes change. At a table, rack or wall E opens the usual placement window (`Boxes.place`) on the right tab (Столы / Большие / Стеллажи / Стена). Tests: `tools/test/museum_check.js` (door, rules, walking up, way back), `museum_float.js` (all 88 places filled: every box of the room is connected to the floor, a wall or the ceiling, nothing sticks out), `mp_museum.js`. The workshop now allows 100 boxes.
- The museum is detailed: parquet with an inlaid border and a compass medallion, a coffered ceiling with skylights, three chandeliers and six pendant lamps with opal domes, pilasters, a stepped cornice, wall sconces and a picture light over each wall frame; turned legs and brass rims on the tables, racks with panelled backs and name boards, low cabinets with drawers and glass-topped cases with specimens, bookcases with books, jars and globes, potted palms / ficus / ferns / dracaenas, benches, glass-domed pedestals. All of it is merged into one mesh (`Batch`: boxes, lathes, limbs, bent leaves), a handful of extra meshes are only glow (bulbs, skylights) or glass. `tools/test/museum_audit.js` checks that parts of different furniture do not run into each other, that frames face into the hall and that every station can be reached on foot; leaves that would poke through a wall are left out.
- **Volume**: the settings window has three sliders (master, sounds and surroundings, music; click or drag; saved as `settings.volume / volSfx / volMusic`; `Snd.applySettings` maps them to the master, effects, ambience and music gains; `tools/test/volume_check.js`).
- **The antique clock** of the museum (a longcase clock on the north wall, `museum.js`): its hands show the real time, the pendulum swings once a second with a soft tick (louder near the clock) and it strikes the hours (`Snd.sfx.clockTick / clockChime`); E at it strikes the current hour.
- The three rarest finds (Queen Alexandra's birdwing, the false ringlet, the golden Kaiser-i-Hind) are `scarce: 0.05`: each is in the pool of its location in only about 1.4% of the visits (about one in seventy) and, when it is, turns up 4-10 minutes after the start (`spawn_stage.js`).
- **The collector and the wings** (`src/collection.js`, `Collection` and `Wings`; `WingsUI` for the cabinet window): a new trader, «Торговец коллекциями», at the round stall north-east of the fountain on the insect market (portrait kind `collector`, station `collect`, overlay `collect` in `src/market.js`). He buys a whole frame that is not hung up. Price = frame by size (S 100, M 200, L 300) + each butterfly (`Econ.info` price, so spread quality and aberration count; the three rarest finds x1.5) + a bonus of 400-1000 coins for a systematic collection: one species, only aberrants, one family, one location, one colour (rough, from the forewing hue), only the rarest finds. The order in the frame matters: runs of equal keys are rated by `purity`. The frame must be at least half full (min 3). `Save.sellBox` removes the box and its specimens and adds coins; online it is the op `sellBox` (server `applyOp`, rejected → rolled back via `opNo`). Wings: the ocean (`map: 'ocean'`, server `SECRET_MAP.ocean`) is closed at the start. Catching every butterfly of a starting location (alone or online; `Wings.check` after each catch, on the map, in the cabinet and at the collector) puts one wing of the guiding butterfly into the stash (`Save.data.wing`; shown as eight icons in the stash window). At the easel in the cabinet (station `wings`, west side) the wings are laid into the frame, «Собрать рамку» builds it, and the collector takes it (300 coins) and gives the ocean map (`Maps.grant`). Saves that already had ocean catches get the map automatically. Wings and the wing frame are personal (not part of the shared cabinet). Test: `tools/test/collector_check.js`.
- **Spread menu filters** (`Spread.pick`, `src/spread.js`): five buttons above the cards (rarity, location, aberration, catch date, family); each click cycles through «все» and the values present among the waiting butterflies; the page counter and «показано x из y» follow. Test: `tools/test/spread_filters.js`. The wings easel now stands against the south bookcase.
- **Bait traps, flowers and honey** (`src/traps.js`, `Traps`): three new traders on the insect market. The florist (north side of the main street, first table, «Цветы») sells 11 real flowers by scent 1-5 (cornflower ... buddleia), the honey seller (south side, «Мёд») 9 real honeys by quality 1-5 (sunflower ... heather, manuka), the trapper («Ловушки», south side next to it) three traps: standard (900 coins, lasts 2 min, holds 10), sturdy (1800, 6 min, 20) and imported (2800, 4 min, 14, 1% of its butterflies are aberrations). The shops are the market overlay `goods` (`goodsOpen/drawGoods`; pictures of traps are real renders by an extra small renderer, `Traps.Thumb`), portraits `florist`, `beekeeper`, `trapper`. The stock is personal (`Save.data.trap = {tr, fl, hn}`). In an expedition G opens «put a trap» (a click puts it in front of the player; there is no limit on the number of traps per player or per location), E at a trap opens its window: flowers decide how often butterflies come (1.1 per minute per scent point), honey how rare they are (weights x(1 + 0.9 q (rar-1)), a little for the scarce species with q), either alone brings fewer visitors, an empty trap catches nothing. Only daytime butterflies of the location come. The trap breaks after its life from the moment it is put (it stops catching; the catch can still be taken, then the wreck disappears); «Забрать улов» puts the butterflies into the cabinet as raw specimens; leaving the location does it automatically for all your traps. Online (`trap` messages, server `trapMsg`): others see your traps with your name, baits and the count only (the server never learns the contents, so nobody else can take them); a trap goes away with its owner; late joiners get the standing traps in `joined`. Models: three detailed bodies (tripod and hanging net cylinder; wooden cage with a hip roof; pop-up dome with guy lines), the bait on the dish, resting butterflies in the colours of the caught species, a worn-out variant. Tests: `tools/test/trap_float.js` (69 variants: nothing floats or sinks), `trap_flow.js`, `mp_traps.js`.
  Update (flight, detail): a catch is no longer a number that appears: a butterfly of the rolled species sets off from 5-8 m away (`Flier`, a catmull-rom path with meandering that dies away near the door, flapping wings, a span from the species' size), finds the way in (std: the gap between the net ring and the dish; sturdy: over the sill, the walls start higher; imported: the doorway of the skirt, the dome starts above it), rises to a resting spot and only then is counted (`t.inflight`); a trap that breaks drops the butterflies still on their way; online `arr` tells the others to show a flier (the count follows when it lands). Baits are real 3D: flower heads per shape (daisy, cornflower star, echinacea cone with drooping petals, clover ball, lavender/buddleia spikes of florets, thyme/phlox/verbena/lilac umbels) with shaded petals, stems and leaves, and a honeycomb piece with glossy honey caps, a puddle with drips, bubbles, crystal grains and a dipper; the shops show close-up renders of them (`Traps.closeup`). `trap_float.js` now works on triangles, also with the nets and resting butterflies left out (frame, dish and bait must hold together themselves) and checks that its own checker catches a floating mutant; `trap_flight.js` checks the flights (continuous, entering only through the entrance, landing at the spot, counted only after landing).
  Strange pheromones: the hooded trader of the secret market (`SecretMarket`) got a second shop tab «Предметы» (Tab / arrows / click): one flask «Непонятные феромоны», 3000 coins, bought as many times as wanted (`Traps.buy('hn', 'pheromone')`; it is a `HONEYS` entry with `secret: true`, so the honey seller does not list it). It goes into the honey place of a trap: weight multiplier of the uncommon/rare visitors x(1 + 0.9 * 25 * (rar - 1)) (in a typical location nine of ten visitors are uncommon or rare, against two of three with the best honey) and 10% of the visitors are aberrations (the maximum of the trap's own chance and the item's), plus its own lure. Its model is a glowing flask with a wax seal, rune band and a thread of smoke in a spilled puddle (`pheroPiece`). Test: `tools/test/pheromone_check.js`.
  Rules update: a trap lures only the species of the current landscape (`play.pool`, 9-10 butterflies of this location, the same for all players online; `Traps.pick(pool, ...)`), never other species of the biome. A worn-out trap (its life is over) vanishes together with everything in it: nothing is credited (`Sys.expire`). A regenerated landscape (the pause menu's «new landscape» or an accepted vote: `App.start` of the place you are in) takes your traps and their catch away too (`Sys.lose`, the server clears them as well); leaving the location in any way (the map, the cabinet, a chalet, the main menu) loses the traps with their catch too: only what you took out with «Забрать улов» is kept (`Sys.dispose` -> `lose`). The aberration chances add up: the trap's own (imported 1%) + the bait's (pheromones 10%) = 11%. Tests: `trap_pool_regen.js` (pools, regeneration), `mp_traps.js` (vote), `pheromone_check.js`.
  Discoverability: the expedition help screen lists «G — поставить ловушку; E у ловушки — приманка и улов», the hint line shows «G — ловушка», and entering a location with traps in the stock says how to put them (G; the key can be re-bound: «Поставить ловушку»).
  Baits are final: the window's sliders (`<` `>`, going round in both directions through the items in stock) only pick a candidate, «Положить» puts it into the trap (`Sys.bait`): the slot is then locked («Положено — достать обратно нельзя»), nothing can be taken back or replaced; flowers and honey are separate slots. Test: `trap_flow.js`.
- **Noise levels** (`Play.update`, the meter in `draw`): standing 1 bar, creeping 1, plain walking 3 bars (noise 0.6), running 8; for 6 seconds after a run (`P.tired`) walking stays at 4 bars (0.8), then drops back to 3. Test: `tools/test/noise_check.js`.
- **Version and landscape consistency online** (terrain bug «each player saw another hill»): the generator is deterministic (same seed gives the same ground whatever the order of builds, quality or save: `mp_terrain.js` checks Vietnam entered together / one after the other / again), so a mismatch could only come from clients running different builds. Every build now carries `BUILD_ID` (a hash of all sources, added by `tools/build.py`); the client sends it in `hello`, the server reads the id of the game file it serves and refuses to let a client with another build into any place («версия игры отличается от серверной — обновите страницу (Ctrl+F5)»). As a second net, after entering a location every client sends a signature of its ground (`sig`); the server compares them for the same seed and tells both players about a difference (`desync`: «Рассинхрон местности с игроком X…»). Tests: `mp_terrain.js`, `mp_version.js`.
- **Collections pay every pattern** (`Collection.info`): each pattern that holds (aberrants only, one family, one location, one colour, one species, only the rarest ...) is paid on its own, 400-1000 by how clean it is and how full the frame is, and the bonuses add up (`themes`, the window lists them line by line); four aberrants of one location and one family give three bonuses. **The sense (H) is blue**, and every trap carries a label «сломается в m:ss» that counts down (red in the last 20 seconds). Tests: `collector_check.js`, `sense_label_check.js`.
- **The skrichushka** (`Traps.TYPES.scr`, `src/traps.js`): a seventh good of the strange trader (secret market, tab «Предметы», 2288 coins; not sold by the trapper). A black trap with three eyes, a toothy smile, eight tentacles that spread over the ground, three glowing feelers and a bowl on its head for the flask: `body('scr')`. It can stand ONLY in the ocean, and in the ocean ONLY it can stand (`Traps.allowed`, also enforced by the server's `trapMsg`); it accepts nothing but one flask of «непонятные феромоны» (`TYPES.scr.baitOnly`, `Traps.accepts`; no flower slot in its window); it lures the ocean's own butterflies (the pool of the landscape, including the mystery ones: the catch can reveal the ocean's secret); it breaks after 6 minutes 66 seconds (426 s) with a scream (`Snd.sfx.scream`). Its lower jaw (`userData.jaw`) swings open when a butterfly is about to fly into the mouth and shuts with a snap (`Snd.sfx.chomp`), also on the other players' screens (`arr`); caught butterflies glow as bumps on its body. Ocean species cannot be aberrations, so in the ocean the pheromones only raise the rarity. Tests: `scr_check.js`, `mp_scr.js`, `trap_float.js` (mouth shut and wide open), `trap_flight.js` (flight into the mouth).
  Skrichushka look: pure white eyes without pupils, the feelers' tips and the bowl on its head are pale yellow. Market fix: the strut of the iron lamp arms on the alley walls (`arm()` in `src/market.js`) now leans out from the wall to the beam (the sign of its rotation was reversed).

## Звук поломки скричушки

Запись `assets/skrichushka_break.mp3` (2.4 с) встроена в HTML через `tools/make_sounds.py` → `src/sounds_gen.js` (base64). `audio.js` декодирует её при первом запуске звука (`decodeAudioData`) и проигрывает в `sfx.scream()`, когда скричушка ломается в радиусе 45 м (в том числе чужая). Если декодирование не удалось — играет прежний синтетический крик. Состояние проверяется через `Snd.scrInfo()`.

## Коробки в запасе и новый склад

- Пустые коробки больше не берутся на верстаке бесплатно: их продаёт торговец коллекциями (вкладка «Коробки»): малая — 200, средняя — 300, большая — 400 монет. Запас личный (`Save.data.boxStock`, как монеты), на верстаке кнопка размера показывает число коробок и создаёт коробку, расходуя запас. «Разобрать» возвращает коробку в запас. Вид (орех, дуб, чёрный лак) по-прежнему меняется на верстаке.
- Склад (I) — сетка слотов 10 × 5 со всеми предметами игрока, кроме бабочек и коллекций: обрывки записки, крылья путеводной бабочки, детали и собранные сачки, коробки, цветы, мёд, ловушки. Количество — в углу слота, при наведении — название и описание, колесо мыши и кнопки прокручивают сетку. Тесты: `tools/test/box_shop.js`.

## Коэффициенты закономерностей коллекции

Цена рамки = (рамка + бабочки) × произведение коэффициентов всех закономерностей, которым следует вся рамка (нужно заполнить хотя бы половину, не меньше 3 бабочек): только аберранты ×1,7, только редкие ×1,9, один вид ×1,2, одно семейство ×1,5, одна локация ×1,4, один цвет ×1,2, только разные бабочки ×1,5. Закономерность засчитывается, только если ей соответствуют все бабочки в рамке (прежние «чистота ряда» и фиксированные 400–1000 убраны). На верстаке список расправленных бабочек имеет те же пять фильтров, что стол расправления (`Spread.pick.filtersFor`); «Авто» кладёт только прошедших фильтры. Тесты: `tools/test/coll_mult.js`, `collector_check.js`.

**Минимальная аккуратность расправки:** процент расправки самой неаккуратной бабочки в рамке. В самом конце, после коэффициентов закономерностей, цена умножается на него: итог = (рамка + бабочки) × коэффициенты × мин. аккуратность / 100 (`Collection.info`: `minQ`, `qk`, `pre` — цена до этого шага). Если одна бабочка расправлена на 0 %, рамка ничего не стоит.

## Свет в музее

Зал стал вечерним: окружающий свет снижен (0,24), стёкла световых фонарей лунно-синие, потолок темнее. Акцент — на тёплых источниках: шесть подвесных ламп (живые точечные источники с лёгким «дыханием»), восемь настенных бра (слабые точечные источники, только при качестве не «низкое»), светлые ореолы вокруг каждой лампочки, свечей люстр и бра (аддитивные спрайты, свечи мерцают), тёплые пятна на полу под лампами, тёплые «умывания» стен под бра и под лампами над каждой из 24 настенных рамок (аддитивные плоскости, без лишних источников света).
