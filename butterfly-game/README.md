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
- (устарело, см. «Большие карты и сектора») A biome that nobody is in gets a **new seed** (new landscape, new butterflies) every time a player walks into it; later joiners get the same landscape. The cabinet and the market keep theirs.
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
- The fourth map, **Chiuauanskaya pustynya** (15000 coins, Chihuahuan Desert, Mexico), opens `ENV.chihuahua` (`desert: true`): a vast gravel plain with creosote flats, ocotillo, agaves, lechuguilla, sotol, soaptree yuccas, prickly pear, cholla, barrel cacti, mesquite in the dry washes, tumbleweeds and pale gypsum outcrops (builders `creosote … gypsum` in `TREES`), **arroyos** (dry washes cut into the relief, `washV`), coppice dunes, gypsum crusts and a distant range; landmarks: ranch windmill, wire fence, boulders. 28 species of the real fauna (whites, sulphurs, queen and monarch, Texas crescent, Hackberry emperors, pipevine/black/giant swallowtails, blues, metalmarks, the Sonoran marble …). The map picture is `drawChihuahua` in `secretroom.js`; the shop list scrolls now (three maps at a time: wheel, arrows, ▲▼) because there are four maps.
  - **The Sonoran marble** (*Euchloe guaymasensis*, the fourth red butterfly: `Rare.ids`): `fixedPrice` 2600 for a raw specimen (spread ×3, aberration ×~6), `scarce` 0.05 like the other reds (about 1.5% of the visits, no respawn, a tiny weight in traps: before that fix traps brought it up to 4% of all visitors), never taken by "sell all". Test: `tools/test/chi_check.js`.
  - **Quicksand**: 14-20 pits (4 on `#lite`) of 5-8.5 m with an irregular edge (`quick`, `qsDist`, `qsDepth`; `world.quicksand(x, z)` = 0..1, `world.onQuick(x, z, margin)`). They hardly differ from ordinary sand: a slightly smoother, paler patch and a faint overlay with ripples (nothing marks the edge). Nothing grows in them (`scatter`, grass, flowers skip them). Walking in a pit sinks you slowly and slows the legs (`Play.update`: `sinkT`, `sink` 0..1, speed × (1 − 0.32·depth − 0.5·sink), the eyes go down 1.1 m, the dark sand rises over the screen); standing still sinks 2.7× faster: in the heart of a pit you are dragged under in about 12 s and `F0W.sunk` wakes you up on the world map. Leaving a pit frees the legs (the sink recovers). The drive trap treats pits as walls (`okAt`, `planPath` `freeAt`, `spot`).
  - **Sandstorms** are a pure function of the wall clock and the map's seed (`world.stormSchedule`), so everybody on the same map sees the same one: every 4-minute slot has a storm with a 60 % chance, 40-70 s long with a 9 s build-up and die-down; a toast warns 25 s before. `world.storm` (0..1) thickens the fog to density 0.9 (sky, horizon, fog colour and the fog of every material are one dust colour: nothing but your own feet is visible) (and the foliage shader's fog), turns sky, sun and clouds dusty, switches on 800 flying sand grains, shakes the grass, drops the outlines of far things and tints the screen; **butterflies stop flying** (they settle on the ground or on a flower and sit until it passes; they startle only at a very short distance). The **map module** (`Gear.drawMap`) goes mad in a storm: torn bands, static, red tint, error messages (drawn on its own little screen, never outside the bezel), a jumping arrow and a corrupted zone caption, with full dropouts; the screen of the module on the net model turns red and flickers; the trap's route menu glitches the same way and its clicks land off target. Sound (`Snd.setStorm`): a low roar, a sweeping howl, the hiss of sand and a whistle in the thorns, gusts and rattling grains as events, the insects go quiet. A test can force a storm with `world.stormForce = { start, end }` (`null` = none). Tests: `tools/test/chi_world.js`, `chi_quick.js` (sinking, schedule, storm, trap), `chi_models.js` (a sheet of the desert plant models), `model_float.js` (no model of `World.TREES` has a part that hovers) and `bog_float.js CH1 chihuahua` (the same for the whole desert), `route_trap.js` (route editor, driving the route, navigation error in a storm, the map module), `chi_view.js`, `chi_plants.js`, `chi_art.js` (pictures).

