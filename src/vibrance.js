'use strict';

(function(root, name, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root[name] = factory();
  }
}(this, 'Vibrance', function() {
  var Color = function(v1, v2, v3, v4) {
    if (this instanceof Color) {
      if (v2 !== undefined || v3 !== undefined || v4 !== undefined) {
        this.rgb(v1, v2, v3, v4);
      } else
      if (typeof v1 == 'object') {
        if ('red' in v1 || 'r' in v1) {
          this.rgb(v1);
        } else {
          this.hsl(v1);
        }
      } else {
        this.fromString(v1);
      }
    } else {
      return new Color(v1, v2, v3, v4);
    }
  }

  Color.prototype.format = 'hex';
  Color.prototype.alpha = 1;

  Color.prototype.getComponent = function(hue) {
    if (this.saturation == 0) {
      return this.lightness;
    } else {
      var q = this.lightness < 0.5 ?
        this.lightness * (1 + this.saturation) :
        this.lightness + this.saturation - this.lightness * this.saturation;
      var p = 2 * this.lightness - q;
      var t = this.hue - (hue - 120) / 360;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
  }

  Color.prototype.fromString = function(value) {
    if (value[0] == '#') { // Hex
      var r = (value.length < 6) ?
        parseInt(value[1] + value[1], 16) :
        parseInt(value[1] + value[2], 16);
      var g = (value.length < 6) ?
        parseInt(value[2] + value[2], 16) :
        parseInt(value[3] + value[4], 16);
      var b = (value.length < 6) ?
        parseInt(value[3] + value[3], 16) :
        parseInt(value[5] + value[6], 16);
      if (value.length == 5 || value.length == 9) {
        this.alpha = (value.length < 6) ?
          (parseInt(value[4] + value[4], 16) / 255) :
          (parseInt(value[7] + value[8], 16) / 255);
      }
      this.rgb(r / 255, g / 255, b / 255);
    } else
    if (value.indexOf('(') > 0) {
      var format = value.substr(0, value.indexOf('(')).toLowerCase();
      value = value.substring(value.indexOf('(') + 1, value.lastIndexOf(')')).split(',');
      if (format.substr(-1) == 'a') {
        this._data['alpha'] = parseInt(value[3], 10) /
          (value[3].substr(-1) == '%' ? 100 : 1);
        format = format.substr(0, format.length - 1);
      }
      if (format == 'rgb') {
        this.rgb(
          parseInt(value[0], 10) / (value[0].substr(-1) == '%' ? 100 : 255),
          parseInt(value[1], 10) / (value[1].substr(-1) == '%' ? 100 : 255),
          parseInt(value[2], 10) / (value[2].substr(-1) == '%' ? 100 : 255)
        );
      } else
      if (format == 'hsl') {
        this.hue =
          parseInt(value[0], 10) / (value[0].substr(-1) == '%' ? 100 : 360);
        this.saturation =
          parseInt(value[0], 10) / (value[0].substr(-1) == '%' ? 100 : 1);
        this.lightness =
          parseInt(value[0], 10) / (value[0].substr(-1) == '%' ? 100 : 1);
      }
    }
  }

  Color.prototype.hsla = Color.prototype.hsl = function(h, s, l, a) {
    if (arguments.length == 0) {
      // Getter
      return [this.hue, this.saturation, this.lightness, this.alpha];
    } else
    if (s === undefined && l === undefined && a === undefined) {
      if (h instanceof Array) {
        a = h[3];
        l = h[2];
        s = h[1];
        h = h[0];
      } else {
        a = h.alpha || h.a;
        l = h.lightness || h.l;
        s = h.saturation || h.s;
        h = h.hue || h.h;
      }
    }

    this.hue = h;
    this.saturation = s;
    this.lightness = l;

    if (a !== undefined) {
      this.alpha = a;
    }
  }

  Color.prototype.rgba = Color.prototype.rgb = function(r, g, b, a) {
    if (arguments.length == 0) {
      // Getter
      return [this.getComponent(0), this.getComponent(120), this.getComponent(240), this.alpha];
    } else
    if (g === undefined && b === undefined && a === undefined) {
      if (r instanceof Array) {
        a = r[3] === undefined ? undefined : (r[3] / 255);
        b = r[2] / 255;
        g = r[1] / 255;
        r = r[0] / 255;
      } else {
        a = r.alpha || r.a;
        b = r.blue || r.b;
        g = r.green || r.g;
        r = r.red || r.r;
      }
    } else
    if (b === undefined && a === undefined) { // [xx, xx, .., r, g, b, a, .., xx, xx], offset
      var offset = g;
      a = r[offset + 3] === undefined ? undefined : (r[offset + 3] / 255);
      b = r[offset + 2] / 255;
      g = r[offset + 1] / 255;
      r = r[offset + 0] / 255;
    }

    if (a !== undefined) {
      this.alpha = a;
    }

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    this.hue = h;
    this.saturation = s;
    this.lightness = l;
  }

  Color.prototype.lighter = function(offset) {
    return new Color({ h: this.hue, s: this.saturation, l: Math.min(1, this.lightness + (offset === undefined ? 0.2 : offset)), a: this.alpha });
  }

  Color.prototype.darker = function(offset) {
    return new Color({ h: this.hue, s: this.saturation, l: Math.max(0, this.lightness - (offset === undefined ? 0.2 : offset)), a: this.alpha });
  }

  Color.prototype.saturate = function(offset) {
    return new Color({ h: this.hue, s: Math.min(1, this.saturation + (offset === undefined ? 0.2 : offset)), l: this.lightness, a: this.alpha });
  }

  Color.prototype.desaturate = function(offset) {
    return new Color({ h: this.hue, s: Math.max(0, this.saturation - (offset === undefined ? 0.2 : offset)), l: this.lightness, a: this.alpha });
  }

  Color.prototype.invert = function(offset) {
    var hue = this.hue + 0.5;
    if (hue > 1) {
      hue -= 1;
    }
    return new Color({ h: hue, s: this.saturation, l: 1 - this.lightness, a: this.alpha });
  }

  Color.prototype.rotate = function(offset) {
    var hue = this.hue + (offset === undefined ? 0.0833333 : offset);
    if (hue > 1) {
      hue -= 1;
    } else
    if (hue < 0) {
      hue += 1;
    }
    return new Color({ h: hue, s: this.saturation, l: this.lightness, a: this.alpha });
  }

  Color.prototype.toString = function(format) {
    if (format === undefined) {
      format = this.format;
    }
    switch (format) {
      case 'rgb':
      case 'RGB':
      case 'rgba':
      case 'RGBA':
        var r = ((this.getComponent(0) * 255)|0).toString(10);
        var g = ((this.getComponent(120) * 255)|0).toString(10);
        var b = ((this.getComponent(240) * 255)|0).toString(10);
        var a = this.alpha.toString(10);
        return format + '(' + r + ', ' + g + ', ' + b +
          (format == 'rgba' || format == 'RGBA' ? ', ' + a : '') + ')';
      case 'hsl':
      case 'HSL':
      case 'hsla':
      case 'HSLA':
        var h = ((this.hue * 360)|0).toString(10);
        var s = (((this.saturation * 1000)|0) / 10).toString(10);
        var l = (((this.lightness * 1000)|0) / 10).toString(10);
        var a = (((this.alpha * 100)|0) / 100).toString(10);
        return format + '(' + h + ', ' + s + '%, ' + l + '%' +
          (format == 'hsla' || format == 'HSLA' ? ', ' + a : '') + ')';
      case 'hex':
      case 'HEX':
      case 'hexa':
      case 'HEXA':
      default:
        var r = ((this.getComponent(0) * 255)|0).toString(16);
        var g = ((this.getComponent(120) * 255)|0).toString(16);
        var b = ((this.getComponent(240) * 255)|0).toString(16);
        var a = ((this.alpha * 255)|0).toString(16);
        var res = '#' +
          (r.length < 2 ? '0' : '') + r +
          (g.length < 2 ? '0' : '') + g +
          (b.length < 2 ? '0' : '') + b +
          (format == 'hexa' || format == 'HEXA' ? (a.length < 2 ? '0' : '') + a : '');
        return (format == 'HEXA' || format == 'HEX') ? res.toUpperCase() : res;
    }
  }

  Color.prototype.log = function() {
    console.log('%c           \n  ' + this.toString('HEX') + '  \n           ', 'background: ' + this.toString('HEX') + '; color: #000; text-shadow: 1px 1px #fff, -1px -1px #fff, -1px 1px #fff, 1px -1px #fff');
  }

  Color.lighter = function(rgb, amount, offset) {
    amount = (amount * 255)|0;
    offset = offset || 0;
    rgb[offset] = (rgb[offset] + amount) <= 255 ? rgb[offset] + amount : 255;
    rgb[offset + 1] = (rgb[offset + 1] + amount) <= 255 ? rgb[offset + 1] + amount : 255;
    rgb[offset + 2] = (rgb[offset + 2] + amount) <= 255 ? rgb[offset + 2] + amount : 255;
  }

  Color.darker = function(rgb, amount, offset) {
    amount = (amount * 255)|0;
    offset = offset || 0;
    rgb[offset] = rgb[offset] >= amount ? rgb[offset] - amount : 0;
    rgb[offset + 1] = rgb[offset + 1] >= amount ? rgb[offset + 1] - amount : 0;
    rgb[offset + 2] = rgb[offset + 2] >= amount ? rgb[offset + 2] - amount : 0;
  }

  Color.invert = function(rgb, offset) {
    offset = offset || 0;
    rgb[offset] = 255 - rgb[offset];
    rgb[offset + 1] = 255 - rgb[offset + 1];
    rgb[offset + 2] = 255 - rgb[offset + 2];
  }

  var Picture = function(image, w, h) {
    if (this instanceof Picture) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width = w || image.width;
      this.canvas.height = this.height = h || image.height;
      var gl = this.gl = this.canvas.getContext('experimental-webgl', { premultipliedAlpha: false });
      this.image = image;
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      this.vertexBuffer = gl.createBuffer();

      var texCoordBuffer = this.texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

      var program = this.program = gl.createProgram();
      var vshader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vshader, '\
        attribute vec2 vertex;\
        attribute vec2 _texCoord;\
        varying vec2 texCoord;\
        void main() {\
            texCoord = _texCoord;\
            gl_Position = vec4(vertex, 0.0, 1.0);\
        }'
      );
      gl.compileShader(vshader);
      gl.attachShader(program, vshader);

      var fshader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fshader, 'precision highp float;\
        uniform sampler2D texture;\
        uniform float hueOffset;\
        uniform float saturationOffset;\
        uniform float lightnessOffset;\
        varying vec2 texCoord;\
        vec3 rgb2hsl(vec3 c)\
        {\
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\
          float d = q.x - min(q.w, q.y);\
          float e = 1.0e-10;\
          float s = d / (q.x + e);\
          float l = (2.0 - s) * q.x / 2.0;\
          s = (l > 0.0 && l < 1.0) ? s * q.x / (l < 0.5 ? l * 2.0 : (2.0 - l * 2.0)) : s;\
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), s, l);\
        }\
        vec3 hsl2rgb(vec3 c)\
        {\
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\
          float t = c.y * (c.z < 0.5 ? c.z : 1.0 - c.z);\
          float b = c.z + t;\
          c.y = b > 0.0 ? 2.0 * t / b : c.y;\
          c.z = b;\
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\
        }\
        void main() {\
          vec4 color = texture2D(texture, texCoord);\
          vec3 hsl = rgb2hsl(color.rgb);\
          hsl.x = mod(hsl.x + hueOffset, 1.0);\
          hsl.y = clamp(hsl.y + saturationOffset, 0.0, 1.0);\
          hsl.z = clamp(hsl.z + lightnessOffset, 0.0, 1.0);\
          gl_FragColor = vec4(hsl2rgb(hsl), color.w);\
        }\
      ');
      gl.compileShader(fshader);
      gl.attachShader(program, fshader);
      var compilationLog = gl.getShaderInfoLog(fshader);
      console.log('Shader compiler log: ' + compilationLog);

      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('link error: ' + gl.getProgramInfoLog(program));
      }

      this.textureLocation = gl.getUniformLocation(program, 'texture');
      this.hueLocation = gl.getUniformLocation(program, 'hueOffset');
      this.saturationLocation = gl.getUniformLocation(program, 'saturationOffset');
      this.lightnessLocation = gl.getUniformLocation(program, 'lightnessOffset');

      this.vertexAttribute = gl.getAttribLocation(program, 'vertex');
      gl.enableVertexAttribArray(this.vertexAttribute);

      this.texCoordAttribute = gl.getAttribLocation(program, '_texCoord');
      gl.enableVertexAttribArray(this.texCoordAttribute);

      gl.clearColor(1.0, 1.0, 1.0, 1.0);

      this.hueOffset = 0;
      this.saturationOffset = 0;
      this.lightnessOffset = 0;

    } else {
      return new Picture(image, w, h);
    }
  }

  Picture.prototype.lighter = function(offset) {
    this.lightnessOffset += (offset === undefined) ? 0.2 : offset;
  }

  Picture.prototype.darker = function(offset) {
    this.lightnessOffset -= (offset === undefined) ? 0.2 : offset;
  }

  Picture.prototype.saturate = function(offset) {
    this.saturationOffset += (offset === undefined) ? 0.2 : offset;
  }

  Picture.prototype.desaturate = function(offset) {
    this.saturationOffset -= (offset === undefined) ? 0.2 : offset;
  }

  Picture.prototype.rotate = function(offset) {
    this.hueOffset += (offset === undefined) ? 0.1666666 : offset;
  }

  Picture.prototype.reset = function() {
    this.lightnessOffset = 0;
    this.saturationOffset = 0;
    this.hueOffset = 0;
  }

  Picture.prototype.update = function() {
    var gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    gl.useProgram(this.program);
    gl.uniform1i(this.textureLocation, 0);
    gl.uniform1f(this.hueLocation, this.hueOffset);
    gl.uniform1f(this.saturationLocation, this.saturationOffset);
    gl.uniform1f(this.lightnessLocation, this.lightnessOffset);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.vertexAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(this.texCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this;
  }

  Picture.prototype.toArrayBuffer = function() {
    var gl = this.gl;
    this.update();
    var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels;
  }

  Picture.prototype.toCanvas = function() {
    this.update();
    return this.canvas;
  }

  Picture.prototype.toGLContext = function() {
    this.update();
    return this.gl;
  }

  return {
    Color: Color,
    Picture: Picture
  }
}));
