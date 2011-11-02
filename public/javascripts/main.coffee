$ ->
    # const
    PI2 = Math.PI * 2
    SAMPLERATE = 11025
    CAPTION = "関西電気保安協会"
    PATTERN_SIZE = 16 * 2

    DEBUG = 0

    # enumerate
    [ HH, SD, BD, Vo ] = [ 0..3 ]
    [ NONE, LP12, HP12, BP12, BR12 ] = [ -1..3 ]
    [ OFF, ON, MOVE, UP, DOWN, COPY, CLS, DEL ] = [ 0..7 ]

    sintable = ( Math.sin(i/1024*PI2) for i in [0...1024] )

    class RhythmPad
        constructor: (sys, id, canvas)->
            $canvas = $(canvas)
            @sys = sys
            @id  = id
            @width   = w = canvas.width  = $canvas.width()
            @height  = h = canvas.height = $canvas.height()
            @context = c = canvas.getContext("2d")
            @pattern = ( (0 for j in [0..3]) for i in [0...PATTERN_SIZE])
            @ledIndex = null
            @velocity = 0
            @_cursor = [ -1, -1 ]

            c.font = "20px thin"

            for i in [0...PATTERN_SIZE]
                @draw i

            mouse = (e, mode)=>
                offset = $canvas.offset()
                [ x, y ] = [ e.pageX - offset.left, e.pageY - offset.top ]
                h = @height
                index = (x / @width * PATTERN_SIZE) | 0
                if      y > h - 20 then type = BD
                else if y > h - 40 then type = SD
                else if y > h - 60 then type = HH
                else type = Vo
                @tap type, index, mode
                @sys.tapcallback @id, index, type, mode

            $canvas.bind "contextmenu", (e)=>
                return false

            isMouseDown = false
            $canvas.mousedown (e)=>
                isMouseDown = true
                mouse e, if e.button == 0 then ON else OFF

            $canvas.mousemove (e)=>
                if isMouseDown then mouse e, MOVE

            $canvas.mouseup (e)=>
                isMouseDown = false

        clear: ->
            @pattern = ( (0 for j in [0..3]) for i in [0...PATTERN_SIZE])
            for i in [0...PATTERN_SIZE]
                @draw i

        copy: (src)->
            for index in [0...PATTERN_SIZE]
                for type in [0..3]
                    @pattern[index][type] = src.pattern[index][type]
                @draw index

        tap: (type, index, mode)->
            if type == Vo
                switch mode
                    when OFF then @pattern[index][type] = 0
                    when ON  then @pattern[index][type] = @sys.voice + 1
            else
                val = @pattern[index][type]
                if val?
                    switch mode
                        when ON
                            val += 1
                            if val >= 3 then val = 0
                            @velocity = val
                        when OFF
                            val -= 1
                            if val < 0 then val = 2
                            @velocity = val
                        when MOVE
                            val = @velocity
                    @pattern[index][type] = val

            @draw index

        cursor: (x, y, mode)->
            if mode == OFF
                @_cursor = [ -1, -1 ]
            else
                @_cursor = [ x, y ]
            @draw x

        put: (x, y, val)->
            @pattern[x][y] = val
            @draw x

        draw: (index)->
            [ c, h ] = [ @context, @height ]

            dx = @width / PATTERN_SIZE
            x = index * dx
            c.clearRect(x, 0, dx, h)

            voice = @pattern[index][Vo]
            if voice != 0
                c.shadowBlur = 0
                if @ledIndex == index
                    c.fillStyle = "lightyellow"
                else
                    c.fillStyle = "gray"
                c.fillText(CAPTION[voice-1], x+4, 30, dx)

            if @_cursor[0] == index
                switch @_cursor[1]
                    when HH then y = h - 60
                    when SD then y = h - 40
                    when BD then y = h - 20

                c.shadowBlur = 0
                c.fillStyle = "#00c"
                c.fillRect(x+1, y, dx-2, 20)

            c.fillStyle = if index % 4 == 0 then "#f66" else "#6f6"
            size = if @ledIndex == index then [2,6,10] else [1,4,8]

            c.shadowBlur = 2
            c.shadowColor = "white"

            for type in [HH, SD, BD]
                switch type
                    when HH then y = h - 50
                    when SD then y = h - 30
                    when BD then y = h - 10

                c.beginPath()
                c.arc(x + dx/2, y, size[@pattern[index][type]], 0, PI2, false)
                c.fill()
                c.closePath()

        led: (index, onOff)->
            if onOff == OFF then @ledIndex = null
            else @ledIndex = index
            @draw index




    waveStretch = (data, len)->
        if data.length == len
            return data
        result = []
        for i in [0...len]
            index1 = (i / len) * data.length
            index2 = index1 - (index1 | 0)
            index1 |= 0

            v1 = data[index1]
            v2 = data[index1 + 1] || 0
            result[i] = (v1 * (1.0 - index2)) + (v2 * index2)
        return result


    class RhythmGenerator
        constructor: (sys, player, waves)->
            @sys = sys
            @player = player
            console.log "samplerate", @player.SAMPLERATE

            stretch = @player.SAMPLERATE / SAMPLERATE
            lst = []
            for wave, i in waves
                binary = atob(wave)
                data = []
                for j in [0...binary.length/2]
                    b0 = binary.charCodeAt(j * 2)
                    b1 = binary.charCodeAt(j * 2 + 1)
                    bb = (b1 << 8) + b0
                    x = if bb & 0x8000 then -((bb^0xFFFF)+1) else bb
                    data[j] = x / 65535
                lst[i] = waveStretch(data, (data.length * stretch + 0.5)|0)
            @_wavData = lst

            @_filter = null
            @_sample = 0
            @_sampleCounter = 0
            @_index = 0
            @_src = [ 0, 0, 0, 0 ]
            @_vol = [ 2.0, 0, 0, 1.0 ]
            @_wavlet  = [ 0, @_wavData[SD], @_wavData[BD], 0 ]
            @_wavIndex = [ 0, 0, 0, 0 ]
            @_drumStep = 1.5


            @_filterIndex = 0
            @_filterIndexStep = 0

            @chbpm 180
            @chvol   8
            @chpitch 0

        isPlaying: ()->@player.isPlaying()

        play: ()->
            console.log "play"
            @player.play(@)

        stop: () ->
            console.log "stop"
            @player.stop()

        setfilter: (filter)->
            @_filter = filter

        chfilterrate: (val)->
            @_filterIndexStep = val * 1024 / @player.SAMPLERATE

        chbpm: (val)->
            @bpm = val
            interval = (60 / val * 1000) / 4000
            @_sampleLimit = @player.SAMPLERATE * interval

        chvol: (val)->
            @_vol[Vo] = val/10

        chpitch: (val)->
            if val < 1 then v = 1
            else if val > 5 then v = 5
            @_pitch = val
            @_drumStep = [0.75, 0.8, 0.9, 0.95, 1.0, 1.1, 1.2, 1.25, 1.3][val+4]

        next: () ->
            cnt = @player.STREAM_CELL_COUNT
            cellsize = @player.STREAM_CELL_SIZE
            rpads = @sys.rpads
            maxIndex = rpads.length * PATTERN_SIZE
            [_index,_src] = [@_index,@_src]
            [_wavlet, _vol] = [@_wavlet,@_vol]
            [_sample,_sampleLimit] = [@_sample,@_sampleLimit]
            [_wavData,_wavIndex, _drumStep] = [@_wavData,@_wavIndex, @_drumStep]
            [_filter,_filterIndex,_filterIndexStep] = [@_filter,@_filterIndex,@_filterIndexStep]

            i2 = (_index - 1 + maxIndex) % maxIndex
            m = ((i2 / PATTERN_SIZE) | 0) % rpads.length
            n = ((i2 % PATTERN_SIZE) | 0)
            rpads[m].rhythm.led(n, OFF)

            stream = new Float32Array(cellsize * cnt)
            k = 0
            for i in [0...cnt]
                _sample -= cellsize
                if _sample <= 0
                    i2 = (_index + maxIndex) % maxIndex
                    m = ((i2 / PATTERN_SIZE) | 0) % rpads.length
                    n = ((i2 % PATTERN_SIZE) | 0)

                    _src = rpads[m].rhythm.pattern[n]

                    if _src[HH] == 1
                        _wavlet[HH] = _wavData[HH]
                        _wavIndex[HH] = 0
                    else if _src[HH] == 2
                        _wavlet[HH] = _wavData[3] # OPENHH
                        _wavIndex[HH] = 0

                    if _src[SD]
                        _vol[SD] = [0,0.4,1.0][_src[SD]]
                        _wavIndex[SD] = 0

                    if _src[BD]
                        _vol[BD] = [0,0.3,0.6][_src[BD]]
                        _wavIndex[BD] = 0

                    if _src[Vo] != 0
                        _wavlet[Vo] = _wavData[_src[Vo] + 3]
                        _wavIndex[Vo] = 0
                    _index = (_index + 1) % maxIndex
                    _sample += _sampleLimit

                vstream = new Float32Array(cellsize)
                _k = k
                for j in [0...cellsize]
                    for type in [HH, SD, BD]
                        stream[k] += (_wavlet[type][_wavIndex[type]|0])*_vol[type] || 0.0
                        _wavIndex[type] += _drumStep

                    vstream[j] += (_wavlet[Vo][_wavIndex[Vo]|0]*_vol[Vo] || 0.0)
                    _wavIndex[Vo] += 1
                    k += 1

                if _filter
                    _filterIndex += _filterIndexStep
                    if _filterIndex >= 1024 then _filterIndex -= 1024
                    cutoff = sintable[_filterIndex|0]
                    switch _filter.type
                        when LP12 then cutoff = cutoff * 1400 + 2800
                        when HP12 then cutoff = cutoff *  900 + 1200
                        when BP12 then cutoff = cutoff * 1800 + 2400
                        when BR12 then cutoff = cutoff *  800 + 4200
                    _filter.chcutoff cutoff
                    _filter.process vstream

                for _j in [0...cellsize]
                    stream[_k+_j] += vstream[_j]


            rpads[m].rhythm.led(n, ON)

            for i in [0...stream.length]
                if stream[i] < -1.0 then stream[i] = -1.0
                else if stream[i] > 1.0 then stream[i] = 1.0

            @_index = _index
            @_src = _src
            @_sample = _sample
            @_filterIndex = _filterIndex

            return stream


    class IIRFilter
        constructor: (type, samplerate)->
            @amp = 0.5
            @type = type

            @_f = [ 0.0, 0.0, 0.0, 0.0 ]
            @_cutoff = 880
            @_resonance = 0.1
            @_freq = 0
            @_damp = 0
            @_samplerate = samplerate

            @_calcCoeff @_cutoff, @_resonance

        process: (stream)->
            [_f,_damp,_freq,type,amp] = [@_f,@_damp,@_freq,@type,@amp]
            if type != NONE
                for i in [0...stream.length]
                    input = stream[i]

                    # first pass
                    _f[3] = input - _damp * _f[2]
                    _f[0] = _f[0] + _freq * _f[2]
                    _f[1] = _f[3] - _f[0]
                    _f[2] = _freq * _f[1] + _f[2]
                    output = 0.5 * _f[type]

                    # second pass
                    _f[3] = input - _damp * _f[2]
                    _f[0] = _f[0] + _freq * _f[2]
                    _f[1] = _f[3] - _f[0]
                    _f[2] = _freq * _f[1] + _f[2]
                    output += 0.5 * _f[type]

                    stream[i] = (input * (1.0 - amp)) + (output * amp)

        champ: (val)->
            val /= 10.0
            if val < 0.0 then val = 0.0
            else if 1.0 < val then val = 1.0
            @amp = val


        chtype: (type)->
            switch type
                when LP12 then @type = LP12
                when BP12 then @type = BP12
                when HP12 then @type = HP12
                when BR12 then @type = BR12
                else @type = NONE

        chcutoff: (cutoff)->
            @_cutoff = cutoff
            @_calcCoeff @_cutoff, @_resonance

        chres: (val)->
            @_resonance = val
            @_calcCoeff @_cutoff, @_resonance

        _calcCoeff: (cutoff, resonance)->
            @_freq = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (@_samplerate*2)))
            @_damp = Math.min(2 * (1 - Math.pow(resonance, 0.25)), Math.min(2, 2/@_freq - @_freq*0.5))


    class System
        constructor: ->
            @edit = $("#edit")
            @rpads = []
            @voice = 0
            @index = 0

            for ch, i in CAPTION
                $div = $(document.createElement("div")).text(ch)
                    .click do(i)=>=>@putvoice(i, ON, OFF)
                $label = $(document.createElement("span")).text(i + 1 +"")

                $li = $(document.createElement("li"))

                $("#selector").append $li.append($label.append($div))

            player = pico.getplayer {samplerate:SAMPLERATE, channel:1}
            if player
                @generator = new RhythmGenerator(@, player, V)
                @filter = new IIRFilter(NONE, @generator.player.SAMPLERATE)
                @generator.setfilter @filter
            else
                $("#play").attr("disabled", true)

        putvoice: (i, mode, move)->
            if i != -1
                @voice = i
                for li, j in $("#selector li div")
                    if i == j
                        $(li).css("color", "#9f9")\
                            .css("background", "#393")
                    else
                        $(li).css("color", "#030")\
                           .css("background", "#363")
            x = (@index % PATTERN_SIZE) | 0
            y = (@index / PATTERN_SIZE) | 0
            @rpads[(y/3)|0].rhythm.tap(Vo, x, mode)

            if move then @move 1, 0

        tapcallback: (id, index, type, mode)->
            len = @rpads.length * 3
            x = (@index % PATTERN_SIZE) | 0
            y = (@index / PATTERN_SIZE) | 0
            if x < 0
                x = PATTERN_SIZE - 1
                y -= 1
            if x >= PATTERN_SIZE
                x = 0
                y += 1
            if y < 0 then y = len - 1
            if y >= len then y = 0
            @rpads[(y/3)|0].rhythm.cursor(x, y % 3, OFF)

            i = @findIndex(id)
            if type == Vo then type = y % 3
            @rpads[i].rhythm.cursor(index, type, ON)

            @index = type * PATTERN_SIZE + index


        chbpm: (val) -> @generator.chbpm val
        chvol: (val) -> @generator.chvol val
        chpitch: (val) -> @generator.chpitch val
        chrate: (val) -> @generator.chfilterrate val

        chfilter: (val) -> @filter.chtype val
        chgain: (val) -> @filter.champ val
        chres: (val) -> @filter.chres val

        move: (dx, dy) ->
            len = @rpads.length * 3
            x = (@index % PATTERN_SIZE) | 0
            y = (@index / PATTERN_SIZE) | 0
            if x < 0
                x = PATTERN_SIZE - 1
                y -= 1
            if x >= PATTERN_SIZE
                x = 0
                y += 1
            if y < 0 then y = len - 1
            if y >= len then y = 0
            @rpads[(y/3)|0].rhythm.cursor(x, y % 3, OFF)

            x += dx
            y += dy
            if x < 0
                x = PATTERN_SIZE - 1
                y -= 1
            if x >= PATTERN_SIZE
                x = 0
                y += 1
            if y < 0 then y = len - 1
            if y >= len then y = 0

            @rpads[(y/3)|0].rhythm.cursor(x, y % 3, ON)
            @index = y * PATTERN_SIZE + x

        put: (vec) ->
            len = @rpads.length * 3
            x = (@index % PATTERN_SIZE) | 0
            y = (@index / PATTERN_SIZE) | 0

            @rpads[(y/3)|0].rhythm.put(x, y % 3, vec)
            @move 1, 0

        play: ->
            if @generator.isPlaying()
                @generator.stop()
                $("#play").css("color", "#000")
            else
                @generator.play()
                $("#play").css("color", "#f33")

        add: ->
            if @rpads.length >= 8 then return -1

            $div = $(document.createElement("div"))

            userAgent = navigator.userAgent

            $ctrl = $(document.createElement("div"))
            $ctrl.addClass("ctrl")

            if userAgent.indexOf("Opera") != -1
                $ctrl.css("margin-top", "-100px") # ??? ugly..

            id = new Date().getTime()
            $ctrl.append $(document.createElement("button")).text("up")\
              .click do(id)=>=>@operate UP, id

            $ctrl.append $(document.createElement("button")).text("down")\
              .click do(id)=>=>@operate DOWN, id

            $ctrl.append $(document.createElement("button")).text("copy")\
              .click do(id)=>=>@operate COPY, id

            $ctrl.append $(document.createElement("button")).text("cls")\
              .click do(id)=>=>@operate CLS, id

            $ctrl.append $(document.createElement("button")).text("del")\
              .click do(id)=>=>@operate DEL, id

            canvas = document.createElement("canvas")
            @edit.append $div.append(canvas).append($ctrl)

            @rpads.push
                id:id, elem:$div, rhythm:new RhythmPad(@, id, canvas)

            return id

        findIndex: (id)=>
            for t, i in @rpads
                if t.id == id then return i

        operate: (type, id)->
            if not id?
                y = (@index / PATTERN_SIZE) | 0
                id = @rpads[(y/3)|0].id

            i = @findIndex(id)
            switch type
                when UP then if i > 0
                    @rpads[i-1].elem.before @rpads[i].elem
                    @rpads[i-1..i] = [ @rpads[i], @rpads[i-1] ]
                    @index += PATTERN_SIZE * 3
                when DOWN then if i < @rpads.length - 1
                    @rpads[i+1].elem.after @rpads[i].elem
                    @rpads[i..i+1] = [ @rpads[i+1], @rpads[i] ]
                    @index -= PATTERN_SIZE * 3
                when COPY
                    newid = @add()
                    if newid != -1
                        i2 = @findIndex(newid)
                        @rpads[i2].rhythm.copy(@rpads[i].rhythm)
                when CLS then if i?
                    @rpads[i].rhythm.clear()
                when DEL
                    if @rpads.length > 1
                        @rpads[i].elem.remove()
                        if i? then @rpads.splice i, 1
                    else @rpads[0].rhythm.clear()
            if @index > @rpads.length * PATTERN_SIZE * 3
                @index -= @rpads.length * PATTERN_SIZE * 3
            else if @index < 0
                @index += @rpads.length * PATTERN_SIZE * 3

        save: ()->
            dict = pattern: ( p.rhythm.pattern for p in @rpads )
            bpm: $bpm.slider("value")
            vol: $vol.slider("value")
            pitch: $pitch.slider("value")
            filter: $filter.val() | 0
            gain: $gain.slider("value")
            rate: $rate.slider("value")
            res : $res .slider("value")

            $save_msg.val "now saving..."
            $.post "/", data:JSON.stringify(dict), (res)->
                url = "http://" + location.host + "/" + res
                $save_msg.val url

        load: (id)->
            $.get "/api/" + id, (res)=>
                if not res
                    $save_msg.val "no data"
                else
                    data = JSON.parse(res)

                    if data.bpm then $bpm.slider("value", data.bpm)
                    if data.vol then $vol.slider("value", data.vol)
                    if data.pitch then $pitch.slider("value", data.vol)
                    if data.filter then $filter.val(data.filter).change()
                    if data.gain then $gain.slider("value", data.gain)
                    if data.rate then $rate.slider("value", data.rate)
                    if data.res  then $res.slider("value", data.res)

                    if not data.pattern
                        $save_msg.val "no data"
                    else
                        for i in [0...data.pattern.length]
                            if i == 0
                                p = @rpads[0]
                            else
                                @add()
                                p = @rpads[i]
                            p.rhythm.pattern = data.pattern[i]

                            for j in [0...PATTERN_SIZE]
                                p.rhythm.draw j

        initpattern: ()->
            r = @rpads[0].rhythm

            r.pattern[0][Vo] = 1
            r.pattern[4][Vo] = 2
            r.pattern[10][Vo] = 3
            r.pattern[14][Vo] = 4
            r.pattern[16][Vo] = 5
            r.pattern[20][Vo] = 6
            r.pattern[24][Vo] = 7
            r.pattern[28][Vo] = 8

            for i in [0...PATTERN_SIZE]
                r.draw i


    # System & UI
    sys = new System()
    $save_msg = $("#save-msg")

    $("#play").click -> sys.play()
    $("#add") .click -> sys.add()
    $("#options").click -> $("#options-panel").slideToggle("fast")
    $("#save").click -> sys.save()

    $bpm = $("#bpm").slider min:60, max:300, value:180, step:1,
        change: (e, ui)->
            val = ui.value | 0
            $("#bpm-val").text val
            sys.chbpm val
        slide: (e, ui)->
            val = ui.value | 0
            $("#bpm-val").text val
            sys.chbpm val

    $vol = $("#vol").slider min:0, max:10, value:8, step:1,
        change: (e, ui)->
            val = ui.value | 0
            $("#vol-val").text val
            sys.chvol val

        slide: (e, ui)->
            val = ui.value | 0
            $("#vol-val").text val
            sys.chvol val

    $pitch = $("#pitch").slider min:-4, max:4, value:0, step:1,
        change: (e, ui)->
            val = ui.value | 0
            $("#pitch-val").text val
            sys.chpitch val

        slide: (e, ui)->
            val = ui.value | 0
            $("#pitch-val").text val
            sys.chpitch val

    $gain = $("#gain").slider min:0, max:10, value:4, step:1,
        change: (e, ui)->
            val = ui.value | 0
            $("#gain-val").text val
            sys.chgain val

        slide: (e, ui)->
            val = ui.value | 0
            $("#gain-val").text val
            sys.chgain val

    $rate = $("#rate").slider min:0, max:100, value:1, step:2,
        change: (e, ui)->
            val = ui.value | 0
            $("#rate-val").text val
            sys.chrate val

        slide: (e, ui)->
            val = ui.value | 0
            $("#rate-val").text val
            sys.chrate val

    $res = $("#res").slider min:0, max:1, value:0.1, step:0.01,
        change: (e, ui)->
            val = Number(ui.value)
            $("#res-val").text val
            sys.chres val

        slide: (e, ui)->
            val = Number(ui.value)
            $("#res-val").text val
            sys.chres val

    $filter = $("#filter").change (e)->
        sys.chfilter $filter.val() | 0

    $(document).keydown (e)->
        if e.ctrlKey or e.metaKey then return

        switch e.keyCode
            when " ".charCodeAt(0) then sys.play()
            when "1".charCodeAt(0), "2".charCodeAt(0),\
                 "3".charCodeAt(0), "4".charCodeAt(0),\
                 "5".charCodeAt(0), "7".charCodeAt(0),\
                 "6".charCodeAt(0), "8".charCodeAt(0)
                sys.putvoice(e.keyCode - "1".charCodeAt(0), ON, ON)
            when "0".charCodeAt(0)
                sys.putvoice(-1, OFF, ON)

            when "X".charCodeAt(0) then sys.operate CLS
            when "C".charCodeAt(0) then sys.operate COPY
            when "V".charCodeAt(0) then sys.operate DOWN
            when "B".charCodeAt(0) then sys.operate UP
            when 8, 46 then sys.operate DEL # [del] key

            when "Q".charCodeAt(0)
                $bpm.slider("value", $bpm.slider("value") - 5)
            when "W".charCodeAt(0)
                $bpm.slider("value", $bpm.slider("value") + 5)
            when "E".charCodeAt(0)
                $vol.slider("value", $vol.slider("value") - 1)
            when "R".charCodeAt(0)
                $vol.slider("value", $vol.slider("value") + 1)
            when "T".charCodeAt(0)
                $gain.slider("value", $gain.slider("value") - 1)
            when "Y".charCodeAt(0)
                $gain.slider("value", $gain.slider("value") + 1)
            when "U".charCodeAt(0)
                $rate.slider("value", $rate.slider("value") - 2)
            when "I".charCodeAt(0)
                $rate.slider("value", $rate.slider("value") + 2)
            when "O".charCodeAt(0)
                $res.slider("value", $res.slider("value") - 0.05)
            when "P".charCodeAt(0)
                $res.slider("value", $res.slider("value") + 0.05)
            when "F".charCodeAt(0)
                val = ($filter.val()|0) + 1
                if val == -4 then val = 0
                $filter.val(val).change()
            when "H".charCodeAt(0), 37 then sys.move -1,  0
            when "L".charCodeAt(0), 39 then sys.move +1,  0
            when "K".charCodeAt(0), 38 then sys.move  0, -1
            when "J".charCodeAt(0), 40 then sys.move  0, +1
            when "A".charCodeAt(0) then sys.put 0
            when "S".charCodeAt(0) then sys.put 1
            when "D".charCodeAt(0) then sys.put 2
            when "Z".charCodeAt(0) then $("#options").click()
            when "N".charCodeAt(0)
                if e.shiftKey then $("#add").click()
            else console.log "??", e.keyCode, e
        e.preventDefault()

    # social buttons
    social_url = "http://ksdn808.herokuapp.com/"
    sb = $("#social-button")
    $(".hatena", sb).socialbutton "hatena",
        button:"horizontal", url: social_url

    $(".tweet", sb).socialbutton "twitter",
        button:"horizontal", lang:"en", url: social_url

    $(".google_plus", sb).socialbutton "google_plusone",
        button:"medium", count:false, url: social_url

    $(".facebook", sb).socialbutton "facebook_like",
        button:"button_count", url: social_url

    # initialize
    sys.add()
    sys.move 0, 0
    $("#selector li:first div").click()

    id = location.pathname.substr(1)
    if id then sys.load id
    else sys.initpattern()


