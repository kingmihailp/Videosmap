"""Synthesised soundtrack for the Flora0world: HUB teaser (pure NumPy, 90 s, stereo).

Usage: python audio.py out.wav
"""
import sys
import wave

import numpy as np

import video as V

SR = 44100
DUR = V.DUR
N = SR * DUR
BAR = V.LOGO_HIT / 26.0          # the logo hit lands exactly on a bar line
BEAT = BAR / 4
rng = np.random.RandomState(7)

L = np.zeros(N, np.float32)
R = np.zeros(N, np.float32)
WL = np.zeros(N, np.float32)     # reverb sends
WR = np.zeros(N, np.float32)
PAD = np.zeros(N, np.float32)


def mid(n):
    return 440.0 * 2 ** ((n - 69) / 12.0)


def put(buf, t0, sig, gain=1.0):
    i = int(t0 * SR)
    j = min(N, i + len(sig))
    if i >= N or j <= 0:
        return
    k = max(0, -i)
    buf[max(i, 0):j] += sig[k:j - i] * gain


def play(sig, t0, gain=1.0, pan=0.5, wet=0.0):
    gl, gr = np.cos(pan * np.pi / 2), np.sin(pan * np.pi / 2)
    put(L, t0, sig, gain * gl)
    put(R, t0, sig, gain * gr)
    if wet:
        put(WL, t0, sig, gain * gl * wet)
        put(WR, t0, sig, gain * gr * wet)


def tt(dur):
    return np.arange(int(dur * SR), dtype=np.float32) / SR


def lp(sig, fc, order=4):
    X = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR)
    return np.fft.irfft(X / (1 + (f / fc) ** order), len(sig)).astype(np.float32)


def hp(sig, fc, order=2):
    X = np.fft.rfft(sig)
    f = np.fft.rfftfreq(len(sig), 1 / SR) + 1e-9
    return np.fft.irfft(X * (1 / (1 + (fc / f) ** order)), len(sig)).astype(np.float32)


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR)).astype(np.float32)


def level(t, pts):
    """piece-wise linear level curve over absolute time array."""
    xs, ys = zip(*pts)
    return np.interp(t, xs, ys).astype(np.float32)


# ------------------------------------------------------------ instruments
def pulse(freq, dur, tau=0.2, duty=0.25, att=0.004):
    t = tt(dur)
    ph = (freq * t) % 1.0
    w = np.where(ph < duty, 1.0, -1.0).astype(np.float32)
    return w * np.minimum(1, t / att) * np.exp(-t / tau)


def tri(freq, dur, tau=0.3, att=0.006):
    t = tt(dur)
    ph = (freq * t) % 1.0
    w = (4 * np.abs(ph - 0.5) - 1).astype(np.float32)
    return w * np.minimum(1, t / att) * np.exp(-t / tau)


def bell(freq, dur=2.5, tau=1.0, idx=1.6):
    t = tt(dur)
    m = np.sin(2 * np.pi * freq * 3.5 * t) * idx * np.exp(-t / 0.35)
    return (np.sin(2 * np.pi * freq * t + m) * np.exp(-t / tau) * np.minimum(1, t / 0.002)).astype(np.float32)


def kick(dur=0.45):
    t = tt(dur)
    f = 48 + 90 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t / 0.16) * np.minimum(1, t / 0.001)).astype(np.float32)


def snare(dur=0.3):
    t = tt(dur)
    n = hp(noise(dur), 1200) * np.exp(-t / 0.07)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.05)
    return (n * 0.8 + tone * 0.5).astype(np.float32)


def hat(dur=0.08, tau=0.018):
    t = tt(dur)
    return (hp(noise(dur), 6500) * np.exp(-t / tau)).astype(np.float32)


def crash(dur=3.5):
    t = tt(dur)
    n = hp(noise(dur), 3500)
    return (n * np.exp(-t / 1.0) * np.minimum(1, t / 0.003)).astype(np.float32)


def plink(freq, dur=0.5, tau=0.12):
    t = tt(dur)
    return ((np.sin(2 * np.pi * freq * t) + 0.35 * np.sin(2 * np.pi * freq * 2 * t)) * np.exp(-t / tau)
            * np.minimum(1, t / 0.002)).astype(np.float32)


def bloop(f0, f1, dur=0.18):
    t = tt(dur)
    f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) * np.exp(-t / 0.08)).astype(np.float32)