## Main menu panoramas

The backdrop of the main menu (and of its sub-screens) is a pixel-art panorama of one location (`src/panorama.js`, `Panorama`): 11 daytime scenes (meadow, Alps, Greece, Amazon, Borneo, Kenya sunset, prairie, Japan with Fuji, New Guinea volcano, Vietnam karst, Chihuahuan Desert) and the original night forest for the bog; the ocean has none. A new one is picked on every new entry into the menu (never twice in a row; coming back from the multiplayer, help, keys or settings sub-screens keeps it); the butterflies flying over it are species of that location. The butterflies scatter away from the mouse cursor and drift back to their flight path afterwards. Tests: `tools/test/panos.js`, `tools/test/flyers_scare.js`.

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

В стеллажах под каждой полкой (и под карнизом) над каждой рамкой висит маленькая латунная музейная лампа: пластина, рычаг, колпак с нитью и тёплым светящимся шаром (36 ламп), с ореолом и мягким светом на рамке.

## Бабочки как 3D-модели

В 3D-сценах пришпиленные бабочки больше не картинки: в рамках кабинета (стена, стол) и музея (столы, стеллажи, стены) каждая бабочка — настоящая модель из четырёх крыльев в той позе, в какой её расправили, чуть приподнятых к кончикам, с телом, головой, усиками и булавкой (`Boxes.mount3D` / `Boxes.buildMount`; крылья одной рамки склеены в один меш по атласу, тела — в другой, рамка даёт 2 вызова отрисовки). Подложка рамки рисуется без бабочек (`Boxes.canvas(box, true)`). Так же сделаны витрины музея под стеклом, купол на постаменте, доска расправления и рамки на стене кабинета (`Art.makeButterfly`), рамки и баннеры на рынке. Окна интерфейса (журнал, карточки, списки торговцев, стол расправления) остаются 2D-экранами.

## Музей: одно место за раз

В музее `E` работает с тем местом, на которое смотрит игрок (в пределах 2,8 м и ~20° от центра экрана, `Mus.lookSlot`): вокруг него светится рамка, подсказка называет его («E — стена 2: положить коробку» / «…: снять коробку»). Открывается окно именно этого места (`Boxes.slot`): список свободных коробок, которые сюда подходят (щелчок — коробка встаёт на это место), либо превью стоящей коробки и кнопка «Снять коробку». Прежнее окно с вкладками осталось в кабинете. Глобусы с верха книжных шкафов музея убраны. Бабочки в рамках кабинета и под стеклом в музее теперь с освещаемыми материалами (не светятся сами по себе). Тест: `tools/test/mus_slot.js`.

В кабинете энтомолога та же система: `E` работает с местом, на которое смотрит игрок (до 2,4 м, ~18° от центра): одно из шести мест на стене, одна из двух витрин на столе или один из ящиков стола (`Cab.lookSlot`, подсветка рамкой, подсказка называет место). Окно места (`Boxes.slot`) предлагает только подходящие коробки; в ящик помещается до 4 единиц (малая 1, средняя 2, большая 4), окно остаётся открытым, а лежащие в нём коробки достаются щелчком. Тест: `tools/test/cab_slot.js`.

## Сырые бабочки: 3D-модель отдыхающей бабочки

Неразобранные (сырые) экземпляры — трёхмерная модель сидящей бабочки по фотографии махаона: сложенные над спиной крылья (переднее наклонено к голове, заднее назад, хвостики свисают), две пары крыльев (левая и правая, чуть разведены, обе видны), тело, голова и усики — родная модель бабочки из игры (`makeButterfly` без крыльев), шесть блочных (пиксельных) лапок из квадратных сегментов, как усики: бабочка мёртвая, тело лежит, лапки подогнуты под него и скрещены (каждая стопа заходит на другую сторону) (`Art.makeResting`). Узор берётся из крыльев самого вида (`wingParts`), поэтому аберрации и редкие виды получают свой узор; размер — по размаху крыльев вида. На карточках «Что расправим?» — снимок этой модели (`Art.restingPic`, один раз на вид), а на столе расправления в кабинете на пробковом подносе сидят до четырёх свежих сырых бабочек. Тест: `tools/test/resting3d.js`.

