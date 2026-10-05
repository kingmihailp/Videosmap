# Flora0world: HUB — teaser (0:58)

Pixel-art cinematic teaser for the opening of the Flora0world: HUB community
(community of entomologists, naturalists and keepers: catch locations, dates, observations).

`Flora0world_HUB_teaser.mp4` — 1280x720, 24 fps, 58 s, stereo.

| Time | Scene |
|---|---|
| 0:00–0:09 | Night forest, fireflies, glowing mushrooms, a moth drifting to the moon |
| 0:09–0:19 | UV light-trap sheet, moths landing, hawkmoth *Sphinx ligustri* |
| 0:19–0:31 | Macro: stag beetle *Lucanus cervus*, then *Morpho menelaus* on a flower |
| 0:31–0:45 | Map of finds: pins drop with species, place and date |
| 0:45–0:58 | Fireflies form the Flora0world logo, HUB badge, tagline and feature chips |

Everything (graphics and music) is generated procedurally:

* `video.py` — 320x180 pixel canvas, nearest-neighbour x4, Bayer-dithered gradients and glows
* `audio.py` — NumPy synth (pad, chiptune arp, bass, drums, UI foley, riser + logo hit)
* `build.sh` — rebuilds `Flora0world_HUB_teaser.mp4` (about 8 minutes on 4 cores)

## Avatar

`avatar_Flora0world_HUB_512.png` (and `_1024.png`) — community avatar: pixel F + W over the entomologist's map,
inside a brass ring (safe for Telegram's circular crop). Source: `avatar.py` (`python avatar.py out/`).
