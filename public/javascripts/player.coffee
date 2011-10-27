pico = window.pico = window.pico || {}

do (pico)->
    NOP = ()->null

    class BasePlayer
        constructor: ()->
            console.log "BasePlayer"

            @finished = true

            @_cancelled = false
            @_streamSlots = []
            @_streamReadIndex = 0
            @_streamPlayIndex = 0
            @_streamReadTimerId = null

            @_generator = null



        initialize: (samplerate, channel)->
            @SAMPLERATE = samplerate
            @CHANNEL = 1

            calcBits = (sec)->
                bits = 0
                len = sec >> 1
                while len > 0
                    len >>= 1
                    bits += 1
                return bits

            @STREAM_FULL_BITS = calcBits(samplerate /  20)
            @STREAM_CELL_BITS = calcBits(samplerate / 250)
            @STREAM_FULL_SIZE = 1 << @STREAM_FULL_BITS
            @STREAM_CELL_SIZE = 1 << @STREAM_CELL_BITS
            @STREAM_CELL_COUNT = @STREAM_FULL_SIZE / @STREAM_CELL_SIZE
            @NONE_STREAM_FULL_SIZExC = new Float32Array(@STREAM_FULL_SIZE * @CHANNEL)
            @NONE_STREAM_FULL_SIZE = new Float32Array(@STREAM_FULL_SIZE)
            @NONE_STREAM_CELL_SIZE = new Float32Array(@STREAM_CELL_SIZE)

            @_playInterval = (@STREAM_FULL_SIZE / samplerate) * 1000

            @_streamSlots[0] = new Float32Array(@STREAM_FULL_SIZE * @CHANNEL)
            @_streamSlots[1] = new Float32Array(@STREAM_FULL_SIZE * @CHANNEL)

        isPlaying: ()-> !@finished

        play: (generator)->
            if @finished
                if generator then @_generator = generator

                if @_generator
                    @finished = false
                    @_cancelled = false
                    @_streamReadIndex = 0
                    @_streamPlayIndex = 0

                    if not @_streamReadTimerId?
                        clearInterval @_streamReadTimerId

                    @_streamReadTimerId = setInterval ()=>
                        @_readStream()
                    , @_playInterval / 2

        stop: ()->
            @_cancelled = true

        _readStream: ()->
            if @_streamReadIndex == @_streamPlayIndex
                index = @_streamReadIndex & 0x01
                @_streamSlots[index].set @_generator.next()
                @_streamReadIndex += 1

            if @_cancelled and @_streamReadTimerId
                clearInterval @_streamReadTimerId
                @_streamReadTimerId = null
                @finished = true


    class WebkitPlayer extends BasePlayer
        constructor: (samplerate, channel)->
            super()
            console.log "WebkitPlayer"

            @_context = new webkitAudioContext()
            @initialize @_context.sampleRate, channel

            @_node = @_context.createJavaScriptNode @STREAM_FULL_SIZE, 1, @CHANNEL

        play: (generator)->
            super(generator)

            onaudioprocessDelegate = (delegate)=>(event)=>
                if @_streamPlayIndex < @_streamReadIndex
                    i = @_streamPlayIndex & 0x01
                    delegate event, @_streamSlots[i]
                    @_streamPlayIndex += 1

            switch @CHANNEL
                when 2
                    @_node.onaudioprocess =\
                        onaudioprocessDelegate (event, stream)=>
                            dataL = event.outputBuffer.getChannelData(0)
                            dataR = event.outputBuffer.getChannelData(1)
                            i = dataR.length
                            j = i * 2
                            while i--
                                dataR[i] = stream[j    ]
                                dataL[i] = stream[j + 1]
                                j -= 2
                else
                    @_node.onaudioprocess =\
                        onaudioprocessDelegate (event, stream)=>
                            dataL = event.outputBuffer.getChannelData(0)
                            dataR = event.outputBuffer.getChannelData(1)
                            i = dataR.length
                            while i--
                                dataR[i] = dataL[i] = stream[i]
            @_node.connect @_context.destination

        stop: ()->
            super()
            @_node?.disconnect()


    class MozPlayer extends BasePlayer
        constructor: (samplerate, channel)->
            super()
            console.log "MozPlayer"

            @initialize samplerate, channel

            @_audio = new Audio()
            @_audio.mozSetup @CHANNEL, @SAMPLERATE
            @_playTimerId = null


        play: (generator)->
            super(generator)

            if @_playTimerId?
                clearInterval @_playTimerId
                @_playTimerId = null

            @_playTimerId = setInterval ()=>
                if @_streamPlayIndex < @_streamReadIndex
                    stream = @_streamSlots[@_streamPlayIndex & 0x01]
                    @_audio.mozWriteAudio stream
                    @_streamPlayIndex += 1
                else if @finished
                    @stop()
            , @_playInterval

        stop: ()->
            super()

            if @_playTimerId?
                clearInterval @_playTimerId
                @_playTimerId = null


    pico.getplayer = (samplerate, channel)->
        if typeof webkitAudioContext == "function"
            return new WebkitPlayer(samplerate, channel)
        else if typeof Audio == "function"
            a = new Audio()
            if typeof a.mozSetup == typeof a.mozWriteAudio == "function"
                return new MozPlayer(samplerate, channel)
        else return null