На рынке у скупщика сырые (неразобранные) экземпляры в списке и в карточке тоже показаны 3D-моделью мёртвой бабочки (`Mkt.drawSpecimenPic`), расправленные — прежней плоской картинкой.

## Музей: фасады ящиков; Борнео: основание деревьев

- Три фасада ящиков в низких витринах музея теперь считаются от ширины самой витрины (раньше стояли на фиксированных ±0,8 м и в узких витринах 2 м вылезали за край).
- Диптерокарпус Борнео (`TREES.dipt`): вместо четырёх плоских досок — расширяющаяся мшистая нога ствола, 5–7 тонких изогнутых досчатых корней-контрфорсов (`buttressG`), стелющиеся по земле корни, борозды коры. Тест целостности: `tools/test/dipt_float.js`.

## Расправилки

У каждого игрока своя расправилка на столе (личное, как монеты: `Save.data.spr`). Девять видов (`src/spreaders.js`): обычная (1 бабочка, бесплатно), удлинённая (3, 4200 монет), сильно удлинённая (6, 6700), невероятно удлинённая (10, 10800), огромная (16, 16800), гигантская (26, 27300), невероятно огромная (33, 43400), невероятно гигантская (40, 50000), механическая (50, 80000; с шансом 10 % результат всей партии +5 %). Цены, кроме названий и вместимости, выбраны мной. Покупка — у торговца коллекциями (вкладка «Расправилки»); смена — кнопкой «Расправилка…» в «Что расправим?».

Как работает: в «Что расправим?» щелчок по карточке кладёт на доску ещё одну бабочку этого вида (а когда их нет или доска полна — снимает), «Выбрать до N», «Сброс», «Расправить (k)». Расправляется вручную только первая выбранная; остальные получают тот же процент и ту же позу (`Spread.G.finish`). Защита от дублей: каждая бабочка один раз; проданные, положенные в коробку или уже расправленные в партии пропускаются. 3D-модель у каждой доски своя (`Spreaders.model`, одна на 1/3/6/…/50 канавок, у механической — шестерни, пружины, трубки, рукоятка, лампа; шестерни вращаются) — на столе в кабинете, в окне магазина, на складе. Тест: `tools/test/spreaders.js`.

## Этикетка под бабочкой в рамке

Этикетка занимает 4 строки самым мелким шрифтом (поднята ближе к бабочке): название целиком (переносится на 2–3 строки, не обрезается), затем «процент · дата поимки», затем латинское название и место поимки, если остаётся строка (`Boxes.labelLines`). Тест: `tools/test/label.js` (все 328 видов).

**Этикетки у каждой рамки свои** (`box.lab`): «Детальные» (полная этикетка), «Обычные» (одна строка, как было раньше — они же у рамок, сделанных до этого) и «Нет» (под бабочками ничего; бабочки чуть ниже по центру ячейки). Выбираются кнопкой «Этикетки» в мастерской: новая коробка получает выбранный вид, у выбранной снятой со стены коробки вид меняется сразу. Синхронизируется по сети (`boxLab`, сервер проверяет значение). Тест: `tools/test/label_modes.js`.

## Большие карты и сектора (природные зоны)

**Карта.** Каждая локация, кроме океана, — одна очень большая карта: радиус игровой зоны 130 м (раньше 58 м, площадь ×5; архипелаг Вьетнама — как был, радиус 120 м). Всё, что рецепты биомов задают «в метрах от центра» (пруды, реки, лавовый поток, ориентиры, аллеи, лесопосадки, лучи света), растёт вместе с картой (`SC` в `World.build`), а количество деревьев, кустов, камней, трав и цветов умножается на `K` (=4). Ориентиров на карте 4 вместо 2, рек две.

