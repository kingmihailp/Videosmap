# Flora0world: HUB — teaser (1:30)

Pixel-art cinematic teaser for the opening of the Flora0world: HUB forum
(entomologists, naturalists and keepers: catch locations, dates, observations).

`Flora0world_HUB_teaser.mp4` — 1280x720, 24 fps, 90 s, stereo.

| Time | Scene |
|---|---|
| 0:00–0:09 | Night forest, fireflies, glowing mushrooms, a moth drifting to the moon |
| 0:09–0:19 | UV light-trap sheet, moths landing, hawkmoth *Sphinx ligustri* |
| 0:19–0:31 | Macro: stag beetle *Lucanus cervus*, then *Morpho menelaus* on a flower |
| 0:31–0:43 | Field kit: net, aspirator, loupe, notebook, headlamp, UV lamp, spreading board, terrarium |
| 0:43–0:57 | Map of finds: pins drop with species, place and date |
| 0:57–1:13 | The forum: threads, new-note composer (species / place / date / observation / photo), publish |
| 1:13–1:30 | Fireflies form the Flora0world logo, HUB badge, "ОТКРЫТИЕ СКОРО" |

Everything (graphics and music) is generated procedurally:

* `video.py` — 320x180 pixel canvas, nearest-neighbour x4, Bayer-dithered gradients and glows
* `audio.py` — NumPy synth (pad, chiptune arp, bass, drums, UI foley, riser + logo hit)
* `build.sh` — rebuilds `Flora0world_HUB_teaser.mp4` (about 8 minutes on 4 cores)
