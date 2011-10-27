#!/usr/bin/env python
# -*- coding: utf-8 -*-

import wave
import base64

def main():
    """*.wavをJavaScriptに変換する"""
    result = []
    for i in xrange(12):
        f = "%02d.wav" % i
        src = wave.open(f, 'rb')
        params = src.getparams()
        nchannles, sampwidth, framerate, nframes = params[:4]

        result.append(base64.b64encode(src.readframes(nframes)))
    print "var V=[%s];" % ",".join('"%s"' % x for x in result)

if __name__ == "__main__":
    main()