def whoosh(dur=1.0, rising=True):
    n = noise(dur)
    t = tt(dur)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    out = lp(n, 1800 if rising else 900, 2) * env
    return out.astype(np.float32)


def tick(dur=0.02):
    t = tt(dur)
    return (hp(noise(dur), 2500) * np.exp(-t / 0.004) * 0.8 + np.sin(2 * np.pi * rng.uniform(1500, 2200) * t) * np.exp(-t / 0.006) * 0.4).astype(np.float32)


# ------------------------------------------------------------ progression
PROG = [  # Am  F  C  G
    dict(root=45, tones=[57, 60, 64, 67, 72]),
    dict(root=41, tones=[53, 57, 60, 65, 69]),
    dict(root=48, tones=[55, 60, 64, 67, 72]),
    dict(root=43, tones=[55, 59, 62, 67, 71]),
]
NBARS = int(DUR / BAR) + 2
GAP0, GAP1 = V.LOGO_HIT - 1.0, V.LOGO_HIT       # the riser's silent breath


def in_gap(t):
    return GAP0 <= t < GAP1


# ---- crickets & wind -------------------------------------------------
for k in range(9):
    f = rng.uniform(4300, 5300)
    per = rng.uniform(0.5, 0.9)
    npulse = rng.randint(3, 6)
    t0 = rng.uniform(0, per)
    pan = rng.uniform(0.15, 0.85)
    while t0 < 34:
        g = float(level(t0, [(0, 0.05), (19, 0.05), (31, 0.0)])) + (0.018 if 73 <= t0 < 77 else 0)
        if g > 0.002:
            for p in range(npulse):
                d = 0.024
                tp = tt(d)
                s = np.sin(2 * np.pi * f * tp) * np.sin(np.pi * tp / d) ** 2
                play(s.astype(np.float32), t0 + p * 0.042, g * 0.5, pan, 0.1)
        t0 += per * rng.uniform(0.9, 1.15)

wind = lp(noise(DUR + 1), 500, 2)
wl_env = (0.5 + 0.5 * np.sin(np.arange(len(wind)) / SR * 0.35)) * level(np.arange(len(wind)) / SR, [(0, 0.5), (9, 0.35), (20, 0.1), (31, 0.0), (72, 0.0), (74, 0.15), (88, 0.15)])
wind = (wind * wl_env * 0.9).astype(np.float32)
L[:len(wind[:N])] += wind[:N] * 0.7
R[:len(wind[:N])] += np.roll(wind, 4000)[:N] * 0.7

# ---- pad ---------------------------------------------------------------
for b in range(NBARS):
    ch = PROG[b % 4]
    t0 = b * BAR
    d = BAR * 1.35
    t = tt(d)
    env = np.minimum(1, t / 1.0) * np.minimum(1, (d - t) / 1.2)
    sig = np.zeros(len(t), np.float32)
    for n in ch["tones"][:4]:
        f = mid(n)
        for det in (-0.004, 0.0, 0.004):
            sig += (2 * ((f * (1 + det) * t) % 1.0) - 1).astype(np.float32) * 0.18
        sig += np.sin(2 * np.pi * f * t).astype(np.float32) * 0.2
    sub = np.sin(2 * np.pi * mid(ch["root"]) * t).astype(np.float32) * 0.35
    put(PAD, t0, (sig + sub) * env, 1.0)
PAD = lp(PAD, 1400, 4)
tg = np.arange(N) / SR
PAD *= level(tg, [(0, 0.0), (2.5, 0.28), (9, 0.3), (31, 0.36), (57, 0.36), (68, 0.45), (V.LOGO_HIT - 1.2, 0.8),
                  (GAP0 + 0.1, 0.05), (GAP1 - 0.02, 0.05), (GAP1 + 0.05, 0.95), (84, 0.8), (DUR, 0.0)])
for ch_, gn in ((L, 0.5), (R, 0.5)):
    ch_ += PAD * gn
WL += PAD * 0.3
WR += np.roll(PAD, 900) * 0.3

