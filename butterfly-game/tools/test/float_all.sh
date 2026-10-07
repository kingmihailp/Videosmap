#!/bin/sh
# every batched builder: the market (stalls, well, lamps, door ...), the strange stall, the secret market and the chalets must have no part that is not attached to the ground or to another part
cd "$(dirname "$0")" && . /tmp/pw.sh && node secret_float.js && node float_check.js