**Сектора** (`src/sectors.js`, `Sectors.make(biome, seed, R)`). Квадрат карты режется на 5 прямоугольников «гильотиной» (случайные разрезы поперёк длинной стороны): они примыкают вплотную, никогда не лежат друг в друге и всегда связаны; раскладка проверяется на «честность» (в каждом секторе ≥ 11 % круглого игрового поля), иначе берётся следующая попытка. Раскладка и распределение видов зависят **только от сида** места, поэтому у всех игроков одно и то же. Виды делятся поровну: 31 = 6+6+6+6+7 (лишний — в случайный сектор), 25 = 5×5, 27 = 6+6+5+5+5 и т. д.; в каждом секторе перемешаны обычные и редкие. У каждого сектора свой цвет и имя по сторонам света (Север, Юго-запад, Центр…).

**Бабочки.** Больше нет «пула из 9–10 видов на сид»: на карте сразу живут все виды локации (`play.pool` = `biome.species`), каждый стартует в своём секторе и по большей части остаётся в нём; цель полёта вне родного сектора принимается с вероятностью 30 % (изнутри) / 12 % (если уже вне дома), так что бабочки иногда перелетают границу и возвращаются. Самые редкие виды секретных карт появляются через 4–10 минут после входа. Далёкие (> 95 м) бабочки считаются раз в три кадра.

**Меню «Карта и виды»** (клавиша **M**, кнопка 🗺 на сенсорном экране, пункт паузы) вместо 9 значков сверху: слева карта с секторами (границы — пунктир двух цветов, чередуется вдоль общей линии), метка игрока и других игроков, справа все виды локации («?» у ненайденных, как раньше; «✓» у найденных). Наведение на сектор подсвечивает его виды, наведение на вид — его сектор; под сеткой — «Сектор N · имя, видов, найдено». В углу экрана вместо ряда значков теперь маленькая плашка «Сектор N · имя / сколько найдено / M — карта».

**Ловушки.** Ловушка ловит бабочек сектора, в котором стоит (`Traps.Sys.visitors`); если она стоит у границы (в пределах `Sectors.EDGE` = 0,75 м), то для каждого гостя случайно выбирается один из соседних секторов (на углу — из трёх-четырёх). При установке сообщается сектор. Скритчушка (океан) не менялась.

**Перегенерация.** Кнопка в меню, голосование и перезаход одного игрока **удалены** (клиент: `Net.vote`, `Chat.drawVote`, `Y/N`; сервер: `regen`, `voteReply`, «пустое место получает новый сид», кроме океана). Вместо них — новая механика: местность создаётся заново **каждый час реального времени** (`Sectors.PERIOD`), с новым сидом, а значит новым рельефом, новой раскладкой секторов и новым распределением видов. Онлайн отсчёт ведёт сервер (`state.born`, `REGEN_MS` — только для тестов; в `joined` приходит `ttl`; в конце — сообщение `reseed`); в одиночной игре ландшафт хранится в сохранении (`Save.world`, `Save.data.worlds`) и живёт час даже между заходами. За минуту и за 10 секунд игра предупреждает; свои ловушки при смене пропадают вместе с уловом. Океан работает как раньше (новая местность при каждом входе в пустое место, без таймера).

Тесты: `tools/test/sectors.js` (раскладка × 440 сидов, распределение видов, бабочки, перелёты, меню, ловушки и граница, перегенерация в одиночной игре), `tools/test/mp_sectors.js` (общий сид и сектора, таймер сервера, сигнал `regen` игнорируется, смена местности у всех). Старые `mp_vote.js` и `trap_pool_regen.js` удалены.

**Производительность большой карты.** Крупные инстансные группы (деревья, кусты, камни, трава, цветы) режутся на квадратные ячейки 44 м; ячейка вне поля зрения (и в тумане дальше `1,9 / плотность тумана` метров) не рисуется, а в теневой проход попадают только ячейки ближе 95 м (`world.cull`, вызывается каждый кадр из `Play.update`). Бабочки дальше 95 м от игрока считаются раз в три кадра и скрываются за 130 м. Отладочный флаг `#lite` в адресе (`index.html#debug&lite`) строит старую маленькую карту (R 58): им пользуются многооконные тесты (`tools/test/mp_*.js`), потому что программный GL в тестовом окружении тянет большую карту ~1 кадр/с. `mp_sectors.js` и `sectors.js` идут на полной карте.

