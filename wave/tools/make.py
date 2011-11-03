#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
import sys
import wave
import base64

VOCAL_TONES = tuple(["01", "02", "03", "04", "05", "06", "07", "08", "09"])
DRUM_TONES  = tuple(["HH1", "SD", "BD", "HH2"])

def wave2str(filepath):
    if filepath and os.path.exists(filepath):
        src = wave.open(filepath, "rb")
        params = src.getparams()
        nchannles, sampwidth, framerate, nframes = params[:4]
        w1 = base64.b64encode(src.readframes(nframes))
        w2 = re.sub(u'(A)*$', '', w1)
        return w2
    return ""


def jsonformat(object):
    return str(object).replace(" ", "").replace("'", '"')


def main():
    """*.wavをjsonに変換する"""
    d = os.path.dirname(os.path.abspath(__file__))
    voSet, drKit = {}, {}
    for fname in os.listdir(d):
        if not fname.endswith(".wav"): continue

        name, type = fname[:-4].split("-")
        fpath = os.path.join(d, fname)

        if type in VOCAL_TONES:
            voSet.setdefault(name, {})[type] = fpath
        elif type in DRUM_TONES:
            drKit.setdefault(name, {})[type] = fpath

    for type in ("drKit", "voSet"):
        if type == "drKit":
            dataCollection, tones = drKit, DRUM_TONES
        else:
            dataCollection, tones = voSet, VOCAL_TONES
        for name, dataSet in dataCollection.iteritems():
            fname = "../%s-%s.json" % (type, name)
            f = open(fname, "w")
            f.write(jsonformat([wave2str(dataSet.get(t)) for t in tones]))
            f.close()

if __name__ == "__main__":
    main()
