(function() {
  var pico;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  pico = window.pico = window.pico || {};
  (function(pico) {
    var BasePlayer, MozPlayer, NOP, WebkitPlayer;
    NOP = function() {
      return null;
    };
    BasePlayer = (function() {
      function BasePlayer() {
        console.log("BasePlayer");
        this.finished = true;
        this._cancelled = false;
        this._streamSlots = [];
        this._streamReadIndex = 0;
        this._streamPlayIndex = 0;
        this._streamReadTimerId = null;
        this._generator = null;
      }
      BasePlayer.prototype.initialize = function(samplerate, channel) {
        var calcBits;
        this.SAMPLERATE = samplerate;
        this.CHANNEL = 1;
        calcBits = function(sec) {
          var bits, len;
          bits = 0;
          len = sec >> 1;
          while (len > 0) {
            len >>= 1;
            bits += 1;
          }
          return bits;
        };
        this.STREAM_FULL_BITS = calcBits(samplerate / 20);
        this.STREAM_CELL_BITS = calcBits(samplerate / 250);
        this.STREAM_FULL_SIZE = 1 << this.STREAM_FULL_BITS;
        this.STREAM_CELL_SIZE = 1 << this.STREAM_CELL_BITS;
        this.STREAM_CELL_COUNT = this.STREAM_FULL_SIZE / this.STREAM_CELL_SIZE;
        this.NONE_STREAM_FULL_SIZExC = new Float32Array(this.STREAM_FULL_SIZE * this.CHANNEL);
        this.NONE_STREAM_FULL_SIZE = new Float32Array(this.STREAM_FULL_SIZE);
        this.NONE_STREAM_CELL_SIZE = new Float32Array(this.STREAM_CELL_SIZE);
        this._playInterval = (this.STREAM_FULL_SIZE / samplerate) * 1000;
        this._streamSlots[0] = new Float32Array(this.STREAM_FULL_SIZE * this.CHANNEL);
        return this._streamSlots[1] = new Float32Array(this.STREAM_FULL_SIZE * this.CHANNEL);
      };
      BasePlayer.prototype.isPlaying = function() {
        return !this.finished;
      };
      BasePlayer.prototype.play = function(generator) {
        if (this.finished) {
          if (generator) {
            this._generator = generator;
          }
          if (this._generator) {
            this.finished = false;
            this._cancelled = false;
            this._streamReadIndex = 0;
            this._streamPlayIndex = 0;
            if (!(this._streamReadTimerId != null)) {
              clearInterval(this._streamReadTimerId);
            }
            return this._streamReadTimerId = setInterval(__bind(function() {
              return this._readStream();
            }, this), this._playInterval / 2);
          }
        }
      };
      BasePlayer.prototype.stop = function() {
        return this._cancelled = true;
      };
      BasePlayer.prototype._readStream = function() {
        var index;
        if (this._streamReadIndex === this._streamPlayIndex) {
          index = this._streamReadIndex & 0x01;
          this._streamSlots[index].set(this._generator.next());
          this._streamReadIndex += 1;
        }
        if (this._cancelled && this._streamReadTimerId) {
          clearInterval(this._streamReadTimerId);
          this._streamReadTimerId = null;
          return this.finished = true;
        }
      };
      return BasePlayer;
    })();
    WebkitPlayer = (function() {
      __extends(WebkitPlayer, BasePlayer);
      function WebkitPlayer(samplerate, channel) {
        WebkitPlayer.__super__.constructor.call(this);
        console.log("WebkitPlayer");
        this._context = new webkitAudioContext();
        this.initialize(this._context.sampleRate, channel);
        this._node = this._context.createJavaScriptNode(this.STREAM_FULL_SIZE, 1, this.CHANNEL);
      }
      WebkitPlayer.prototype.play = function(generator) {
        var onaudioprocessDelegate;
        WebkitPlayer.__super__.play.call(this, generator);
        onaudioprocessDelegate = __bind(function(delegate) {
          return __bind(function(event) {
            var i;
            if (this._streamPlayIndex < this._streamReadIndex) {
              i = this._streamPlayIndex & 0x01;
              delegate(event, this._streamSlots[i]);
              return this._streamPlayIndex += 1;
            }
          }, this);
        }, this);
        switch (this.CHANNEL) {
          case 2:
            this._node.onaudioprocess = onaudioprocessDelegate(__bind(function(event, stream) {
              var dataL, dataR, i, j, _results;
              dataL = event.outputBuffer.getChannelData(0);
              dataR = event.outputBuffer.getChannelData(1);
              i = dataR.length;
              j = i * 2;
              _results = [];
              while (i--) {
                dataR[i] = stream[j];
                dataL[i] = stream[j + 1];
                _results.push(j -= 2);
              }
              return _results;
            }, this));
            break;
          default:
            this._node.onaudioprocess = onaudioprocessDelegate(__bind(function(event, stream) {
              var dataL, dataR, i, _results;
              dataL = event.outputBuffer.getChannelData(0);
              dataR = event.outputBuffer.getChannelData(1);
              i = dataR.length;
              _results = [];
              while (i--) {
                _results.push(dataR[i] = dataL[i] = stream[i]);
              }
              return _results;
            }, this));
        }
        return this._node.connect(this._context.destination);
      };
      WebkitPlayer.prototype.stop = function() {
        var _ref;
        WebkitPlayer.__super__.stop.call(this);
        return (_ref = this._node) != null ? _ref.disconnect() : void 0;
      };
      return WebkitPlayer;
    })();
    MozPlayer = (function() {
      __extends(MozPlayer, BasePlayer);
      function MozPlayer(samplerate, channel) {
        MozPlayer.__super__.constructor.call(this);
        console.log("MozPlayer");
        this.initialize(samplerate, channel);
        this._audio = new Audio();
        this._audio.mozSetup(this.CHANNEL, this.SAMPLERATE);
        this._playTimerId = null;
      }
      MozPlayer.prototype.play = function(generator) {
        MozPlayer.__super__.play.call(this, generator);
        if (this._playTimerId != null) {
          clearInterval(this._playTimerId);
          this._playTimerId = null;
        }
        return this._playTimerId = setInterval(__bind(function() {
          var stream;
          if (this._streamPlayIndex < this._streamReadIndex) {
            stream = this._streamSlots[this._streamPlayIndex & 0x01];
            this._audio.mozWriteAudio(stream);
            return this._streamPlayIndex += 1;
          } else if (this.finished) {
            return this.stop();
          }
        }, this), this._playInterval);
      };
      MozPlayer.prototype.stop = function() {
        MozPlayer.__super__.stop.call(this);
        if (this._playTimerId != null) {
          clearInterval(this._playTimerId);
          return this._playTimerId = null;
        }
      };
      return MozPlayer;
    })();
    return pico.getplayer = function(samplerate, channel) {
      var a, _ref;
      if (typeof webkitAudioContext === "function") {
        return new WebkitPlayer(samplerate, channel);
      } else if (typeof Audio === "function") {
        a = new Audio();
        if ((typeof a.mozSetup === (_ref = typeof a.mozWriteAudio) && _ref === "function")) {
          return new MozPlayer(samplerate, channel);
        }
      } else {
        return null;
      }
    };
  })(pico);
}).call(this);