**Правки после проверки на реальной машине.** Радиус карты 184 м (площадь ×2 от прежней 130 м; `K` = 7, сектора и таймер считаются от `world.R`). Старый «пригорок» вокруг спауна был остатком чаши у границы старой маленькой карты (`r − 56`) — теперь она начинается у настоящей границы. Реки не пересекаются друг с другом и не заходят на пруды (`makeRiver` отбраковывает такие, `makePond` обходит реки). Берега: тростник/осока/рогоз (отдельный инстанс-меш по сетке расстояний до воды) и больше прибрежных кустов. Амазония: у `giant` теперь расширенное основание, тонкие досковидные корни и поверхностные корни. В Альпах нет цветов на крутых склонах. Океан: в пуле сразу все 15 видов. Тест `tools/test/world_check.js` (воды, кольцо, висящие деревья/камни/ориентиры, цветы в Альпах, тростник; `MUTANT=1` проверяет сам тест).

**Консоль:** команда `force generate` (только внутри локации) принудительно создаёт её заново: одиночная игра — сразу новый сид, онлайн — сообщение `force`, сервер обновляет место для всех в нём (`renew`). Вне локации пишет «Команда работает только в локации».

**Правки:** рогоз качается вместе со стеблями (шейдер головок берёт тот же ветер, что и растительность); «сектора» везде в игре переименованы в «природные зоны»; карта зон нарисована как настоящая карта: теневой рельеф по реальным высотам, вода и берега, леса значками, градусная сетка, кольцо границы с делениями на пергаменте, компас, масштаб 50 м, таблички зон при наведении.

**Ввод на слабых клиентах и большой карте:** после остановки кадра (сборка большого мира) накопившиеся движения мыши отбрасываются (и 0,7 с после входа), событие мыши ограничено ±160 пикселей, удержанные при загрузке клавиши сбрасываются; часы игры могут отставать от реальных не больше чем в 10 раз (было 20); fps для автоснижения качества меряется по реальному времени, второй ступенью включается сокращённая дальность прорисовки (`world.cullScale`).

**Меню на слабой видеокарте:** пока открыто меню (пауза, карта, журнал, ловушка), 3D-сцена за ним рисуется один раз при открытии и больше не перерисовывается, чтобы очередь работы видеокарты не задерживала курсор и кнопки.

**Лаги в локации на мощных ПК:** найдена причина — деревья с очень подробной геометрией (хвойные и др., ~23 000 треугольников каждое) разбивались на ячейки только если экземпляров одного вида было больше 150, поэтому при большой карте их десятки тысяч треугольников ×сотни рисовались всегда, без отсечения (до 8 млн треугольников за кадр + столько же в теневом проходе). Теперь ячейки режутся с 12 экземпляров, дальние ячейки прореживаются, подробные деревья в полном числе только вблизи; на кадр приходится ~0,3–1 млн треугольников.

**LOD вместо прореживания:** дальние ячейки больше не обедняются (лес остаётся такой же густой). Подробные деревья (>1500 треугольников) вдали рисуются своей упрощённой копией (`proxyOf`: кластеризация вершин, те же цвета и силуэт, в разы меньше треугольников); копия делит буфер экземпляров с оригиналом. Ближе 75 м — полная модель, тени подробных деревьев — только ближе 48 м.

**Плавная смена детализации:** подробное дерево и его упрощённая копия рисуются одновременно в полосе 62–94 м, каждый пиксель принадлежит ровно одной из них (одинаковый экранный шум для обеих, `fadeMat` в `world.js`), поэтому переход растворяется в пиксельном стиле, а не щёлкает.

