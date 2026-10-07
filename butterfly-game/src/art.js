// ---------------------------------------------------------------- butterfly art: procedural pixel wings, specimens, 3D models
const Art = (() => {
  const N = 40; // wing canvas: right half-wing, body edge at x=0, fore at top, hind below

  const SHAPES = {
    std:      { f: [[0, 17], [2, 8], [12, 2.5], [27, 4], [36, 10], [34, 19], [22, 20], [10, 20]], h: [[0, 19], [12, 20], [27, 21], [34, 27], [29, 35], [17, 38], [7, 34], [2, 27]] },
    swallow:  { f: [[0, 17], [2, 8], [12, 2.5], [27, 4], [36, 10], [34, 19], [22, 20], [10, 20]], h: [[0, 19], [12, 20], [27, 21], [32, 26], [32, 32], [26, 35], [14, 36], [6, 33], [2, 27]],
                tail: [[24, 30], [30, 29], [31, 38], [28, 39]], longTail: [[23, 30], [30, 29], [33, 39.5], [29.5, 39.5]] },
    pierid:   { f: [[0, 19], [4, 6], [18, 2.5], [30, 6], [35, 14], [30, 20], [12, 21]], h: [[0, 20], [15, 21], [27, 22], [30, 29], [23, 34], [10, 34], [3, 28]] },
    blue:     { f: [[0, 17], [3, 7], [15, 3], [28, 5], [33, 12], [30, 19], [10, 20]], h: [[0, 19], [13, 20], [26, 21], [31, 27], [26, 33], [14, 34], [5, 30]] },
    long:     { f: [[0, 18], [4, 10], [18, 4], [37, 6], [39, 12], [30, 19], [10, 20]], h: [[0, 20], [15, 20], [25, 24], [23, 31], [11, 34], [3, 28]] },
    birdwing: { f: [[0, 18], [5, 10], [22, 3], [39, 4], [38, 10], [26, 17], [10, 20]], h: [[0, 19], [18, 20], [30, 23], [33, 30], [24, 35], [10, 34], [3, 28]] },
    round:    { f: [[0, 18], [4, 8], [15, 3], [30, 5], [36, 12], [32, 20], [12, 21]], h: [[0, 20], [15, 21], [30, 23], [35, 30], [28, 37], [12, 38], [4, 31]] },
    // ---- more forms (Papilionidae)
    papilio:  { f: [[0, 17], [2, 8], [12, 2.5], [27, 3.5], [37, 9], [35, 18], [22, 20], [10, 20]], h: [[0, 19], [12, 20], [27, 21], [33, 25], [34, 30], [29, 35], [23, 36], [17, 34], [10, 36], [4, 32], [2, 26]],
                tail: [[25, 33], [31, 31], [33, 38.5], [29.5, 38.5]], longTail: [[24, 33], [31, 31], [34, 39.5], [30, 39.5]], spoonTail: [[24, 33], [29, 31], [30, 35], [34, 37], [33.5, 39.5], [28, 39.5], [28, 36]] },
    iphiclides: { f: [[0, 17], [2, 8], [12, 2.5], [28, 3], [38, 8], [34, 18], [22, 20], [10, 20]], h: [[0, 19], [12, 20], [27, 21], [32, 25], [33, 29], [29, 31], [26, 33], [22, 31], [18, 35], [13, 32], [8, 35], [4, 31], [2, 26]],
                tail: [[26, 32], [31, 30], [32, 38], [29, 38]], longTail: [[25, 32], [31, 30], [33.5, 39.5], [30, 39.5]] },
    kite:     { f: [[0, 18], [3, 8], [15, 3], [31, 2.5], [39, 6], [34, 12], [30, 18], [14, 20]], h: [[0, 20], [12, 21], [24, 22], [28, 26], [25, 31], [15, 32], [5, 28]],
                tail: [[20, 30], [26, 29], [28, 36], [25, 36]], longTail: [[19, 30], [26, 29], [30, 39.5], [27, 39.5]], spoonTail: [[19, 30], [24, 29], [26, 33], [31, 35], [31.5, 39.5], [25, 39.5], [23, 34]] },
    lamproptera: { f: [[0, 18], [4, 10], [16, 5], [28, 6], [33, 10], [28, 16], [18, 19], [8, 20]], h: [[0, 20], [10, 21], [20, 22], [24, 26], [20, 30], [10, 30], [3, 26]],
                tail: [[18, 28], [22, 27], [24, 36], [22, 36]], longTail: [[18, 28], [22, 27], [26, 39.5], [24, 39.5]] },
    aristolochia: { f: [[0, 18], [3, 9], [16, 3], [30, 5], [37, 10], [33, 17], [24, 20], [10, 20]], h: [[0, 20], [12, 21], [26, 22], [33, 26], [33, 32], [28, 36], [22, 36], [14, 35], [7, 33], [2, 27]],
                tail: [[25, 33], [30, 32], [31, 38.5], [28, 38.5]], longTail: [[24, 33], [30, 32], [32, 39.5], [28, 39.5]] },
    festoon:  { f: [[0, 18], [3, 8], [15, 3], [28, 5], [35, 10], [33, 18], [20, 21], [8, 21]], h: [[0, 20], [12, 21], [26, 22], [32, 26], [33, 31], [30, 35], [26, 33], [22, 37], [18, 34], [13, 37], [8, 34], [3, 30]],
                tail: [[21, 35], [26, 34], [27, 39], [23, 39]] },
    apollo:   { f: [[0, 18], [3, 8], [14, 3], [28, 3.5], [36, 9], [35, 16], [26, 21], [10, 21]], h: [[0, 20], [14, 21], [28, 22], [34, 28], [32, 34], [22, 38], [10, 37], [3, 31]] },
    trog:     { f: [[0, 18], [5, 10], [22, 3.5], [39, 3], [39, 7], [28, 14], [22, 19], [8, 21]], h: [[0, 20], [16, 21], [28, 24], [32, 29], [26, 34], [12, 35], [4, 29]] },
    // ---- Pieridae
    sulphur:  { f: [[0, 18], [4, 7], [18, 3], [31, 5], [36, 10], [34, 17], [26, 20], [12, 21]], h: [[0, 20], [14, 21], [27, 22], [31, 28], [26, 34], [12, 35], [3, 29]] },
    brimstone: { f: [[0, 18], [3, 8], [16, 3], [30, 3], [37, 6], [33, 14], [31, 19], [12, 21]], h: [[0, 20], [15, 21], [29, 23], [36, 29], [28, 32], [22, 37], [10, 35], [3, 29]] },
    orangetip: { f: [[0, 18], [3, 8], [15, 3], [28, 2.5], [35, 4], [38, 8], [33, 11], [33, 17], [28, 20], [12, 21]], h: [[0, 20], [14, 21], [26, 22], [30, 27], [25, 33], [12, 34], [3, 29]] },
    phoebis:  { f: [[0, 18], [5, 8], [20, 3], [35, 3.5], [38, 6], [32, 11], [30, 19], [10, 21]], h: [[0, 20], [16, 21], [28, 23], [33, 29], [27, 35], [13, 36], [4, 31]] },
    delias:   { f: [[0, 18], [6, 6], [22, 2.5], [34, 8], [34, 16], [24, 20], [8, 21]], h: [[0, 20], [12, 21], [24, 22], [28, 27], [22, 31], [10, 31], [2, 26]] },
    leptosia: { f: [[0, 18], [4, 8], [16, 4], [28, 6], [32, 13], [27, 19], [10, 20]], h: [[0, 20], [12, 21], [24, 22], [28, 27], [23, 32], [10, 32], [3, 26]] },
    // ---- Lycaenidae
    hairstreak: { f: [[0, 18], [3, 8], [15, 3.5], [28, 5], [34, 10], [32, 17], [20, 20], [8, 20]], h: [[0, 20], [12, 21], [24, 22], [29, 26], [30, 31], [28, 35], [22, 34], [14, 35], [6, 32], [3, 27]],
                tail: [[26, 33], [29, 32], [30, 38.5], [28.5, 38.5]], longTail: [[25, 33], [29, 32], [31, 39.5], [29, 39.5]],
                twoTail: [[[24, 33], [27, 32], [27.5, 38.5], [26, 38.5]], [[28.5, 31], [31, 30], [33, 36], [31.5, 36]]] },
    copper:   { f: [[0, 18], [4, 8], [16, 4], [28, 6], [34, 11], [31, 18], [14, 20]], h: [[0, 20], [12, 21], [24, 22], [28, 27], [27, 32], [20, 34], [11, 33], [4, 28]], tail: [[24, 31], [27, 30], [28, 36], [26, 36]] },
    // ---- Nymphalidae
    vanessa:  { f: [[0, 18], [3, 8], [14, 3], [28, 3.5], [37, 5.5], [38, 9], [32, 10.5], [34, 15], [31, 19], [18, 21]], h: [[0, 20], [14, 21], [26, 22], [31, 26], [33, 30], [29, 35], [22, 36], [13, 36], [5, 32], [2, 27]] },
    aglais:   { f: [[0, 18], [3, 8], [14, 3], [28, 4], [35, 8], [36, 13], [30, 19], [12, 21]], h: [[0, 20], [14, 21], [28, 22], [34, 26], [33, 32], [28, 35], [23, 34], [16, 37], [8, 35], [2, 28]] },
    comma:    { f: [[0, 18], [3, 8], [14, 3], [27, 4], [35, 8], [36, 11], [32, 12.5], [35, 15], [31, 19], [12, 21]], h: [[0, 20], [14, 21], [26, 22], [33, 25], [31, 28], [35, 31], [28, 32], [27, 36], [20, 34], [14, 38], [7, 34], [2, 28]] },
    fritillary: { f: [[0, 18], [3, 8], [15, 3], [29, 4], [36, 9], [34.5, 12], [36, 15], [31, 19], [12, 21]], h: [[0, 20], [13, 21], [27, 22], [32, 26], [30, 28.5], [33, 31], [29, 34], [26, 36], [18, 37], [8, 35], [2, 28]] },
    junonia:  { f: [[0, 18], [3, 8], [15, 3], [30, 4], [37, 8], [36, 15], [30, 20], [12, 21]], h: [[0, 20], [14, 21], [28, 22], [35, 27], [35, 32], [30, 37], [24, 35], [18, 38], [11, 36], [5, 33], [2, 27]] },
    leaf:     { f: [[0, 18], [3, 8], [15, 3], [29, 3], [38, 5], [34, 12], [30, 19], [12, 21]], h: [[0, 20], [14, 21], [27, 22], [32, 26], [30, 32], [22, 35], [12, 35], [4, 30]], tail: [[26, 32], [30, 31], [33, 39], [31, 39]] },
    snout:    { f: [[0, 18], [3, 8], [14, 3], [28, 4], [36, 7], [37, 11], [33, 13], [35, 17], [30, 19], [12, 21]], h: [[0, 20], [12, 21], [24, 22], [29, 26], [28, 31], [22, 34], [12, 34], [4, 29]] },
    sailor:   { f: [[0, 18], [4, 9], [18, 5], [32, 5], [38, 9], [34, 15], [28, 19], [10, 20]], h: [[0, 20], [14, 21], [26, 23], [32, 28], [29, 33], [20, 35], [9, 34], [3, 29]] },
    emperor:  { f: [[0, 18], [3, 8], [14, 3], [28, 3.5], [37, 8], [35, 14], [30, 19], [12, 21]], h: [[0, 20], [14, 21], [28, 22], [34, 27], [34, 32], [36, 34], [31, 35], [28, 37], [20, 37], [12, 36], [5, 32], [2, 27]] },
    danaid:   { f: [[0, 18], [3, 9], [15, 4], [29, 5], [36, 10], [35, 16], [28, 20], [10, 21]], h: [[0, 20], [14, 21], [28, 22], [34, 27], [33, 33], [26, 37], [14, 37], [5, 33], [2, 27]] },
    idea:     { f: [[0, 18], [4, 8], [20, 3], [36, 6], [39, 12], [34, 19], [10, 21]], h: [[0, 20], [16, 21], [30, 23], [36, 29], [32, 36], [20, 39], [8, 36], [3, 30]] },
    ithomiine: { f: [[0, 18], [4, 9], [18, 5], [33, 6], [38, 11], [32, 18], [10, 20]], h: [[0, 20], [14, 21], [28, 23], [33, 28], [26, 32], [12, 32], [3, 27]] },
    dryas:    { f: [[0, 18], [5, 9], [20, 4], [36, 3], [39, 5], [34, 12], [28, 18], [10, 20]], h: [[0, 20], [14, 21], [25, 23], [27, 29], [17, 33], [6, 29]] },
    daggerwing: { f: [[0, 18], [4, 8], [18, 3], [34, 3], [38, 5], [30, 12], [26, 20], [10, 21]], h: [[0, 20], [14, 21], [26, 23], [30, 27], [26, 31], [17, 34], [8, 33], [3, 28]],
                tail: [[22, 30], [28, 29], [31, 36], [28.5, 36]], longTail: [[22, 30], [28, 29], [32, 39.5], [29, 39.5]] },
    acraea:   { f: [[0, 18], [4, 8], [18, 3.5], [32, 6], [37, 12], [33, 18], [20, 21], [8, 21]], h: [[0, 20], [14, 21], [28, 22], [34, 28], [30, 34], [20, 37], [8, 35], [3, 30]] },
    morpho:   { f: [[0, 18], [3, 8], [14, 3], [30, 4], [39, 10], [36, 17], [26, 21], [10, 21]], h: [[0, 20], [14, 21], [28, 22], [36, 27], [34, 33], [24, 37], [12, 38], [4, 33], [2, 27]] },
    caligo:   { f: [[0, 18], [4, 7], [16, 2.5], [31, 4], [38, 11], [36, 18], [24, 21], [8, 21]], h: [[0, 20], [16, 21], [30, 23], [37, 29], [35, 36], [27, 39], [16, 39], [6, 35], [2, 28]] },
    charaxes: { f: [[0, 18], [3, 8], [16, 3], [30, 5], [37, 10], [34, 18], [24, 20], [10, 20]], h: [[0, 20], [12, 21], [26, 22], [33, 27], [34, 32], [30, 35], [22, 35], [12, 36], [4, 32]],
                tail: [[[22, 34], [27, 34], [28, 39], [25, 39]], [[31, 31], [35, 31], [37, 36], [34.5, 36]]], longTail: [[[21, 34], [27, 34], [28.5, 39.5], [24.5, 39.5]], [[31, 31], [35, 31], [38, 38.5], [35, 38.5]]] },
    rhetus:   { f: [[0, 18], [3, 9], [16, 4], [30, 6], [35, 11], [30, 18], [14, 20]], h: [[0, 20], [12, 21], [24, 22], [30, 27], [28, 32], [20, 34], [10, 33], [3, 28]],
                tail: [[[22, 33], [25, 33], [24.5, 38.5], [22.5, 38.5]], [[27, 31], [30, 30], [32, 38.5], [30, 38.5]]], longTail: [[[22, 33], [25, 33], [24.5, 39.5], [22.5, 39.5]], [[27, 31], [30, 30], [32, 39.5], [30, 39.5]]] },
    prothoe:  { f: [[0, 18], [3, 8], [14, 3], [30, 4], [38, 9], [36, 17], [26, 21], [10, 21]], h: [[0, 20], [16, 21], [30, 23], [37, 28], [36, 34], [32, 39], [26, 37], [18, 38], [8, 35], [3, 30]] },
    // ---- Satyrinae and Hesperiidae
    satyr:    { f: [[0, 18], [3, 8], [14, 3.5], [28, 5], [35, 11], [33, 18], [22, 21], [8, 21]], h: [[0, 20], [12, 21], [26, 22], [32, 27], [31, 32], [26, 36], [21, 34.5], [16, 37], [10, 35], [5, 36], [2, 30]] },
    ringlet:  { f: [[0, 18], [3, 9], [14, 5], [27, 6], [33, 12], [30, 18], [18, 21], [6, 21]], h: [[0, 20], [12, 21], [24, 22], [30, 27], [28, 33], [20, 36], [10, 35], [3, 30]] },
    dryad:    { f: [[0, 18], [3, 8], [14, 3], [28, 3], [36, 6], [38, 10], [33, 12], [32, 18], [20, 21], [8, 21]], h: [[0, 20], [12, 21], [26, 22], [31, 27], [30, 32], [33, 38], [24, 35], [14, 36], [5, 33], [2, 27]] },
    skipper:  { f: [[0, 18], [3, 10], [16, 5], [30, 6], [37, 10], [33, 16], [22, 19], [8, 20]], h: [[0, 20], [10, 20], [20, 21], [24, 26], [20, 31], [10, 31], [3, 27]] },
  };

  // The form of each species' wings (by genus, then by species): the shape table above is chosen by biology, not by the old coarse shape of the data rows
  const GENUS_FORM = {
    Papilio: 'papilio', Iphiclides: 'iphiclides', Graphium: 'kite', Eurytides: 'kite', Lamproptera: 'lamproptera', Battus: 'aristolochia', Parides: 'aristolochia', Pachliopta: 'aristolochia', Byasa: 'aristolochia',
    Zerynthia: 'festoon', Luehdorfia: 'festoon', Parnassius: 'apollo', Trogonoptera: 'trog',
    Colias: 'sulphur', Gonepteryx: 'brimstone', Anthocharis: 'orangetip', Hebomoia: 'orangetip', Colotis: 'orangetip', Phoebis: 'phoebis', Anteos: 'phoebis', Catopsilia: 'phoebis', Zerene: 'phoebis',
    Eurema: 'leptosia', Abaeis: 'leptosia', Nathalis: 'leptosia', Leptosia: 'leptosia', Delias: 'delias', Dismorphia: 'ithomiine',
    Thecla: 'hairstreak', Favonius: 'hairstreak', Strymon: 'hairstreak', Lampides: 'hairstreak', Leptotes: 'hairstreak', Everes: 'hairstreak', Spindasis: 'hairstreak', Lycaena: 'copper',
    Vanessa: 'vanessa', Aglais: 'aglais', Nymphalis: 'aglais', Araschnia: 'aglais', Polygonia: 'comma', Kaniska: 'comma',
    Argynnis: 'fritillary', Speyeria: 'fritillary', Fabriciana: 'fritillary', Brenthis: 'fritillary', Issoria: 'fritillary', Boloria: 'fritillary', Euptoieta: 'fritillary', Argyreus: 'fritillary', Damora: 'fritillary', Cethosia: 'fritillary', Cupha: 'fritillary', Phalanta: 'fritillary',
    Melitaea: 'ringlet', Euphydryas: 'ringlet', Chlosyne: 'ringlet', Phyciodes: 'ringlet',
    Apatura: 'emperor', Sasakia: 'emperor', Asterocampa: 'emperor', Limenitis: 'sailor', Neptis: 'sailor', Hestina: 'sailor',
    Junonia: 'junonia', Precis: 'junonia', Hypolimnas: 'junonia', Anartia: 'junonia', Siproeta: 'junonia', Catonephele: 'junonia', Byblia: 'junonia', Hamanumida: 'junonia', Lexias: 'junonia', Diaethria: 'junonia', Prepona: 'junonia',
    Doleschallia: 'leaf', Prothoe: 'prothoe', Libythea: 'snout', Libytheana: 'snout', Charaxes: 'charaxes', Polyura: 'charaxes', Marpesia: 'daggerwing',
    Agraulis: 'dryas', Dryas: 'dryas', Philaethria: 'dryas', Mechanitis: 'ithomiine', Methona: 'ithomiine', Acraea: 'acraea',
    Danaus: 'danaid', Tirumala: 'danaid', Parantica: 'danaid', Euploea: 'danaid', Amauris: 'danaid', Elymnias: 'danaid', Idea: 'idea',
    Morpho: 'morpho', Caligo: 'caligo', Zeuxidia: 'caligo', Amathusia: 'caligo',
    Maniola: 'satyr', Pararge: 'satyr', Lasiommata: 'satyr', Hipparchia: 'satyr', Brintesia: 'satyr', Chazara: 'satyr', Kirinia: 'satyr', Minois: 'satyr', Melanargia: 'satyr', Erebia: 'satyr', Oeneis: 'satyr', Cercyonis: 'satyr', Lethe: 'satyr',
    Coenonympha: 'ringlet', Ypthima: 'ringlet', Mycalesis: 'ringlet', Bicyclus: 'ringlet', Melanitis: 'dryad',
    Callophrys: 'hairstreak', Ornithoptera: 'birdwing', Troides: 'birdwing', Taenaris: 'caligo', Parthenos: 'sailor', Vindula: 'fritillary', Ideopsis: 'idea', Danis: 'blue', Carterocephalus: 'skipper', Leptidea: 'leptosia', Aphantopus: 'satyr', Phengaris: 'blue', Pyrgus: 'skipper', Ochlodes: 'skipper', Epargyreus: 'skipper', Erynnis: 'skipper', Carcharodus: 'skipper', Thymelicus: 'skipper', Parnara: 'skipper',
  };
  const SPECIES_FORM = { 'Ornithoptera alexandrae': 'trog', 'Ornithoptera chimaera': 'trog', 'Ornithoptera paradisea': 'papilio', 'Papilio machaon': 'swallow', 'Papilio alexanor': 'swallow', 'Parnassius mnemosyne': 'apollo', 'Pieris krueperi': 'pierid', 'Euchloe ausonia': 'pierid', 'Jamides celeno': 'blue', 'Cupido minimus': 'blue', 'Cupido': 'blue', 'Eurema mandarina': 'leptosia', 'Pontia callidice': 'pierid', 'Phyciodes tharos': 'ringlet',
    'Lycaena ottomana': 'copper', 'Libythea celtis': 'snout', 'Byblia ilithyia': 'sailor', 'Argynnis pandora': 'fritillary' };
  // tail of a species: the data rows say whether there is one; these are the corrections / special kinds ('none', 'short', 'long', 'spoon', 'two', 'twolong')
  const TAIL_OF = { 'Ornithoptera paradisea': 'long', 'Papilio ulysses': 'short', 'Papilio aegeus': 'none', 'Papilio euchenor': 'none', 'Graphium weiskei': 'none', 'Polyura jupiter': 'twolong', 'Pachliopta polydorus': 'short', 'Graphium eurypylus': 'short', 'Papilio nireus': 'none', 'Papilio demoleus': 'none', 'Graphium leonidas': 'none', 'Graphium sarpedon': 'none', 'Battus polydamas': 'none', 'Parides sesostris': 'none', 'Zerynthia polyxena': 'none',
    'Graphium policenes': 'spoon', 'Charaxes jasius': 'twolong', 'Polyura athamas': 'twolong', 'Rhetus periander': 'twolong', 'Spindasis natalensis': 'two', 'Jamides celeno': 'short', 'Marpesia petreus': 'long', 'Eurytides marcellus': 'long', 'Lamproptera meges': 'long', 'Iphiclides podalirius': 'long',
    'Doleschallia bisaltide': 'short', 'Thecla betulae': 'short', 'Favonius orientalis': 'short', 'Strymon melinus': 'short', 'Lampides boeticus': 'short', 'Leptotes pirithous': 'short', 'Everes comyntas': 'short', 'Lycaena phlaeas': 'short', 'Zerynthia cerisyi': 'short', 'Luehdorfia japonica': 'none' };
  const baseLa = sp => (sp.la || '').split(' ab. ')[0];      // an aberration keeps the wing form and tail of its species
  const formOf = sp => { const la = baseLa(sp); return SPECIES_FORM[la] || GENUS_FORM[la.split(' ')[0]] || sp.art.t; };
  const tailPoly = (sh, mode) => mode === 'long' ? (sh.longTail || sh.tail) : mode === 'spoon' ? (sh.spoonTail || sh.longTail || sh.tail) : mode === 'two' ? (sh.twoTail || sh.tail) : mode === 'twolong' ? (sh.longTail && sh.tail && Array.isArray(sh.longTail[0][0]) ? sh.longTail : (sh.twoTail || sh.longTail || sh.tail)) : sh.tail;

  const cache = {};

  function maskOf(poly) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'); x.fillStyle = '#fff';
    for (const pl of (Array.isArray(poly[0][0]) ? poly : [poly])) { x.beginPath(); pl.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill(); }
    const d = x.getImageData(0, 0, N, N).data; const m = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) m[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return m;
  }
  function distMap(m) { // manhattan distance to outside, capped
    const d = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) d[i] = m[i] ? 99 : 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!m[i]) continue; const l = x ? d[i - 1] : 0, u = y ? d[i - N] : 0; d[i] = Math.min(d[i], l + 1, u + 1); }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (!m[i]) continue; const r = x < N - 1 ? d[i + 1] : 0, b = y < N - 1 ? d[i + N] : 0; d[i] = Math.min(d[i], r + 1, b + 1); }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!m[i]) continue; if (x === 0) d[i] = Math.max(d[i], 3); } // body edge is not an outline
    return d;
  }
  function bbox(m) {
    let x0 = N, x1 = 0, y0 = N, y1 = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  const C = h => hex2rgb(h);
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];


  // light-sign glyphs (from the Doors-style light icons): drawn pixel-perfect on the wings. Paths are in a 256x256 box.
  const GLYPHS = {
    swirl: { glow: 'M253 137 130 11 5 138 146 251 155 243 79 148 135 86 184 141 156 168 137 144 137 143 174 170 146 79 87 145 149 222Z', main: 'M240 136 130 24 18 137 146 243 67 148 135 72 196 142 155 181 125 143 137 131 160 151 142 97 99 145 150 209Z', cols: ['#ffafaf', '#ff7272', '#ff7272'] },
    star:  { glow: 'M128 251 92 164 5 128 92 92 128 5 164 92 251 128 164 164Z', main: 'M128 230 99 157 26 128 99 99 128 26 157 99 230 128 157 157Z', cols: ['#ffffff', '#ffe58e', '#fdd552'] },
    moon:  { glow: 'M15 152 28 73 71 21 153 14 155 23 115 48 88 75 79 114 95 155 138 176 197 157 228 99 235 99 237 161 199 221 123 242 51 214Z', main: 'M24 150 36 77 76 30 143 22 110 41 80 70 70 115 88 161 137 186 203 164 229 112 230 158 193 213 123 233 57 207Z', cols: ['#DEF8FF', '#7FD3F5', '#67C4EB'] },
  };
  function stampGlyph(name, targets, mask, cx, cy, size) {
    const g = GLYPHS[name]; if (!g) return;
    const cols = g.cols.map(hex2rgb);
    const render = (d) => { const c2 = document.createElement('canvas'); c2.width = c2.height = N; const x = c2.getContext('2d'); x.translate(cx - size / 2, cy - size / 2); x.scale(size / 256, size / 256); x.fillStyle = '#fff'; x.fill(new Path2D(d)); return x.getImageData(0, 0, N, N).data; };
    const glow = render(g.glow), main = render(g.main);
    for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) {
      const i = y * N + xx; if (!mask[i]) continue; const ga = glow[i * 4 + 3], ma = main[i * 4 + 3]; if (ga < 50 && ma < 100) continue;
      const t = clamp((y - (cy - size / 2)) / size), c = t < 0.5 ? mixc(cols[0], cols[1], t * 2) : mixc(cols[1], cols[2], (t - 0.5) * 2);
      for (const d of targets) { const k = i * 4; if (ma >= 100) { d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; } else { d[k] = lerp(d[k], c[0], 0.4); d[k + 1] = lerp(d[k + 1], c[1], 0.4); d[k + 2] = lerp(d[k + 2], c[2], 0.4); d[k + 3] = 255; } }
    }
  }

  function wingCanvas(sp) {
    if (cache[sp.id]) return cache[sp.id];
    const a = sp.art; const sh = SHAPES[formOf(sp)] || SHAPES[a.t] || SHAPES.std;
    const fM = maskOf(sh.f), hM = maskOf(sh.h);
    let tM = null;
    const tmode = TAIL_OF[baseLa(sp)] || (a.tail !== undefined && a.tail !== false ? (a.longTail ? 'long' : 'short') : 'none'), tpoly = tmode === 'none' ? null : tailPoly(sh, tmode);
    if (tpoly) tM = maskOf(tpoly);
    const fD = distMap(fM), hD = distMap(hM), tD = tM ? distMap(tM) : null;
    const fB = bbox(fM), hB = bbox(hM);
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    const ctx = cv.getContext('2d'); const img = ctx.createImageData(N, N); const px = img.data;
    const imgF = ctx.createImageData(N, N), imgH = ctx.createImageData(N, N);
    const edgeC = C(a.edge ? a.edge[0] : '#222'), edgeW = a.edge ? a.edge[1] : 1;
    const dotsC = a.dots ? C(a.dots) : null;
    const veinC = a.veins ? C(a.veins) : null;
    const fIn = C(a.f[0]), fOut = C(a.f[1]), hIn = C(a.h[0]), hOut = C(a.h[1]);

    function circ(x, y, wing, u, v, B, cx, cy, r) { const dx = x - (B.x0 + cx * B.w), dy = y - (B.y0 + cy * B.h); return dx * dx + dy * dy <= r * r ? Math.sqrt(dx * dx + dy * dy) / r : -1; }

    function colorAt(x, y, wing, d) {
      const B = wing === 'f' ? fB : hB; const u = (x - B.x0 + 0.5) / B.w, v = (y - B.y0 + 0.5) / B.h;
      const inn = wing === 'f' ? fIn : hIn, out = wing === 'f' ? fOut : hOut;
      let c = mixc(inn, out, Math.pow(clamp(u), 1.15));
      if (a.checker) { const k = (((x >> 2) + (y >> 2)) & 1); c = C(k ? a.checker[1] : a.checker[0]); }
      if (a.sheen) { const s = a.sheen[1] * Math.exp(-Math.pow((u - 0.34) / 0.28, 2)) * (1 - v * 0.5); c = mixc(c, C(a.sheen[0]), clamp(s)); }
      if (a.band && a.band[0].includes(wing)) { const uu = u + (v - 0.5) * 0.16; if (uu > a.band[1] && uu < a.band[2]) c = C(a.band[3]); }
      if (a.tip && wing === 'f' && u + (1 - v) * 0.12 > a.tip[1]) c = C(a.tip[0]);
      if (a.rays && a.rays[0] === wing) { const ang = Math.atan2(y - (B.y0 + B.h * 0.2), x + 2); for (let k = 0; k < 5; k++) { const ta = 0.35 + k * 0.28; if (Math.abs(ang - ta) < 0.07 && u > 0.12 && d > 1) c = C(a.rays[1]); } }
      if (a.arc && a.arc[0] === wing) { if (Math.abs(u - (0.58 + 0.14 * Math.sin(v * Math.PI))) < 0.03) c = C(a.arc[1]); }
      if (a.bars && wing === 'f') { const t = (u * 0.9 + v * 0.5) * a.bars[1] * 1.55; if ((t % 1) < 0.27 && v < 0.88 && u > 0.1) c = C(a.bars[0]); }
      if (a.bars && wing === 'h') { if (u < 0.22 && v < 0.6) c = mixc(c, C(a.bars[0]), 0.55); }
      if (a.wedges && wing === 'f') {
        for (let i = 0; i < a.wedges[1]; i++) {
          const wu = 0.18 + 0.72 * (i / (a.wedges[1] - 1)); const wv = 0.78 - 0.5 * (i / (a.wedges[1] - 1));
          const cx = B.x0 + wu * B.w, cy = B.y0 + wv * B.h; const dx = x - cx, dy = y - cy;
          const ang = Math.atan2(0.5 * B.h + B.y0 - cy, B.x0 - cx);
          const rx = dx * Math.cos(ang) + dy * Math.sin(ang), ry = -dx * Math.sin(ang) + dy * Math.cos(ang);
          if ((rx * rx) / 18 + (ry * ry) / 3.2 <= 1) c = C(a.wedges[0]);
        }
      }
      if (a.patch && a.patch[0] === wing) { const q = circ(x, y, wing, u, v, B, a.patch[1], a.patch[2], a.patch[3]); if (q >= 0) c = C(a.patch[4]); }
      if (a.sp) for (const s of a.sp) { if (s[0].includes(wing) || s[0] === 'fh') { const q = circ(x, y, wing, u, v, B, s[1], s[2], s[3]); if (q >= 0) c = C(s[4]); } }
      if (a.eye) for (const e of a.eye) {
        if (e[0] === wing) {
          const q = circ(x, y, wing, u, v, B, e[1], e[2], e[3]);
          if (q >= 0) {
            c = q < 0.45 ? C(e[5]) : C(e[4]);
            if (q < 0.9 && q > 0.7) c = mixc(c, [8, 8, 10], 0.5);
          }
        }
      }
      if (veinC) { const ang = Math.atan2(y - (wing === 'f' ? 17 : 21), x + 1.5); const k = ((ang + 3.2) * 6.3) % 1; if (k < 0.1 && u > 0.1) c = mixc(c, veinC, 0.8); }
      // margin
      if (d < edgeW) c = edgeC.slice();
      else if (dotsC && d === Math.floor(edgeW) && ((x + y * 2) % 5 === 0) && edgeW >= 2) c = dotsC;
      if (d === 0) { c = mixc(c, [10, 8, 8], 0.55); if (dotsC && edgeW <= 1 && ((x + y) % 3 === 0)) c = dotsC; }
      return c;
    }
    const put = (x, y, c, part) => { const i = (y * N + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; const q = part.data; q[i] = c[0]; q[i + 1] = c[1]; q[i + 2] = c[2]; q[i + 3] = 255; };
    // hind first, tail, then fore on top
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (hM[i]) put(x, y, colorAt(x, y, 'h', hD[i]), imgH); }
    if (tM) { const tc = C(typeof a.tail === 'string' ? a.tail : '#111'); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (tM[i]) put(x, y, tD[i] === 0 ? mixc(tc, [0, 0, 0], 0.4) : tc, imgH); } }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (fM[i]) put(x, y, colorAt(x, y, 'f', fD[i]), imgF); }
    // soft darkening where forewing overlaps hindwing (depth cue)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (fM[i] && hM[i] && fD[i] === 1 && y > 17) { const k = (y * N + x) * 4; px[k] *= 0.75; px[k + 1] *= 0.75; px[k + 2] *= 0.75; } }
    if (a.glyph) for (const [w, gx, gy, gs] of a.glyph.at) stampGlyph(a.glyph.shape, [w === 'f' ? imgF.data : imgH.data, px], w === 'f' ? fM : hM, gx, gy, gs);
    ctx.putImageData(img, 0, 0);
    const part = im => { const c2 = document.createElement('canvas'); c2.width = c2.height = N; c2.getContext('2d').putImageData(im, 0, 0); return c2; };
    const tipOf = (m, py) => { let bx = 0, by = py, bd = -1; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x]) { const d = (x + 0.5) * (x + 0.5) + (y + 0.5 - py) * (y + 0.5 - py); if (d > bd) { bd = d; bx = x + 0.5; by = y + 0.5; } } return [bx, by - py]; };
    partsCache[sp.id] = { f: part(imgF), h: part(imgH), tf: tipOf(fM, PIV.f), th: tipOf(hM, PIV.h) };
    cache[sp.id] = cv;
    return cv;
  }

  // ---- spread poses: every wing is rotated by a (rad) about its root and compressed along its own length by s
  const PIV = { f: 18, h: 21 };
  const partsCache = {};
  const RAW = { rf: { a: -0.85, s: 0.62 }, lf: { a: -0.85, s: 0.62 }, rh: { a: -1.4, s: 0.6 }, lh: { a: -1.4, s: 0.6 } };
  const IDEAL = { rf: { a: 0, s: 1 }, lf: { a: 0, s: 1 }, rh: { a: 0, s: 1 }, lh: { a: 0, s: 1 } };
  function wingParts(sp) { wingCanvas(sp); return partsCache[sp.id]; }
  function drawBody(ctx, cx, cy, sc, silhouette) {
    const r = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + x * sc), Math.round(cy + (y - 20) * sc), Math.round(w * sc), Math.round(h * sc)); };
    const bc = silhouette ? '#000' : '#1e1612';
    r(-1, 11, 2, 19, bc); r(-1, 8, 2, 3, bc); r(-2, 12, 4, 4, bc); r(-1, 29, 2, 2, bc); r(-2, 14, 1, 1, silhouette ? '#000' : '#4a3a30');
    r(-2, 6, 1, 2, bc); r(1, 6, 1, 2, bc); r(-3, 4, 1, 2, bc); r(2, 4, 1, 2, bc);
  }
  function drawPose(ctx, sp, pose, cx, cy, sc, o = {}) {
    const P = wingParts(sp); pose = pose || RAW; ctx.imageSmoothingEnabled = false;
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    for (const [k, part, m] of [['lh', 'h', -1], ['rh', 'h', 1], ['lf', 'f', -1], ['rf', 'f', 1]]) {
      const w = pose[k]; if (!w) continue; const piv = PIV[part];
      ctx.save(); ctx.translate(cx, cy + (piv - 20) * sc); ctx.scale(m * sc, sc); ctx.rotate(w.a); ctx.scale(w.s, 1); ctx.drawImage(P[part], 0, -piv); ctx.restore();
    }
    drawBody(ctx, cx, cy, sc, false);
    ctx.globalAlpha = 1;
  }
  // tip of a wing (relative to its root, in wing units) for a given pose entry
  function tipPos(sp, k, w) { const P = wingParts(sp); const t = k[1] === 'f' ? P.tf : P.th; const x = t[0] * w.s, y = t[1]; const c = Math.cos(w.a), s2 = Math.sin(w.a); return [x * c - y * s2, x * s2 + y * c]; }

  // full spread specimen: 2N wide, body in the middle
  function specimen(sp, silhouette, tint) {
    const key = sp.id + (silhouette ? '_sil' + (tint || '') : '_col'); if (cache[key]) return cache[key];
    const w = wingCanvas(sp); const cv = document.createElement('canvas'); cv.width = N * 2; cv.height = N;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(w, N, 0);
    x.save(); x.translate(N, 0); x.scale(-1, 1); x.drawImage(w, 0, 0); x.restore();
    // body
    const bc = silhouette ? '#000' : '#1e1612';
    x.fillStyle = bc; x.fillRect(N - 1, 11, 2, 19); x.fillRect(N - 1, 8, 2, 3); x.fillRect(N - 2, 12, 4, 4);
    x.fillRect(N - 1, 29, 2, 2);
    x.fillStyle = silhouette ? '#000' : '#4a3a30'; x.fillRect(N - 2, 14, 1, 1);
    x.fillStyle = bc; x.fillRect(N - 2, 6, 1, 2); x.fillRect(N + 1, 6, 1, 2); x.fillRect(N - 3, 4, 1, 2); x.fillRect(N + 2, 4, 1, 2);
    if (silhouette) {
      const d = x.getImageData(0, 0, cv.width, cv.height); for (let i = 0; i < d.data.length; i += 4) { if (d.data[i + 3]) { const tc = hex2rgb(tint || '#221c18'); d.data[i] = tc[0]; d.data[i + 1] = tc[1]; d.data[i + 2] = tc[2]; d.data[i + 3] = 255; } }
      x.putImageData(d, 0, 0);
    }
    cache[key] = cv;
    return cv;
  }

  // ------------------------------------------------------------ 3D model
  const SF = 5.0; // world scale exaggeration so butterflies stay visible at 480x270
  const texCache = {};
  function wingTexture(sp) {
    if (texCache[sp.id]) return texCache[sp.id];
    const t = new THREE.CanvasTexture(wingCanvas(sp)); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    texCache[sp.id] = t; return t;
  }
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x1e1612 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0x2a201a });
  const antMat = new THREE.MeshBasicMaterial({ color: 0x120e0a });

  function makeButterfly(sp) {
    const span = ((sp.mm[0] + sp.mm[1]) / 2) / 1000 * SF * (sp.glow ? 2.4 : 1); // metres (exaggerated; night creatures are drawn larger)
    const half = span / 2 / 0.9;
    const mat = new THREE.MeshBasicMaterial({ map: wingTexture(sp), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(half, half); geo.rotateX(-Math.PI / 2); geo.translate(half / 2, 0, 0);
    const g = new THREE.Group();
    const L = new THREE.Group(), R = new THREE.Group();
    const wr = new THREE.Mesh(geo, mat), wl = new THREE.Mesh(geo, mat); wl.scale.x = -1;
    wr.position.z = -half * 0.04; wl.position.z = -half * 0.04;
    R.add(wr); L.add(wl); g.add(L, R);
    const bl = span * 0.5;
    const th = new THREE.Mesh(new THREE.BoxGeometry(span * 0.07, span * 0.07, span * 0.14), bodyMat); th.position.z = -bl * 0.05;
    const ab = new THREE.Mesh(new THREE.BoxGeometry(span * 0.05, span * 0.05, span * 0.34), bodyMat); ab.position.z = bl * 0.36;
    const hd = new THREE.Mesh(new THREE.BoxGeometry(span * 0.06, span * 0.06, span * 0.06), headMat); hd.position.z = -bl * 0.22;
    g.add(th, ab, hd);
    for (const s of [-1, 1]) {                       // antennae start at the front of the head and spread outwards / upwards in a V, with a tiny club at the tip
      const pv = new THREE.Group(); pv.position.set(s * span * 0.018, span * 0.02, -bl * 0.22 - span * 0.03); pv.rotation.set(0.45, -s * 0.38, 0, 'YXZ');
      const AL = span * 0.24, an = new THREE.Mesh(new THREE.BoxGeometry(span * 0.012, span * 0.012, AL), antMat); an.position.z = -AL / 2;
      const club = new THREE.Mesh(new THREE.BoxGeometry(span * 0.026, span * 0.026, span * 0.03), antMat); club.position.z = -AL; pv.add(an, club); g.add(pv);
    }
    g.userData = { L, R, span };
    return g;
  }
  function setFlap(g, ang) { g.userData.R.rotation.z = ang; g.userData.L.rotation.z = -ang; }

  return { wingCanvas, specimen, makeButterfly, setFlap, SF, N, wingParts, drawPose, drawBody, tipPos, RAW, IDEAL, PIV };
})();
