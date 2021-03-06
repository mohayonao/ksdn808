(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $(function() {
    var $bpm, $drkit, $filter, $gain, $pitch, $rate, $res, $save_msg, $vol, $voset, BD, BP12, BR12, CAPTION, CLS, COPY, CaptionSet, DEBUG, DEL, DOWN, HH, HP12, IIRFilter, LP12, MOVE, NONE, OFF, ON, PATTERN_SIZE, PI2, RhythmGenerator, RhythmPad, SAMPLERATE, SD, SpectrumViewer, System, UP, Vo, i, rotate_select, sb, sintable, social_url, sys, waveStretch, _ref, _ref2, _ref3;
    PI2 = Math.PI * 2;
    SAMPLERATE = 11025;
    CAPTION = "関西電気保安協会";
    PATTERN_SIZE = 16 * 2;
    CaptionSet = {
      ksdh: "関,西,電,気,保,安,協,会",
      ping: "生,存,戦,りゃ,く"
    };
    DEBUG = 0;
    _ref = [0, 1, 2, 3], HH = _ref[0], SD = _ref[1], BD = _ref[2], Vo = _ref[3];
    _ref2 = [-1, 0, 1, 2, 3], NONE = _ref2[0], LP12 = _ref2[1], HP12 = _ref2[2], BP12 = _ref2[3], BR12 = _ref2[4];
    _ref3 = [0, 1, 2, 3, 4, 5, 6, 7], OFF = _ref3[0], ON = _ref3[1], MOVE = _ref3[2], UP = _ref3[3], DOWN = _ref3[4], COPY = _ref3[5], CLS = _ref3[6], DEL = _ref3[7];
    sintable = (function() {
      var _results;
      _results = [];
      for (i = 0; i < 1024; i++) {
        _results.push(Math.sin(i / 1024 * PI2));
      }
      return _results;
    })();
    RhythmPad = (function() {
      function RhythmPad(sys, id, canvas) {
        var $canvas, c, h, i, isMouseDown, j, mouse, w;
        $canvas = $(canvas);
        this.sys = sys;
        this.id = id;
        this.width = w = canvas.width = $canvas.width();
        this.height = h = canvas.height = $canvas.height();
        this.context = c = canvas.getContext("2d");
        this.pattern = (function() {
          var _results;
          _results = [];
          for (i = 0; 0 <= PATTERN_SIZE ? i < PATTERN_SIZE : i > PATTERN_SIZE; 0 <= PATTERN_SIZE ? i++ : i--) {
            _results.push((function() {
              var _results2;
              _results2 = [];
              for (j = 0; j <= 3; j++) {
                _results2.push(0);
              }
              return _results2;
            })());
          }
          return _results;
        })();
        this.ledIndex = null;
        this.velocity = 0;
        this._cursor = [-1, -1];
        c.font = "20px thin";
        for (i = 0; 0 <= PATTERN_SIZE ? i < PATTERN_SIZE : i > PATTERN_SIZE; 0 <= PATTERN_SIZE ? i++ : i--) {
          this.draw(i);
        }
        mouse = __bind(function(e, mode) {
          var index, offset, type, x, y, _ref4;
          offset = $canvas.offset();
          _ref4 = [e.pageX - offset.left, e.pageY - offset.top], x = _ref4[0], y = _ref4[1];
          h = this.height;
          index = (x / this.width * PATTERN_SIZE) | 0;
          if (y > h - 20) {
            type = BD;
          } else if (y > h - 40) {
            type = SD;
          } else if (y > h - 60) {
            type = HH;
          } else {
            type = Vo;
          }
          this.tap(type, index, mode);
          return this.sys.tapcallback(this.id, index, type, mode);
        }, this);
        $canvas.bind("contextmenu", __bind(function(e) {
          return false;
        }, this));
        isMouseDown = false;
        $canvas.mousedown(__bind(function(e) {
          isMouseDown = true;
          return mouse(e, e.button === 0 ? ON : OFF);
        }, this));
        $canvas.mousemove(__bind(function(e) {
          if (isMouseDown) {
            return mouse(e, MOVE);
          }
        }, this));
        $canvas.mouseup(__bind(function(e) {
          return isMouseDown = false;
        }, this));
      }
      RhythmPad.prototype.clear = function() {
        var i, j, _results;
        this.pattern = (function() {
          var _results;
          _results = [];
          for (i = 0; 0 <= PATTERN_SIZE ? i < PATTERN_SIZE : i > PATTERN_SIZE; 0 <= PATTERN_SIZE ? i++ : i--) {
            _results.push((function() {
              var _results2;
              _results2 = [];
              for (j = 0; j <= 3; j++) {
                _results2.push(0);
              }
              return _results2;
            })());
          }
          return _results;
        })();
        _results = [];
        for (i = 0; 0 <= PATTERN_SIZE ? i < PATTERN_SIZE : i > PATTERN_SIZE; 0 <= PATTERN_SIZE ? i++ : i--) {
          _results.push(this.draw(i));
        }
        return _results;
      };
      RhythmPad.prototype.copy = function(src) {
        var index, type, _results;
        _results = [];
        for (index = 0; 0 <= PATTERN_SIZE ? index < PATTERN_SIZE : index > PATTERN_SIZE; 0 <= PATTERN_SIZE ? index++ : index--) {
          for (type = 0; type <= 3; type++) {
            this.pattern[index][type] = src.pattern[index][type];
          }
          _results.push(this.draw(index));
        }
        return _results;
      };
      RhythmPad.prototype.tap = function(type, index, mode) {
        var val;
        if (type === Vo) {
          switch (mode) {
            case OFF:
              this.pattern[index][type] = 0;
              break;
            case ON:
              this.pattern[index][type] = this.sys.voice + 1;
          }
        } else {
          val = this.pattern[index][type];
          if (val != null) {
            switch (mode) {
              case ON:
                val += 1;
                if (val >= 3) {
                  val = 0;
                }
                this.velocity = val;
                break;
              case OFF:
                val -= 1;
                if (val < 0) {
                  val = 2;
                }
                this.velocity = val;
                break;
              case MOVE:
                val = this.velocity;
            }
            this.pattern[index][type] = val;
          }
        }
        return this.draw(index);
      };
      RhythmPad.prototype.cursor = function(x, y, mode) {
        if (mode === OFF) {
          this._cursor = [-1, -1];
        } else {
          this._cursor = [x, y];
        }
        return this.draw(x);
      };
      RhythmPad.prototype.put = function(x, y, val) {
        this.pattern[x][y] = val;
        return this.draw(x);
      };
      RhythmPad.prototype.draw = function(index) {
        var c, dx, h, size, type, voice, x, y, _i, _len, _ref4, _ref5, _results;
        _ref4 = [this.context, this.height], c = _ref4[0], h = _ref4[1];
        dx = this.width / PATTERN_SIZE;
        x = index * dx;
        c.clearRect(x, 0, dx, h);
        voice = this.pattern[index][Vo];
        if (sys.caption && voice !== 0) {
          c.shadowBlur = 0;
          if (this.ledIndex === index) {
            c.fillStyle = "lightyellow";
          } else {
            c.fillStyle = "gray";
          }
          c.fillText((sys.caption[voice - 1] || "＿")[0], x + 4, 30, dx);
        }
        if (this._cursor[0] === index) {
          switch (this._cursor[1]) {
            case HH:
              y = h - 60;
              break;
            case SD:
              y = h - 40;
              break;
            case BD:
              y = h - 20;
          }
          c.shadowBlur = 0;
          c.fillStyle = "#00c";
          c.fillRect(x + 1, y, dx - 2, 20);
        }
        c.fillStyle = index % 4 === 0 ? "#f66" : "#6f6";
        size = this.ledIndex === index ? [2, 6, 10] : [1, 4, 8];
        c.shadowBlur = 2;
        c.shadowColor = "white";
        _ref5 = [HH, SD, BD];
        _results = [];
        for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
          type = _ref5[_i];
          switch (type) {
            case HH:
              y = h - 50;
              break;
            case SD:
              y = h - 30;
              break;
            case BD:
              y = h - 10;
          }
          c.beginPath();
          c.arc(x + dx / 2, y, size[this.pattern[index][type]], 0, PI2, false);
          c.fill();
          _results.push(c.closePath());
        }
        return _results;
      };
      RhythmPad.prototype.led = function(index, onOff) {
        if (onOff === OFF) {
          this.ledIndex = null;
        } else {
          this.ledIndex = index;
        }
        return this.draw(index);
      };
      return RhythmPad;
    })();
    waveStretch = function(data, len) {
      var i, index1, index2, result, v1, v2;
      if (data.length === len) {
        return data;
      }
      result = [];
      for (i = 0; 0 <= len ? i < len : i > len; 0 <= len ? i++ : i--) {
        index1 = (i / len) * data.length;
        index2 = index1 - (index1 | 0);
        index1 |= 0;
        v1 = data[index1];
        v2 = data[index1 + 1] || 0;
        result[i] = (v1 * (1.0 - index2)) + (v2 * index2);
      }
      return result;
    };
    RhythmGenerator = (function() {
      function RhythmGenerator(sys, player, waves) {
        var i;
        this.sys = sys;
        this.player = player;
        console.log("samplerate: " + player.SAMPLERATE + ", channel: " + player.CHANNEL);
        this._wavData = (function() {
          var _results;
          _results = [];
          for (i = 0; i <= 12; i++) {
            _results.push([0]);
          }
          return _results;
        })();
        this._sample = 0;
        this._sampleCounter = 0;
        this._index = 0;
        this._src = [0, 0, 0, 0];
        this._vol = [2.0, 0, 0, 1.0];
        this._wavlet = [0, this._wavData[SD], this._wavData[BD], 0];
        this._wavIndex = [0, 0, 0, 0];
        this._drumStep = 1.5;
        this._filter = null;
        this._filterIndex = 0;
        this._filterIndexStep = 0;
        this._viewer = null;
        this.chbpm(180);
        this.chvol(8);
        this.chpitch(0);
      }
      RhythmGenerator.prototype.setWaveSet = function(type, set) {
        var b0, b1, bb, binary, data, i, j, lst, stretch, wave, x, _len, _ref4, _results;
        stretch = this.player.SAMPLERATE / SAMPLERATE;
        lst = [];
        for (i = 0, _len = set.length; i < _len; i++) {
          wave = set[i];
          binary = atob(wave);
          data = [];
          for (j = 0, _ref4 = binary.length / 2; 0 <= _ref4 ? j < _ref4 : j > _ref4; 0 <= _ref4 ? j++ : j--) {
            b0 = binary.charCodeAt(j * 2);
            b1 = binary.charCodeAt(j * 2 + 1);
            bb = (b1 << 8) + b0;
            x = bb & 0x8000 ? -((bb ^ 0xFFFF) + 1) : bb;
            data[j] = x / 65535;
          }
          lst[i] = waveStretch(data, (data.length * stretch + 0.5) | 0);
        }
        if (type === "drKit") {
          for (i = 0; i <= 3; i++) {
            this._wavData[i] = lst[i];
          }
          this._wavlet[SD] = this._wavData[SD];
          return this._wavlet[BD] = this._wavData[BD];
        } else {
          _results = [];
          for (i = 4; i <= 12; i++) {
            _results.push(this._wavData[i] = lst[i - 4]);
          }
          return _results;
        }
      };
      RhythmGenerator.prototype.isPlaying = function() {
        return this.player.isPlaying();
      };
      RhythmGenerator.prototype.play = function() {
        console.log("play");
        return this.player.play(this);
      };
      RhythmGenerator.prototype.stop = function() {
        console.log("stop");
        return this.player.stop();
      };
      RhythmGenerator.prototype.setfilter = function(filter) {
        return this._filter = filter;
      };
      RhythmGenerator.prototype.setviewer = function(viewer) {
        return this._viewer = viewer;
      };
      RhythmGenerator.prototype.chfilterrate = function(val) {
        return this._filterIndexStep = val * 1024 / this.player.SAMPLERATE;
      };
      RhythmGenerator.prototype.chbpm = function(val) {
        var interval;
        this.bpm = val;
        interval = (60 / val * 1000) / 4000;
        return this._sampleLimit = this.player.SAMPLERATE * interval;
      };
      RhythmGenerator.prototype.chvol = function(val) {
        return this._vol[Vo] = val / 10;
      };
      RhythmGenerator.prototype.chpitch = function(val) {
        var v;
        if (val < 1) {
          v = 1;
        } else if (val > 5) {
          v = 5;
        }
        this._pitch = val;
        return this._drumStep = [0.75, 0.8, 0.9, 0.95, 1.0, 1.1, 1.2, 1.25, 1.3][val + 4];
      };
      RhythmGenerator.prototype.next = function() {
        var cellsize, cnt, cutoff, i, i2, j, k, m, maxIndex, n, rpads, stream, type, vstream, _drumStep, _filter, _filterIndex, _filterIndexStep, _i, _index, _j, _k, _len, _ref10, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _sample, _sampleLimit, _src, _vol, _wavData, _wavIndex, _wavlet;
        cnt = this.player.STREAM_CELL_COUNT;
        cellsize = this.player.STREAM_CELL_SIZE;
        rpads = this.sys.rpads;
        maxIndex = rpads.length * PATTERN_SIZE;
        _ref4 = [this._index, this._src], _index = _ref4[0], _src = _ref4[1];
        _ref5 = [this._wavlet, this._vol], _wavlet = _ref5[0], _vol = _ref5[1];
        _ref6 = [this._sample, this._sampleLimit], _sample = _ref6[0], _sampleLimit = _ref6[1];
        _ref7 = [this._wavData, this._wavIndex, this._drumStep], _wavData = _ref7[0], _wavIndex = _ref7[1], _drumStep = _ref7[2];
        _ref8 = [this._filter, this._filterIndex, this._filterIndexStep], _filter = _ref8[0], _filterIndex = _ref8[1], _filterIndexStep = _ref8[2];
        i2 = (_index - 1 + maxIndex) % maxIndex;
        m = ((i2 / PATTERN_SIZE) | 0) % rpads.length;
        n = (i2 % PATTERN_SIZE) | 0;
        rpads[m].rhythm.led(n, OFF);
        stream = new Float32Array(cellsize * cnt);
        k = 0;
        for (i = 0; 0 <= cnt ? i < cnt : i > cnt; 0 <= cnt ? i++ : i--) {
          _sample -= cellsize;
          if (_sample <= 0) {
            i2 = (_index + maxIndex) % maxIndex;
            m = ((i2 / PATTERN_SIZE) | 0) % rpads.length;
            n = (i2 % PATTERN_SIZE) | 0;
            _src = rpads[m].rhythm.pattern[n];
            if (_src[HH] === 1) {
              _wavlet[HH] = _wavData[HH];
              _wavIndex[HH] = 0;
            } else if (_src[HH] === 2) {
              _wavlet[HH] = _wavData[3];
              _wavIndex[HH] = 0;
            }
            if (_src[SD]) {
              _vol[SD] = [0, 0.4, 1.0][_src[SD]];
              _wavIndex[SD] = 0;
            }
            if (_src[BD]) {
              _vol[BD] = [0, 0.3, 0.6][_src[BD]];
              _wavIndex[BD] = 0;
            }
            if (_src[Vo] !== 0) {
              _wavlet[Vo] = _wavData[_src[Vo] + 3];
              _wavIndex[Vo] = 0;
            }
            _index = (_index + 1) % maxIndex;
            _sample += _sampleLimit;
          }
          vstream = new Float32Array(cellsize);
          _k = k;
          for (j = 0; 0 <= cellsize ? j < cellsize : j > cellsize; 0 <= cellsize ? j++ : j--) {
            _ref9 = [HH, SD, BD];
            for (_i = 0, _len = _ref9.length; _i < _len; _i++) {
              type = _ref9[_i];
              stream[k] += _wavlet[type][_wavIndex[type] | 0] * _vol[type] || 0.0;
              _wavIndex[type] += _drumStep;
            }
            vstream[j] += _wavlet[Vo][_wavIndex[Vo] | 0] * _vol[Vo] || 0.0;
            _wavIndex[Vo] += 1;
            k += 1;
          }
          if (_filter) {
            _filterIndex += _filterIndexStep;
            if (_filterIndex >= 1024) {
              _filterIndex -= 1024;
            }
            cutoff = sintable[_filterIndex | 0];
            switch (_filter.type) {
              case LP12:
                cutoff = cutoff * 1400 + 2800;
                break;
              case HP12:
                cutoff = cutoff * 900 + 1200;
                break;
              case BP12:
                cutoff = cutoff * 1800 + 2400;
                break;
              case BR12:
                cutoff = cutoff * 800 + 4200;
            }
            _filter.chcutoff(cutoff);
            _filter.process(vstream);
          }
          for (_j = 0; 0 <= cellsize ? _j < cellsize : _j > cellsize; 0 <= cellsize ? _j++ : _j--) {
            stream[_k + _j] += vstream[_j];
          }
        }
        rpads[m].rhythm.led(n, ON);
        for (i = 0, _ref10 = stream.length; 0 <= _ref10 ? i < _ref10 : i > _ref10; 0 <= _ref10 ? i++ : i--) {
          if (stream[i] < -1.0) {
            stream[i] = -1.0;
          } else if (stream[i] > 1.0) {
            stream[i] = 1.0;
          }
        }
        if (this._viewer) {
          this._viewer.draw(stream);
        }
        this._index = _index;
        this._src = _src;
        this._sample = _sample;
        this._filterIndex = _filterIndex;
        return stream;
      };
      return RhythmGenerator;
    })();
    IIRFilter = (function() {
      function IIRFilter(type, samplerate) {
        this.amp = 0.5;
        this.type = type;
        this._f = [0.0, 0.0, 0.0, 0.0];
        this._cutoff = 880;
        this._resonance = 0.1;
        this._freq = 0;
        this._damp = 0;
        this._samplerate = samplerate;
        this._calcCoeff(this._cutoff, this._resonance);
      }
      IIRFilter.prototype.process = function(stream) {
        var amp, i, input, output, type, _damp, _f, _freq, _ref4, _ref5, _results;
        _ref4 = [this._f, this._damp, this._freq, this.type, this.amp], _f = _ref4[0], _damp = _ref4[1], _freq = _ref4[2], type = _ref4[3], amp = _ref4[4];
        if (type !== NONE) {
          _results = [];
          for (i = 0, _ref5 = stream.length; 0 <= _ref5 ? i < _ref5 : i > _ref5; 0 <= _ref5 ? i++ : i--) {
            input = stream[i];
            _f[3] = input - _damp * _f[2];
            _f[0] = _f[0] + _freq * _f[2];
            _f[1] = _f[3] - _f[0];
            _f[2] = _freq * _f[1] + _f[2];
            output = 0.5 * _f[type];
            _f[3] = input - _damp * _f[2];
            _f[0] = _f[0] + _freq * _f[2];
            _f[1] = _f[3] - _f[0];
            _f[2] = _freq * _f[1] + _f[2];
            output += 0.5 * _f[type];
            _results.push(stream[i] = (input * (1.0 - amp)) + (output * amp));
          }
          return _results;
        }
      };
      IIRFilter.prototype.champ = function(val) {
        val /= 10.0;
        if (val < 0.0) {
          val = 0.0;
        } else if (1.0 < val) {
          val = 1.0;
        }
        return this.amp = val;
      };
      IIRFilter.prototype.chtype = function(type) {
        switch (type) {
          case LP12:
            return this.type = LP12;
          case BP12:
            return this.type = BP12;
          case HP12:
            return this.type = HP12;
          case BR12:
            return this.type = BR12;
          default:
            return this.type = NONE;
        }
      };
      IIRFilter.prototype.chcutoff = function(cutoff) {
        this._cutoff = cutoff;
        return this._calcCoeff(this._cutoff, this._resonance);
      };
      IIRFilter.prototype.chres = function(val) {
        this._resonance = val;
        return this._calcCoeff(this._cutoff, this._resonance);
      };
      IIRFilter.prototype._calcCoeff = function(cutoff, resonance) {
        this._freq = 2 * Math.sin(Math.PI * Math.min(0.25, cutoff / (this._samplerate * 2)));
        return this._damp = Math.min(2 * (1 - Math.pow(resonance, 0.25)), Math.min(2, 2 / this._freq - this._freq * 0.5));
      };
      return IIRFilter;
    })();
    SpectrumViewer = (function() {
      function SpectrumViewer(buffersize, samplerate, canvas) {
        var $canvas;
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        $canvas = $(canvas);
        this.width = canvas.width = $canvas.width();
        this.height = canvas.height = $canvas.height();
        this._fft = new FFT(buffersize, samplerate);
        this.context.fillStyle = "white";
        this._count = 0;
      }
      SpectrumViewer.prototype.draw = function(stream) {
        var c, div, fft, h, i, imax, j, jmax, spectrum, v, y, _results;
        fft = this._fft;
        fft.forward(stream);
        h = this.height;
        c = this.context;
        div = fft.sampleRate / 11025 / 2;
        spectrum = fft.spectrum;
        jmax = (spectrum.length / div) / 32;
        imax = spectrum.length / jmax;
        c.fillStyle = "rgba(0, 32, 0, 0.25)";
        c.fillRect(0, 0, this.width, h);
        c.fillStyle = "rgba(224, 255, 224, 0.80)";
        _results = [];
        for (i = 0; 0 <= imax ? i < imax : i > imax; 0 <= imax ? i++ : i--) {
          v = 0;
          for (j = 0; 0 <= jmax ? j < jmax : j > jmax; 0 <= jmax ? j++ : j--) {
            v += spectrum[i * jmax + j];
          }
          y = h * (v * 1.5);
          _results.push(c.fillRect(i * jmax, h - y, jmax - 1, y));
        }
        return _results;
      };
      return SpectrumViewer;
    })();
    System = (function() {
      function System() {
        this.findIndex = __bind(this.findIndex, this);
        var $div, $label, $li, buffersize, i, player, samplerate, scanvas;
        this.edit = $("#edit");
        this.rpads = [];
        this.voice = 0;
        this.index = 0;
        for (i = 0; i <= 8; i++) {
          $div = $(document.createElement("div")).text("").click(__bind(function(i) {
            return __bind(function() {
              return this.putvoice(i, ON, OFF);
            }, this);
          }, this)(i));
          $label = $(document.createElement("span")).text(i + 1 + "");
          $li = $(document.createElement("li"));
          $("#selector").append($li.append($label.append($div)));
        }
        player = pico.getplayer({
          samplerate: SAMPLERATE,
          channel: 1,
          timerpath: "/javascripts/muteki-timer.js"
        });
        if (player) {
          samplerate = player.SAMPLERATE;
          buffersize = player.STREAM_FULL_SIZE;
          this.generator = new RhythmGenerator(this, player, V);
          this.filter = new IIRFilter(NONE, samplerate);
          this.generator.setfilter(this.filter);
          scanvas = document.getElementById("spectrum");
          this.spectrum = new SpectrumViewer(buffersize, samplerate, scanvas);
          this.generator.setviewer(this.spectrum);
        } else {
          $("#play").attr("disabled", true);
        }
      }
      System.prototype.putvoice = function(i, mode, move) {
        var j, li, x, y, _len, _ref4;
        if (i !== -1) {
          this.voice = i;
          _ref4 = $("#selector li div");
          for (j = 0, _len = _ref4.length; j < _len; j++) {
            li = _ref4[j];
            if (i === j) {
              $(li).css("color", "#9f9").css("background", "#393");
            } else {
              $(li).css("color", "#030").css("background", "#363");
            }
          }
        }
        x = (this.index % PATTERN_SIZE) | 0;
        y = (this.index / PATTERN_SIZE) | 0;
        this.rpads[(y / 3) | 0].rhythm.tap(Vo, x, mode);
        if (move) {
          return this.move(1, 0);
        }
      };
      System.prototype.tapcallback = function(id, index, type, mode) {
        var len, x, y;
        len = this.rpads.length * 3;
        x = (this.index % PATTERN_SIZE) | 0;
        y = (this.index / PATTERN_SIZE) | 0;
        if (x < 0) {
          x = PATTERN_SIZE - 1;
          y -= 1;
        }
        if (x >= PATTERN_SIZE) {
          x = 0;
          y += 1;
        }
        if (y < 0) {
          y = len - 1;
        }
        if (y >= len) {
          y = 0;
        }
        this.rpads[(y / 3) | 0].rhythm.cursor(x, y % 3, OFF);
        i = this.findIndex(id);
        if (type === Vo) {
          type = y % 3;
        }
        this.rpads[i].rhythm.cursor(index, type, ON);
        return this.index = type * PATTERN_SIZE + index;
      };
      System.prototype.chbpm = function(val) {
        return this.generator.chbpm(val);
      };
      System.prototype.chvol = function(val) {
        return this.generator.chvol(val);
      };
      System.prototype.chpitch = function(val) {
        return this.generator.chpitch(val);
      };
      System.prototype.chrate = function(val) {
        return this.generator.chfilterrate(val);
      };
      System.prototype.chfilter = function(val) {
        return this.filter.chtype(val);
      };
      System.prototype.chgain = function(val) {
        return this.filter.champ(val);
      };
      System.prototype.chres = function(val) {
        return this.filter.chres(val);
      };
      System.prototype.move = function(dx, dy) {
        var len, x, y;
        len = this.rpads.length * 3;
        x = (this.index % PATTERN_SIZE) | 0;
        y = (this.index / PATTERN_SIZE) | 0;
        if (x < 0) {
          x = PATTERN_SIZE - 1;
          y -= 1;
        }
        if (x >= PATTERN_SIZE) {
          x = 0;
          y += 1;
        }
        if (y < 0) {
          y = len - 1;
        }
        if (y >= len) {
          y = 0;
        }
        this.rpads[(y / 3) | 0].rhythm.cursor(x, y % 3, OFF);
        x += dx;
        y += dy;
        if (x < 0) {
          x = PATTERN_SIZE - 1;
          y -= 1;
        }
        if (x >= PATTERN_SIZE) {
          x = 0;
          y += 1;
        }
        if (y < 0) {
          y = len - 1;
        }
        if (y >= len) {
          y = 0;
        }
        this.rpads[(y / 3) | 0].rhythm.cursor(x, y % 3, ON);
        return this.index = y * PATTERN_SIZE + x;
      };
      System.prototype.put = function(vec) {
        var len, x, y;
        len = this.rpads.length * 3;
        x = (this.index % PATTERN_SIZE) | 0;
        y = (this.index / PATTERN_SIZE) | 0;
        this.rpads[(y / 3) | 0].rhythm.put(x, y % 3, vec);
        return this.move(1, 0);
      };
      System.prototype.play = function() {
        if (this.generator.isPlaying()) {
          this.generator.stop();
          return $("#play").css("color", "#000");
        } else {
          this.generator.play();
          return $("#play").css("color", "#f33");
        }
      };
      System.prototype.add = function() {
        var $ctrl, $div, canvas, id, userAgent;
        if (this.rpads.length >= 8) {
          return -1;
        }
        $div = $(document.createElement("div"));
        userAgent = navigator.userAgent;
        $ctrl = $(document.createElement("div"));
        $ctrl.addClass("ctrl");
        if (userAgent.indexOf("Opera") !== -1) {
          $ctrl.css("margin-top", "-100px");
        }
        id = new Date().getTime();
        $ctrl.append($(document.createElement("button")).text("up").click(__bind(function(id) {
          return __bind(function() {
            return this.operate(UP, id);
          }, this);
        }, this)(id)));
        $ctrl.append($(document.createElement("button")).text("down").click(__bind(function(id) {
          return __bind(function() {
            return this.operate(DOWN, id);
          }, this);
        }, this)(id)));
        $ctrl.append($(document.createElement("button")).text("copy").click(__bind(function(id) {
          return __bind(function() {
            return this.operate(COPY, id);
          }, this);
        }, this)(id)));
        $ctrl.append($(document.createElement("button")).text("cls").click(__bind(function(id) {
          return __bind(function() {
            return this.operate(CLS, id);
          }, this);
        }, this)(id)));
        $ctrl.append($(document.createElement("button")).text("del").click(__bind(function(id) {
          return __bind(function() {
            return this.operate(DEL, id);
          }, this);
        }, this)(id)));
        canvas = document.createElement("canvas");
        this.edit.append($div.append(canvas).append($ctrl));
        this.rpads.push({
          id: id,
          elem: $div,
          rhythm: new RhythmPad(this, id, canvas)
        });
        return id;
      };
      System.prototype.findIndex = function(id) {
        var i, t, _len, _ref4;
        _ref4 = this.rpads;
        for (i = 0, _len = _ref4.length; i < _len; i++) {
          t = _ref4[i];
          if (t.id === id) {
            return i;
          }
        }
      };
      System.prototype.operate = function(type, id) {
        var i2, newid, y, _ref4, _ref5, _ref6;
        if (!(id != null)) {
          y = (this.index / PATTERN_SIZE) | 0;
          id = this.rpads[(y / 3) | 0].id;
        }
        i = this.findIndex(id);
        switch (type) {
          case UP:
            if (i > 0) {
              this.rpads[i - 1].elem.before(this.rpads[i].elem);
              [].splice.apply(this.rpads, [(_ref4 = i - 1), i - _ref4 + 1].concat(_ref5 = [this.rpads[i], this.rpads[i - 1]])), _ref5;
              this.index += PATTERN_SIZE * 3;
            }
            break;
          case DOWN:
            if (i < this.rpads.length - 1) {
              this.rpads[i + 1].elem.after(this.rpads[i].elem);
              [].splice.apply(this.rpads, [i, i + 1 - i + 1].concat(_ref6 = [this.rpads[i + 1], this.rpads[i]])), _ref6;
              this.index -= PATTERN_SIZE * 3;
            }
            break;
          case COPY:
            newid = this.add();
            if (newid !== -1) {
              i2 = this.findIndex(newid);
              this.rpads[i2].rhythm.copy(this.rpads[i].rhythm);
            }
            break;
          case CLS:
            if (i != null) {
              this.rpads[i].rhythm.clear();
            }
            break;
          case DEL:
            if (this.rpads.length > 1) {
              this.rpads[i].elem.remove();
              if (i != null) {
                this.rpads.splice(i, 1);
              }
            } else {
              this.rpads[0].rhythm.clear();
            }
        }
        if (this.index > this.rpads.length * PATTERN_SIZE * 3) {
          return this.index -= this.rpads.length * PATTERN_SIZE * 3;
        } else if (this.index < 0) {
          return this.index += this.rpads.length * PATTERN_SIZE * 3;
        }
      };
      System.prototype.save = function() {
        var dict, p, _ref4, _ref5, _ref6;
        dict = {
          pattern: (function() {
            var _i, _len, _ref4, _results;
            _ref4 = this.rpads;
            _results = [];
            for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
              p = _ref4[_i];
              _results.push(p.rhythm.pattern);
            }
            return _results;
          }).call(this),
          bpm: $bpm.slider("value"),
          voset: (_ref4 = $voset.val()) != null ? _ref4 : "ksdh",
          drkit: (_ref5 = $drkit.val()) != null ? _ref5 : "tr808",
          vol: $vol.slider("value"),
          pitch: $pitch.slider("value"),
          filter: (_ref6 = $filter.val()) != null ? _ref6 : NONE,
          gain: $gain.slider("value"),
          rate: $rate.slider("value"),
          res: $res.slider("value")
        };
        $save_msg.val("now saving...");
        return $.post("/", {
          data: JSON.stringify(dict)
        }, function(res) {
          var url;
          url = "http://" + location.host + "/" + res;
          return $save_msg.val(url);
        });
      };
      System.prototype.load = function(id) {
        return $.get("/load/" + id, __bind(function(res) {
          var data, i, j, p, _ref4, _ref5, _ref6, _ref7, _results;
          if (!res) {
            return $save_msg.val("no data");
          } else {
            data = JSON.parse(res);
            console.log(data);
            if (data.bpm) {
              $bpm.slider("value", data.bpm);
            }
            if (data.voset) {
              $voset.val((_ref4 = data.voset) != null ? _ref4 : "ksdh");
            }
            if (data.drkit) {
              $drkit.val((_ref5 = data.drkit) != null ? _ref5 : "tr808");
            }
            if (data.vol) {
              $vol.slider("value", data.vol);
            }
            if (data.pitch) {
              $pitch.slider("value", data.vol);
            }
            if (data.filter) {
              $filter.val((_ref6 = data.filter) != null ? _ref6 : NONE);
            }
            if (data.gain) {
              $gain.slider("value", data.gain);
            }
            if (data.rate) {
              $rate.slider("value", data.rate);
            }
            if (data.res) {
              $res.slider("value", data.res);
            }
            $voset.change();
            $drkit.change();
            $filter.change();
            if (!data.pattern) {
              return $save_msg.val("no data");
            } else {
              _results = [];
              for (i = 0, _ref7 = data.pattern.length; 0 <= _ref7 ? i < _ref7 : i > _ref7; 0 <= _ref7 ? i++ : i--) {
                if (i === 0) {
                  p = this.rpads[0];
                } else {
                  this.add();
                  p = this.rpads[i];
                }
                p.rhythm.pattern = data.pattern[i];
                _results.push((function() {
                  var _results2;
                  _results2 = [];
                  for (j = 0; 0 <= PATTERN_SIZE ? j < PATTERN_SIZE : j > PATTERN_SIZE; 0 <= PATTERN_SIZE ? j++ : j--) {
                    _results2.push(p.rhythm.draw(j));
                  }
                  return _results2;
                })());
              }
              return _results;
            }
          }
        }, this));
      };
      System.prototype.setwave = function(type, name) {
        var data, item_name, voput;
        item_name = "" + type + "-" + name;
        data = localStorage.getItem(item_name);
        voput = __bind(function() {
          var caps, div, i, p, _i, _len, _len2, _ref4, _ref5, _results;
          if (type === "voSet") {
            caps = CaptionSet[name].split(",");
            _ref4 = $("#selector li div");
            for (i = 0, _len = _ref4.length; i < _len; i++) {
              div = _ref4[i];
              $(div).text(caps[i] || "_");
            }
            this.caption = caps;
            _ref5 = this.rpads;
            _results = [];
            for (_i = 0, _len2 = _ref5.length; _i < _len2; _i++) {
              p = _ref5[_i];
              _results.push((function() {
                var _results2;
                _results2 = [];
                for (i = 0; 0 <= PATTERN_SIZE ? i < PATTERN_SIZE : i > PATTERN_SIZE; 0 <= PATTERN_SIZE ? i++ : i--) {
                  _results2.push(p.rhythm.draw(i));
                }
                return _results2;
              })());
            }
            return _results;
          }
        }, this);
        if (data != null) {
          this.generator.setWaveSet(type, JSON.parse(data));
          return voput();
        } else {
          return $.get("/wave/" + type + "/" + name, __bind(function(res) {
            localStorage.setItem(item_name, res);
            this.generator.setWaveSet(type, JSON.parse(res));
            return voput();
          }, this));
        }
      };
      System.prototype.initpattern = function() {
        var i, r;
        r = this.rpads[0].rhythm;
        r.pattern[0][Vo] = 1;
        r.pattern[4][Vo] = 2;
        r.pattern[10][Vo] = 3;
        r.pattern[14][Vo] = 4;
        r.pattern[16][Vo] = 5;
        r.pattern[20][Vo] = 6;
        r.pattern[24][Vo] = 7;
        r.pattern[28][Vo] = 8;
        for (i = 0; 0 <= PATTERN_SIZE ? i < PATTERN_SIZE : i > PATTERN_SIZE; 0 <= PATTERN_SIZE ? i++ : i--) {
          r.draw(i);
        }
        $voset.val("ksdh").change();
        return $drkit.val("tr808").change();
      };
      return System;
    })();
    sys = new System();
    $save_msg = $("#save-msg");
    $("#play").click(function() {
      return sys.play();
    });
    $("#add").click(function() {
      return sys.add();
    });
    $("#options").click(function() {
      return $("#options-panel").slideToggle("fast");
    });
    $("#save").click(function() {
      return sys.save();
    });
    $bpm = $("#bpm").slider({
      min: 60,
      max: 300,
      value: 180,
      step: 1
    }, {
      change: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#bpm-val").text(val);
        return sys.chbpm(val);
      },
      slide: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#bpm-val").text(val);
        return sys.chbpm(val);
      }
    });
    $voset = $('#vocal-set').change(function(e) {
      return sys.setwave("voSet", $voset.val());
    });
    $drkit = $('#drum-kit').change(function(e) {
      return sys.setwave("drKit", $drkit.val());
    });
    $vol = $("#vol").slider({
      min: 0,
      max: 10,
      value: 8,
      step: 1
    }, {
      change: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#vol-val").text(val);
        return sys.chvol(val);
      },
      slide: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#vol-val").text(val);
        return sys.chvol(val);
      }
    });
    $pitch = $("#pitch").slider({
      min: -4,
      max: 4,
      value: 0,
      step: 1
    }, {
      change: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#pitch-val").text(val);
        return sys.chpitch(val);
      },
      slide: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#pitch-val").text(val);
        return sys.chpitch(val);
      }
    });
    $filter = $("#filter").change(function(e) {
      return sys.chfilter($filter.val() | 0);
    });
    $gain = $("#gain").slider({
      min: 0,
      max: 10,
      value: 4,
      step: 1
    }, {
      change: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#gain-val").text(val);
        return sys.chgain(val);
      },
      slide: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#gain-val").text(val);
        return sys.chgain(val);
      }
    });
    $rate = $("#rate").slider({
      min: 0,
      max: 100,
      value: 1,
      step: 2
    }, {
      change: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#rate-val").text(val);
        return sys.chrate(val);
      },
      slide: function(e, ui) {
        var val;
        val = ui.value | 0;
        $("#rate-val").text(val);
        return sys.chrate(val);
      }
    });
    $res = $("#res").slider({
      min: 0,
      max: 1,
      value: 0.1,
      step: 0.01
    }, {
      change: function(e, ui) {
        var val;
        val = Number(ui.value);
        $("#res-val").text(val);
        return sys.chres(val);
      },
      slide: function(e, ui) {
        var val;
        val = Number(ui.value);
        $("#res-val").text(val);
        return sys.chres(val);
      }
    });
    rotate_select = function(target) {
      var change, current_value, find, o, _i, _len, _ref4, _ref5;
      current_value = target.val();
      _ref4 = [false, false], find = _ref4[0], change = _ref4[1];
      _ref5 = $("option", target);
      for (_i = 0, _len = _ref5.length; _i < _len; _i++) {
        o = _ref5[_i];
        if (find) {
          target.val($(o).val());
          change = true;
          break;
        }
        if ($(o).val() === current_value) {
          find = true;
        }
      }
      if (!change) {
        target.val($("option:first", target).val());
      }
      return target.change();
    };
    $(document).keydown(function(e) {
      if (e.ctrlKey || e.metaKey) {
        return;
      }
      switch (e.keyCode) {
        case " ".charCodeAt(0):
          sys.play();
          break;
        case "1".charCodeAt(0):
        case "2".charCodeAt(0):
        case "3".charCodeAt(0):
        case "4".charCodeAt(0):
        case "5".charCodeAt(0):
        case "7".charCodeAt(0):
        case "6".charCodeAt(0):
        case "8".charCodeAt(0):
        case "9".charCodeAt(0):
          sys.putvoice(e.keyCode - "1".charCodeAt(0), ON, ON);
          break;
        case "0".charCodeAt(0):
          sys.putvoice(-1, OFF, ON);
          break;
        case "X".charCodeAt(0):
          sys.operate(CLS);
          break;
        case "C".charCodeAt(0):
          sys.operate(COPY);
          break;
        case "V".charCodeAt(0):
          sys.operate(DOWN);
          break;
        case "B".charCodeAt(0):
          sys.operate(UP);
          break;
        case 8:
        case 46:
          sys.operate(DEL);
          break;
        case "Q".charCodeAt(0):
          $bpm.slider("value", $bpm.slider("value") - 5);
          break;
        case "W".charCodeAt(0):
          $bpm.slider("value", $bpm.slider("value") + 5);
          break;
        case "E".charCodeAt(0):
          $vol.slider("value", $vol.slider("value") - 1);
          break;
        case "R".charCodeAt(0):
          $vol.slider("value", $vol.slider("value") + 1);
          break;
        case "T".charCodeAt(0):
          $gain.slider("value", $gain.slider("value") - 1);
          break;
        case "Y".charCodeAt(0):
          $gain.slider("value", $gain.slider("value") + 1);
          break;
        case "U".charCodeAt(0):
          $rate.slider("value", $rate.slider("value") - 2);
          break;
        case "I".charCodeAt(0):
          $rate.slider("value", $rate.slider("value") + 2);
          break;
        case "O".charCodeAt(0):
          $res.slider("value", $res.slider("value") - 0.05);
          break;
        case "P".charCodeAt(0):
          $res.slider("value", $res.slider("value") + 0.05);
          break;
        case "F".charCodeAt(0):
          rotate_select($filter);
          break;
        case "H".charCodeAt(0):
        case 37:
          sys.move(-1, 0);
          break;
        case "L".charCodeAt(0):
        case 39:
          sys.move(+1, 0);
          break;
        case "K".charCodeAt(0):
        case 38:
          sys.move(0, -1);
          break;
        case "J".charCodeAt(0):
        case 40:
          sys.move(0, +1);
          break;
        case "A".charCodeAt(0):
          sys.put(0);
          break;
        case "S".charCodeAt(0):
          sys.put(1);
          break;
        case "D".charCodeAt(0):
          sys.put(2);
          break;
        case "Z".charCodeAt(0):
          $("#options").click();
          break;
        case "N".charCodeAt(0):
          if (e.shiftKey) {
            $("#add").click();
          }
          break;
        default:
          console.log("??", e.keyCode, e);
      }
      return e.preventDefault();
    });
    social_url = "http://ksdn808.herokuapp.com/";
    sb = $("#social-button");
    $(".hatena", sb).socialbutton("hatena", {
      button: "horizontal",
      url: social_url
    });
    $(".tweet", sb).socialbutton("twitter", {
      button: "horizontal",
      lang: "en",
      url: social_url
    });
    $(".google_plus", sb).socialbutton("google_plusone", {
      button: "medium",
      count: false,
      url: social_url
    });
    $(".facebook", sb).socialbutton("facebook_like", {
      button: "button_count",
      url: social_url
    });
    sys.add();
    sys.move(0, 0);
    $("#selector li:first div").click();
    return setTimeout(function() {
      var id;
      id = location.pathname.substr(1);
      if (id) {
        return sys.load(id);
      } else {
        return sys.initpattern();
      }
    }, 500);
  });
}).call(this);