**Карта мира:** булавки и жёлтая рамка выбора рисуются на целых пикселях (рамка 15×19 строго по центру булавки); цвета суши — плавные климатические пояса со смещением шумом, пустыни мягкими пятнами, рельеф и упорядоченное дрожание вместо прямоугольных полос; компас нарисован целыми пикселями.

**Локаторы на карте зон:** игрок — стрелка из целых пикселей, направленная по взгляду (мигает белым/золотым); онлайн — такие же стрелки других игроков (цвет по нику) с табличками с никами, свой ник помечен «(вы)».

**Энтомолог-энтузиаст** (новый торговец рынка насекомых, у северного края восточной площади; `Gear.ITEMS`, `src/gear.js`). Молодой энтомолог с огромным рюкзаком (полотняный ранец, скатка, сетка на шесте, треножник, банка, фонарь, солнечная панель, антенна — `enthusiastLook` в `market.js`), портрет `Portrait` вид `enthusiast`, окно покупок (оверлей `gear`, 13 товаров, 3D-превью через `Art.snapshot`). Товары: **пушка-сачок** 150000 (особый сачок в списке, `cannon:true`, выдаётся в руки при покупке, разобрать нельзя, стреляет сетью на 30 м раз в 2,2 с, сеть втягивается лебёдкой с уловом); **приспособления** (личный склад `Save.data.gad`, до трёх на сачок, надеваются на верстаке в кабинете): «Карта» 100000 (мини-карта природных зон у края экрана с помехами ЭЛТ, стрелки игроков), «Инфракрасный сканер» 130000 (раз в 10 с луч-радар, подсвечивает контуром всех бабочек), «Автономность» 70000 (переключатель на клавише X / кнопке ⚙, сачок замахивается сам); **детали сачков** (`gear:true`, в обычный магазин сачков не попадают): обруч с шокером 85000 (при поимке дуги тока ловят до 7 соседних бабочек), механизированная ручка 115000 (выдвигается до 300% досягаемости по расстоянию до бабочки), сетка из феромонных верёвок 115000 (бабочки подлетают к сачку), ручка с поршнем 120000 (рывок вперёд при взмахе), вольфрамовые сетка 180000 (25% аберрантов, −30% к скорости взмаха), обруч 180000 (25%, шум +35%), ручка 220000 (50%, владелец медленнее на 25%); **ловушка с приводом** 25000 и **синтетические цветы** 5000 (см. ниже). Всё видно другим игрокам: код сачка в `pos.nt` (`h.r.m+гаджеты` или `cannon+гаджеты`, сервер принимает `^[a-z0-9_.+,]{0,90}$`).

**Ловушка с приводом** (`Traps.TYPES.drv`, `gear:true`): гусеничный вездеход с сетчатой кабиной (гусеницы из траков, опорные катки, радар-тарелка, GPS, мигалка, антенна, солнечная крыша), живёт 14 минут, вмещает 30 бабочек, встроено 40% аберрантов (`ab`) и 40% редких видов (`rare`: добыча выбирается среди видов с `rar ≥ 2`). Игрок кладёт приманку и жмёт «Запустить» в окне ловушки (E): вездеход едет **по маршруту, который задаёт игрок** (кнопка «Маршрут» открывает карту локации, клик ставит точку — до 12, в любом месте локации: если туда не проехать, точка сдвигается к ближайшему проезжему месту; «Убрать точку», «Очистить»; `Traps.routeAdd/routeUndo/routeClear`, `D.route`, `D.next`) — по точкам по порядку (A* с объездом деревьев, воды и зыбучих песков, при застревании — манёвр, а через 30 с — «стоянка где застряла»), в каждой точке стоит `min(4 мин, (остаток жизни − дорога) / оставшиеся точки)`, после последней остаётся стоять и ловит. Без маршрута «Запустить» отказывает. **Песчаная буря** (`world.storm > 0.3`) сбивает навигацию: вездеход тут же встаёт («Ошибка навигации!»), не поедет, пока буря не утихнет, а потом сам едет дальше к той же точке (`D.navErr`). — **ловит только на стоянке** (в пути вылетевшие к ней бабочки отменяются, новые не прилетают). «Остановить» в любой момент: вездеход встаёт и продолжает ловить; «Запустить» / «Ехать дальше» возобновляет объезд. Сеть: владелец шлёт `trap k:'mv'` (x, y, z, yaw, run) пять раз в секунду, сервер хранит позицию (для заходящих позже) и рассылает; чужой вездеход плавно едет к последней позиции, гусеницы и катки крутятся по скорости. **Синтетические цветы** (`Traps.FL.synth`, запах 5, `rare: 0.25`): шанс редких вида = 1 − (1 − 0,4)·(1 − 0,25) вместе с вездеходом.