# ---- arpeggio (chiptune) ----------------------------------------------
STEP = BAR / 8
pat = [0, 2, 3, 2, 1, 3, 4, 3]
i = 0
t = 0.0
while t < DUR - 1:
    b = int(t / BAR)
    ch = PROG[b % 4]
    if not in_gap(t):
        g = float(level(t, [(0, 0), (9, 0), (9.5, 0.05), (19, 0.05), (19.5, 0.1), (73, 0.1), (73.5, 0.12), (DUR - 4, 0.12), (DUR, 0.02)]))
        step = int(round((t - b * BAR) / STEP)) % 8
        play_it = g > 0 and (t >= 19 or step % 2 == 0)
        if play_it:
            n = ch["tones"][pat[step] % 5] + 12
            play(pulse(mid(n), 0.34, 0.14, 0.25), t, g, 0.35 + 0.3 * (step % 2), 0.35)
            if t >= V.LOGO_HIT + 0.1 and step % 4 == 0:
                play(pulse(mid(n + 12), 0.3, 0.1, 0.125), t + STEP / 2, g * 0.55, 0.65, 0.4)
    t += STEP

# ---- bass + drums --------------------------------------------------
t = 0.0
while t < DUR - 1:
    b = int(t / BAR)
    ch = PROG[b % 4]
    bi = int(round((t - b * BAR) / BEAT)) % 4
    if not in_gap(t):
        if t >= 31:
            g = float(level(t, [(31, 0.0), (32, 0.26), (73, 0.26), (DUR - 5, 0.24), (DUR, 0.0)]))
            n = ch["root"] + (7 if bi == 2 else 0)
            play(tri(mid(n), BEAT * 0.9, 0.3), t, g, 0.5)
            if bi in (1, 3):
                play(tri(mid(ch["root"] + 12), BEAT * 0.4, 0.12), t + BEAT / 2, g * 0.5, 0.5)
        # kicks
        if 19 <= t < 43 and bi in (0, 2) and t < 31:
            play(kick(), t, 0.3, 0.5)
        if t >= 31 and t < 43 and bi == 0:
            play(kick(), t, 0.4, 0.5)
        if t >= 43 and (t < DUR - 4):
            play(kick(), t, 0.62 if t < 73 else 0.8, 0.5) if bi in (0, 2) else None
            if bi in (1, 3):
                play(snare(), t, 0.3 if t < 57 else 0.42, 0.5, 0.25)
            for h in (0, 1):
                play(hat(), t + h * BEAT / 2, 0.14 if h == 0 else 0.1, 0.62 if h else 0.4)
        elif 31 <= t < 43:
            play(hat(), t, 0.08, 0.6)
            play(hat(), t + BEAT / 2, 0.05, 0.4)
    t += BEAT

# ---- interface / foley events -------------------------------------
PENTA = [69, 72, 74, 76, 79, 81, 84]
for i, tm in enumerate(V.ITEM_TIMES):
    play(plink(mid(PENTA[i % 7] + 12), 0.6, 0.15), tm, 0.28, 0.2 + 0.08 * i, 0.5)
    play(tick(0.03), tm, 0.25, 0.5)
    play(bloop(300, 700, 0.12), tm - 0.06, 0.16, 0.5)
for i, tm in enumerate(V.PIN_TIMES):
    play(bloop(1100, 260, 0.45), tm - 0.0, 0.12, 0.3 + 0.1 * i)
    play(kick(0.2) * 0.8, tm + 0.46, 0.35, 0.5)
    play(bell(mid(PENTA[(i * 2) % 7] + 12), 2.2, 0.8), tm + 0.46, 0.2, 0.3 + 0.1 * i, 0.7)
for tm in V.typing_click_times():
    play(tick(), tm, 0.22 + 0.06 * rng.rand(), 0.5 + rng.uniform(-0.05, 0.05))
for tm in V.FORUM_CLICKS:
    play(plink(880, 0.15, 0.05), V.S6 + tm, 0.3, 0.55)
    play(plink(1320, 0.25, 0.08), V.S6 + tm + 0.07, 0.25, 0.55, 0.3)