Тесты: `gear_shop.js` (покупки всех 13 товаров, окно), `gear_play.js` (шокер, досягаемость механической ручки, рывок, вольфрам, феромонная сетка, ИК-сканер, автономность, пушка), `gear_bench.js` (верстак, склад приспособлений), `drive_trap.js [big]` (объезд всех зон, стоянки, «не ловит в пути», остановка рукой, доли аберрантов и редких), `mp_gear.js` (чужой сачок со снаряжением, вездеход у других игроков и у вошедшего позже), `trap_float.js` (модель вездехода и синтетических цветов ничего не «подвешивает»). Тесты шагают симуляцию вручную (`p.update`), потому что программный GL рисует кадр секундами.

**Поиск пути самоходной ловушки (правка).** Раньше вездеход рулил «в лоб» с локальным объездом и в густом лесу часто застревал: через 30 с он «останавливался где застрял» и засчитывал зону посещённой (часто одну и ту же). Теперь `Sys.planPath` строит маршрут A\* по сетке 1 м (непроходимы деревья, камни и крутые склоны с запасом 1,4 м, затем 0,95 м; вода проходима, но втрое «дороже» и вдвое медленнее — вездеход плавающий), выпрямляет его по линии видимости и ведёт по точкам; при задержке дольше 3,5 с маршрут перестраивается, из тесного места вездеход всегда может выехать. Цель в зоне подбирается на суше (`setTarget`, до 10 попыток), недостижимая зона пропускается с сообщением. Тест `tools/test/drive_path.js [биомы] [сиды]` (`LITE=1` — малая карта): каждый заезд должен закончиться стоянкой именно в нужной зоне без «застряла» (48 заездов на малой и 40 на большой карте проходят). Пушка-сачок получила больше деталей (рёбра охлаждения, планка с прицелом, затвор с рукоятью и окном зарядов, цевьё, прорезиненный приклад, вентиль, труба, складки сети и грузики на раструбе, верёвка вдоль ствола).

**Правки гаджетов.** Механизированная ручка достаёт бабочек до 12 м (`fx.mech` = предельная досягаемость в метрах; вылет подбирается по расстоянию до ближайшей бабочки перед игроком, сачок слегка наклоняется вниз, чтобы обруч проходил на высоте цели); проверка улова идёт по всему пути обруча за кадр (отрезок), иначе быстрый длинный обруч «перелетал» бабочку. Обруч с шокером бьёт током всех бабочек в радиусе 15 м от пойманной (до 24 штук). Пушка-сачок на складе рисуется настоящей 3D-моделью.

**Сеть пушки — настоящая ткань** (`Shot` в `gear.js`): сетка 9×9 узлов на нерастяжимых нитях (0,5 м, но свободно сминаются), шаги Верле по 1/120 с, тяжесть и сопротивление воздуха. Сеть вылетает из ствола свёрнутым комком со скоростью 38 м/с, тяжёлые грузики по краю летят в стороны и раскрывают её; дальше полёт по параболе (целиться надо чуть выше), ткань ложится на землю, волочится, упирается в стволы и камни (`world.colliders`); после полёта лебёдка тянет центр к дулу, остальное тянется следом. Бабочка попадает в улов, когда касается ткани (расстояние до любого из 128 треугольников); пойманные висят на узлах и едут вместе с сетью (`Fly.glueTo`). Сеть видна только владельцу.