t9 = V.S6 + V.MAP_PIN_UI
play(bloop(1000, 300, 0.3), t9, 0.14)
play(bell(mid(88), 2.0, 0.7), t9 + 0.3, 0.22, 0.7, 0.7)
for k in range(9):    # hearts: rising sparkle
    play(plink(mid(PENTA[k % 7] + 12 + 12 * (k // 7)), 0.5, 0.2), V.S6 + 14.3 + k * 0.17, 0.16, 0.3 + 0.05 * k, 0.7)
for k in range(46):   # fireflies converging into the logo
    tm = V.S7 + 1.0 + k * 0.08 + rng.uniform(0, 0.05)
    n = PENTA[rng.randint(0, 7)] + 12 + 12 * rng.randint(0, 2)
    play(plink(mid(n), 0.5, 0.18), tm, 0.05 + 0.1 * (k / 46), rng.uniform(0.15, 0.85), 0.8)
for k in range(14):   # night sparkles in scene 1
    tm = 1.5 + k * 0.55 + rng.uniform(0, 0.3)
    play(plink(mid(PENTA[rng.randint(0, 7)] + 12), 0.6, 0.2), tm, 0.045, rng.uniform(0.2, 0.8), 0.9)

# ---- transitions ------------------------------------------------------
for tm, d in ((V.S2, 0.9), (V.S3A, 0.8), (V.S4, 0.9), (V.S5, 0.9), (V.S6, 0.9)):
    play(whoosh(d), tm - d / 2, 0.22, 0.5, 0.3)
play(whoosh(1.0, False), V.S3B - 0.5, 0.2, 0.5, 0.3)
play(bell(mid(81), 2.0, 0.9), V.S3B - 0.1, 0.12, 0.5, 0.6)
play(whoosh(1.2), V.S7 - 0.6, 0.24, 0.5, 0.4)

# ---- riser + logo hit --------------------------------------------------
rd = GAP0 - 70.0
tr = tt(rd)
x = tr / rd
rn = lp(noise(rd), 6000, 2) * (x ** 2.2)
tone = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (x * 3)) / SR) * (x ** 1.8) * 0.5
play((rn * 0.5 + tone * 0.3).astype(np.float32), 70.0, 0.5, 0.5, 0.35)
for k in range(8):    # snare roll accelerating into the gap
    tm = GAP0 - 3.2 + k * (0.4 - k * 0.03)
    if tm < GAP0:
        play(snare(), tm, 0.12 + 0.03 * k, 0.5)
H0 = V.LOGO_HIT
play(kick(0.9) * 1.1, H0, 0.95, 0.5)
play(crash(3.6), H0, 0.35, 0.5, 0.3)
t_sub = tt(2.4)
play((np.sin(2 * np.pi * 42 * t_sub) * np.exp(-t_sub / 0.9)).astype(np.float32), H0, 0.7, 0.5)
for j, n in enumerate((69, 72, 76, 79, 84, 88)):
    play(bell(mid(n), 4.5, 1.8), H0 + j * 0.05, 0.2, 0.2 + 0.12 * j, 0.8)
for k in range(24):   # shimmering tail
    n = PENTA[rng.randint(0, 7)] + 12 + 12 * rng.randint(0, 2)
    play(plink(mid(n), 0.8, 0.3), H0 + 0.4 + k * 0.17, 0.06 * (1 - k / 28), rng.uniform(0.1, 0.9), 0.9)
play(bell(mid(88), 4.0, 1.5), V.S7 + 11.2, 0.12, 0.5, 0.8)      # "coming soon" sting

# ---- reverb + master ----------------------------------------------
def reverb(src, seed):
    r = np.random.RandomState(seed)
    ln = int(2.4 * SR)
    ir = r.uniform(-1, 1, ln).astype(np.float32) * np.exp(-np.arange(ln) / SR / 0.7)
    ir = lp(ir, 4500, 2)
    for dly, g in ((0.017, 0.5), (0.031, 0.4), (0.047, 0.3)):
        ir[int(dly * SR)] += g
    n = len(src) + ln
    nfft = 1 << int(np.ceil(np.log2(n)))
    out = np.fft.irfft(np.fft.rfft(src, nfft) * np.fft.rfft(ir, nfft), nfft)[:len(src)]
    return out.astype(np.float32) * 0.045


L += reverb(WL, 1)
R += reverb(WR, 2)

fade = level(tg, [(0, 0.0), (0.7, 1.0), (DUR - 2.4, 1.0), (DUR, 0.0)])
L *= fade
R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
ref = np.percentile(np.abs(np.concatenate([L, R])), 99.7)
g = 0.62 / ref
L = np.tanh(L * g)
R = np.tanh(R * g)
pcm = (np.stack([L, R], 1) * 32767 * 0.92).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("audio written", sys.argv[1], f"{N / SR:.1f}s peak={peak:.2f}")