**ИК-контур.** Сканер подсвечивает бабочек по контуру крыльев: для каждого крыла создаётся увеличенная копия с шейдером, который читает альфа-канал текстуры крыла и рисует яркую красную кайму у края и мягкое свечение вокруг; тело подсвечено красным, рисуется поверх листвы (depth test выключен). Квадратные рамки убраны, остались подписи расстояния. Сачок на рюкзаке торговца: мешок свисает с обруча наружу, обруч касается шеста.

**Верёвка пушки** теперь тоже физическая: цепочка из 24 частиц от дула до центра сети (Верле, тяжесть, сопротивление; длина = расстояние × 1,07 + 0,5 м — барабан сматывает и разматывает её, поэтому верёвка провисает и лежит на земле), каждый отрезок — отдельный цилиндр. **ИК-сканер:** снова штриховой квадрат вокруг каждой подсвеченной бабочки (бегущие пунктиры, мигает перед угасанием) плюс более жирный и красный контур; толщина контура растёт с расстоянием, чтобы далёкие бабочки не терялись.

**Ловушка с приводом во Вьетнаме (острова и мосты).** Планировщик (`planPath`) знает о мостах (`world.bridges`): на настиле едет только по средней линии (доски 1,76 м, вездеход 1,4 м), износившиеся мосты — в последнюю очередь; сетка 0,6 м и свободные диагонали, склоны до 1,1 (при движении допускается 1,65, как у игрока), узкая щель между мостом и землёй проезжается, если дальше твёрдая земля. Цель в зоне выбирается среди **достижимых** клеток (один заливочный проход Дейкстры, не ближе 3,5 м к границе зоны): зоны на отрезанных островах пропускаются с сообщением, а не «застряла». «Прогресс» теперь измеряется по пути (путь может уходить от цели, чтобы обойти пропасть к мосту) — раньше из-за этого вездеход считал себя застрявшим на мосту. Если мост под ним рухнул, вездеход возвращается на последнюю твёрдую точку. Тест `tools/test/drive_vn.js [сиды]` (3 острова: все остановки в нужных зонах, без «застряла»). Сачок на рюкзаке энтузиаста убран (остался треножник).

## Steam
Everything for a Steam release is in `steam/` — start with `steam/STEAM.md` (checklist, what must be done by hand, legal points to check first). The desktop shell (`desktop/main.js`, `preload.js`) starts Steamworks when `steam/steam_appid.txt` holds a real AppID, keeps the save in a real file (`saves/save.json`, Steam Auto-Cloud) and reports 13 achievements (`src/steam.js`, list in `steam/achievements.json`). Store texts: `steam/store_page.md`; graphics: `steam/capsules/`, `steam/screenshots/` (regenerate with `tools/test/steam_art_src.js` + `tools/make_steam_art.py`, `tools/test/steam_shots.js`). Test of the bridge: `tools/test/steam_bridge.js`.

## Languages (Russian / English)
The whole interface is available in English. Switch: main menu (top right «Язык / Language») or Settings; the choice is saved (`settings.lang`), the first start follows the system language (`#lang=ru|en` in the URL forces one; `#debug` pages stay Russian for the tests).
How it works: all texts in the sources are Russian; `src/i18n.js` (`I18N.tr`) translates them where they are drawn (`T.draw` / `T.wrap` / `T.width`): the exact text is looked up first, texts composed at run time (numbers, names, glued pieces) are translated piece by piece (the longest known pieces first, only at word boundaries). The dictionary `src/lang_en.js` is generated by `tools/i18n/merge.py` from `tools/i18n/chunks/en_*.json` (+ species names from the data and manual corrections in `tools/i18n/fixes.json`).
Adding or changing a Russian text: `node tools/i18n/extract.js` lists the new texts (`keys.json`), add their English to `fixes.json` (or a chunk file), run `python3 tools/i18n/merge.py` and `python3 tools/build.py`.
Tests: `tools/test/i18n_cover.js [shots]` (tours the screens in English, lists texts still containing Russian and texts running off the canvas / out of buttons), `node -r ./tools/test/en_wrap.js tools/test/<any test>.js` (runs any test in English and lists untranslated texts).
