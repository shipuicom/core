// @ts-nocheck
// vscode-oniguruma v2.0.1 release/main.js (MIT, see LICENSE.txt), converted from UMD
// to an ES module with esbuild so ng-packagr compiles and bundles it. Do not edit;
// see ../README.md for how to regenerate.
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// vscode-oniguruma/main.js
var require_main = __commonJS({
  "vscode-oniguruma/main.js"(exports, module) {
    !function(e, t) {
      "object" == typeof exports && "object" == typeof module ? module.exports = t() : "function" == typeof define && define.amd ? define([], t) : "object" == typeof exports ? exports.onig = t() : e.onig = t();
    }(exports, () => {
      return e = { 770: function(e2, t2, n) {
        "use strict";
        var r = this && this.__importDefault || function(e3) {
          return e3 && e3.__esModule ? e3 : { default: e3 };
        };
        Object.defineProperty(t2, "__esModule", { value: true }), t2.setDefaultDebugCall = t2.createOnigScanner = t2.createOnigString = t2.loadWASM = t2.OnigScanner = t2.OnigString = void 0;
        const i = r(n(418));
        let o = null, a = false;
        class s {
          static _utf8ByteLength(e3) {
            let t3 = 0;
            for (let n2 = 0, r2 = e3.length; n2 < r2; n2++) {
              const i2 = e3.charCodeAt(n2);
              let o2 = i2, a2 = false;
              if (i2 >= 55296 && i2 <= 56319 && n2 + 1 < r2) {
                const t4 = e3.charCodeAt(n2 + 1);
                t4 >= 56320 && t4 <= 57343 && (o2 = 65536 + (i2 - 55296 << 10) | t4 - 56320, a2 = true);
              }
              t3 += o2 <= 127 ? 1 : o2 <= 2047 ? 2 : o2 <= 65535 ? 3 : 4, a2 && n2++;
            }
            return t3;
          }
          constructor(e3) {
            const t3 = e3.length, n2 = s._utf8ByteLength(e3), r2 = n2 !== t3, i2 = r2 ? new Uint32Array(t3 + 1) : null;
            r2 && (i2[t3] = n2);
            const o2 = r2 ? new Uint32Array(n2 + 1) : null;
            r2 && (o2[n2] = t3);
            const a2 = new Uint8Array(n2);
            let f2 = 0;
            for (let n3 = 0; n3 < t3; n3++) {
              const s2 = e3.charCodeAt(n3);
              let u2 = s2, c2 = false;
              if (s2 >= 55296 && s2 <= 56319 && n3 + 1 < t3) {
                const t4 = e3.charCodeAt(n3 + 1);
                t4 >= 56320 && t4 <= 57343 && (u2 = 65536 + (s2 - 55296 << 10) | t4 - 56320, c2 = true);
              }
              r2 && (i2[n3] = f2, c2 && (i2[n3 + 1] = f2), u2 <= 127 ? o2[f2 + 0] = n3 : u2 <= 2047 ? (o2[f2 + 0] = n3, o2[f2 + 1] = n3) : u2 <= 65535 ? (o2[f2 + 0] = n3, o2[f2 + 1] = n3, o2[f2 + 2] = n3) : (o2[f2 + 0] = n3, o2[f2 + 1] = n3, o2[f2 + 2] = n3, o2[f2 + 3] = n3)), u2 <= 127 ? a2[f2++] = u2 : u2 <= 2047 ? (a2[f2++] = 192 | (1984 & u2) >>> 6, a2[f2++] = 128 | (63 & u2) >>> 0) : u2 <= 65535 ? (a2[f2++] = 224 | (61440 & u2) >>> 12, a2[f2++] = 128 | (4032 & u2) >>> 6, a2[f2++] = 128 | (63 & u2) >>> 0) : (a2[f2++] = 240 | (1835008 & u2) >>> 18, a2[f2++] = 128 | (258048 & u2) >>> 12, a2[f2++] = 128 | (4032 & u2) >>> 6, a2[f2++] = 128 | (63 & u2) >>> 0), c2 && n3++;
            }
            this.utf16Length = t3, this.utf8Length = n2, this.utf16Value = e3, this.utf8Value = a2, this.utf16OffsetToUtf8 = i2, this.utf8OffsetToUtf16 = o2;
          }
          createString(e3) {
            const t3 = e3._omalloc(this.utf8Length);
            return e3.HEAPU8.set(this.utf8Value, t3), t3;
          }
        }
        class f {
          constructor(e3) {
            if (this.id = ++f.LAST_ID, !o) throw new Error("Must invoke loadWASM first.");
            this._onigBinding = o, this.content = e3;
            const t3 = new s(e3);
            this.utf16Length = t3.utf16Length, this.utf8Length = t3.utf8Length, this.utf16OffsetToUtf8 = t3.utf16OffsetToUtf8, this.utf8OffsetToUtf16 = t3.utf8OffsetToUtf16, this.utf8Length < 1e4 && !f._sharedPtrInUse ? (f._sharedPtr || (f._sharedPtr = o._omalloc(1e4)), f._sharedPtrInUse = true, o.HEAPU8.set(t3.utf8Value, f._sharedPtr), this.ptr = f._sharedPtr) : this.ptr = t3.createString(o);
          }
          convertUtf8OffsetToUtf16(e3) {
            return this.utf8OffsetToUtf16 ? e3 < 0 ? 0 : e3 > this.utf8Length ? this.utf16Length : this.utf8OffsetToUtf16[e3] : e3;
          }
          convertUtf16OffsetToUtf8(e3) {
            return this.utf16OffsetToUtf8 ? e3 < 0 ? 0 : e3 > this.utf16Length ? this.utf8Length : this.utf16OffsetToUtf8[e3] : e3;
          }
          dispose() {
            this.ptr === f._sharedPtr ? f._sharedPtrInUse = false : this._onigBinding._ofree(this.ptr);
          }
        }
        t2.OnigString = f, f.LAST_ID = 0, f._sharedPtr = 0, f._sharedPtrInUse = false;
        class u {
          constructor(e3, t3) {
            var n2, r2;
            if (!o) throw new Error("Must invoke loadWASM first.");
            const i2 = [], a2 = [];
            for (let t4 = 0, n3 = e3.length; t4 < n3; t4++) {
              const n4 = new s(e3[t4]);
              i2[t4] = n4.createString(o), a2[t4] = n4.utf8Length;
            }
            const f2 = o._omalloc(4 * e3.length);
            o.HEAPU32.set(i2, f2 / 4);
            const u2 = o._omalloc(4 * e3.length);
            o.HEAPU32.set(a2, u2 / 4), this._onigBinding = o, this._options = null !== (n2 = null == t3 ? void 0 : t3.options) && void 0 !== n2 ? n2 : [10];
            const c2 = this.onigOptions(this._options), _2 = this.onigSyntax(null !== (r2 = null == t3 ? void 0 : t3.syntax) && void 0 !== r2 ? r2 : 0), d = o._createOnigScanner(f2, u2, e3.length, c2, _2);
            this._ptr = d;
            for (let t4 = 0, n3 = e3.length; t4 < n3; t4++) o._ofree(i2[t4]);
            o._ofree(u2), o._ofree(f2), 0 === d && function(e4) {
              throw new Error(e4.UTF8ToString(e4._getLastOnigError()));
            }(o);
          }
          dispose() {
            this._onigBinding._freeOnigScanner(this._ptr);
          }
          findNextMatchSync(e3, t3, n2) {
            let r2 = a, i2 = this._options;
            if (Array.isArray(n2) ? (n2.includes(25) && (r2 = true), i2 = i2.concat(n2)) : "boolean" == typeof n2 && (r2 = n2), "string" == typeof e3) {
              e3 = new f(e3);
              const n3 = this._findNextMatchSync(e3, t3, r2, i2);
              return e3.dispose(), n3;
            }
            return this._findNextMatchSync(e3, t3, r2, i2);
          }
          _findNextMatchSync(e3, t3, n2, r2) {
            const i2 = this._onigBinding, o2 = this.onigOptions(r2);
            let a2;
            if (a2 = n2 ? i2._findNextOnigScannerMatchDbg(this._ptr, e3.id, e3.ptr, e3.utf8Length, e3.convertUtf16OffsetToUtf8(t3), o2) : i2._findNextOnigScannerMatch(this._ptr, e3.id, e3.ptr, e3.utf8Length, e3.convertUtf16OffsetToUtf8(t3), o2), 0 === a2) return null;
            const s2 = i2.HEAPU32;
            let f2 = a2 / 4;
            const u2 = s2[f2++], c2 = s2[f2++];
            let _2 = [];
            for (let t4 = 0; t4 < c2; t4++) {
              const n3 = e3.convertUtf8OffsetToUtf16(s2[f2++]), r3 = e3.convertUtf8OffsetToUtf16(s2[f2++]);
              _2[t4] = { start: n3, end: r3, length: r3 - n3 };
            }
            return { index: u2, captureIndices: _2 };
          }
          onigOptions(e3) {
            return e3.map((e4) => this.onigOption(e4)).reduce((e4, t3) => e4 | t3, this._onigBinding.ONIG_OPTION_NONE);
          }
          onigSyntax(e3) {
            switch (e3) {
              case 0:
                return this._onigBinding.ONIG_SYNTAX_DEFAULT;
              case 1:
                return this._onigBinding.ONIG_SYNTAX_ASIS;
              case 2:
                return this._onigBinding.ONIG_SYNTAX_POSIX_BASIC;
              case 3:
                return this._onigBinding.ONIG_SYNTAX_POSIX_EXTENDED;
              case 4:
                return this._onigBinding.ONIG_SYNTAX_EMACS;
              case 5:
                return this._onigBinding.ONIG_SYNTAX_GREP;
              case 6:
                return this._onigBinding.ONIG_SYNTAX_GNU_REGEX;
              case 7:
                return this._onigBinding.ONIG_SYNTAX_JAVA;
              case 8:
                return this._onigBinding.ONIG_SYNTAX_PERL;
              case 9:
                return this._onigBinding.ONIG_SYNTAX_PERL_NG;
              case 10:
                return this._onigBinding.ONIG_SYNTAX_RUBY;
              case 11:
                return this._onigBinding.ONIG_SYNTAX_PYTHON;
              case 12:
                return this._onigBinding.ONIG_SYNTAX_ONIGURUMA;
            }
          }
          onigOption(e3) {
            switch (e3) {
              case 1:
                return this._onigBinding.ONIG_OPTION_NONE;
              case 0:
              case 25:
                return this._onigBinding.ONIG_OPTION_DEFAULT;
              case 2:
                return this._onigBinding.ONIG_OPTION_IGNORECASE;
              case 3:
                return this._onigBinding.ONIG_OPTION_EXTEND;
              case 4:
                return this._onigBinding.ONIG_OPTION_MULTILINE;
              case 5:
                return this._onigBinding.ONIG_OPTION_SINGLELINE;
              case 6:
                return this._onigBinding.ONIG_OPTION_FIND_LONGEST;
              case 7:
                return this._onigBinding.ONIG_OPTION_FIND_NOT_EMPTY;
              case 8:
                return this._onigBinding.ONIG_OPTION_NEGATE_SINGLELINE;
              case 9:
                return this._onigBinding.ONIG_OPTION_DONT_CAPTURE_GROUP;
              case 10:
                return this._onigBinding.ONIG_OPTION_CAPTURE_GROUP;
              case 11:
                return this._onigBinding.ONIG_OPTION_NOTBOL;
              case 12:
                return this._onigBinding.ONIG_OPTION_NOTEOL;
              case 13:
                return this._onigBinding.ONIG_OPTION_CHECK_VALIDITY_OF_STRING;
              case 14:
                return this._onigBinding.ONIG_OPTION_IGNORECASE_IS_ASCII;
              case 15:
                return this._onigBinding.ONIG_OPTION_WORD_IS_ASCII;
              case 16:
                return this._onigBinding.ONIG_OPTION_DIGIT_IS_ASCII;
              case 17:
                return this._onigBinding.ONIG_OPTION_SPACE_IS_ASCII;
              case 18:
                return this._onigBinding.ONIG_OPTION_POSIX_IS_ASCII;
              case 19:
                return this._onigBinding.ONIG_OPTION_TEXT_SEGMENT_EXTENDED_GRAPHEME_CLUSTER;
              case 20:
                return this._onigBinding.ONIG_OPTION_TEXT_SEGMENT_WORD;
              case 21:
                return this._onigBinding.ONIG_OPTION_NOT_BEGIN_STRING;
              case 22:
                return this._onigBinding.ONIG_OPTION_NOT_END_STRING;
              case 23:
                return this._onigBinding.ONIG_OPTION_NOT_BEGIN_POSITION;
              case 24:
                return this._onigBinding.ONIG_OPTION_CALLBACK_EACH_MATCH;
            }
          }
        }
        t2.OnigScanner = u;
        let c = false, _ = null;
        t2.loadWASM = function(e3) {
          if (c) return _;
          let t3, n2, r2, a2;
          if (c = true, function(e4) {
            return "function" == typeof e4.instantiator;
          }(e3)) t3 = e3.instantiator, n2 = e3.print;
          else {
            let r3;
            !function(e4) {
              return void 0 !== e4.data;
            }(e3) ? r3 = e3 : (r3 = e3.data, n2 = e3.print), t3 = function(e4) {
              return "undefined" != typeof Response && e4 instanceof Response;
            }(r3) ? "function" == typeof WebAssembly.instantiateStreaming ? /* @__PURE__ */ function(e4) {
              return (t4) => WebAssembly.instantiateStreaming(e4, t4);
            }(r3) : /* @__PURE__ */ function(e4) {
              return async (t4) => {
                const n3 = await e4.arrayBuffer();
                return WebAssembly.instantiate(n3, t4);
              };
            }(r3) : /* @__PURE__ */ function(e4) {
              return (t4) => WebAssembly.instantiate(e4, t4);
            }(r3);
          }
          return _ = new Promise((e4, t4) => {
            r2 = e4, a2 = t4;
          }), function(e4, t4, n3, r3) {
            (0, i.default)({ print: t4, instantiateWasm: (t5, n4) => {
              if ("undefined" == typeof performance) {
                const e5 = () => Date.now();
                t5.env.emscripten_get_now = e5, t5.wasi_snapshot_preview1.emscripten_get_now = e5;
              }
              return e4(t5).then((e5) => n4(e5.instance), r3), {};
            } }).then((e5) => {
              o = e5, n3();
            });
          }(t3, n2, r2, a2), _;
        }, t2.createOnigString = function(e3) {
          return new f(e3);
        }, t2.createOnigScanner = function(e3) {
          return new u(e3);
        }, t2.setDefaultDebugCall = function(e3) {
          a = e3;
        };
      }, 418: (e2) => {
        var t2 = ("undefined" != typeof document && document.currentScript && document.currentScript.src, function(e3 = {}) {
          var t3, n, r = e3;
          r.ready = new Promise((e4, r2) => {
            t3 = e4, n = r2;
          });
          var i, o = Object.assign({}, r);
          "undefined" != typeof read && read, i = (e4) => {
            if ("function" == typeof readbuffer) return new Uint8Array(readbuffer(e4));
            let t4 = read(e4, "binary");
            return "object" == typeof t4 || P(n2), t4;
            var n2;
          }, "undefined" == typeof clearTimeout && (globalThis.clearTimeout = (e4) => {
          }), "undefined" == typeof setTimeout && (globalThis.setTimeout = (e4) => "function" == typeof e4 ? e4() : P()), "undefined" != typeof scriptArgs && scriptArgs, "undefined" != typeof onig_print && ("undefined" == typeof console && (console = {}), console.log = onig_print, console.warn = console.error = "undefined" != typeof printErr ? printErr : onig_print);
          var a, s, f = r.print || console.log.bind(console), u = r.printErr || console.error.bind(console);
          Object.assign(r, o), o = null, r.arguments && r.arguments, r.thisProgram && r.thisProgram, r.quit && r.quit, r.wasmBinary && (a = r.wasmBinary), r.noExitRuntime, "object" != typeof WebAssembly && P("no native wasm support detected");
          var c, _, d, g, l, h, p, O, v = false;
          function m() {
            var e4 = s.buffer;
            r.HEAP8 = c = new Int8Array(e4), r.HEAP16 = d = new Int16Array(e4), r.HEAPU8 = _ = new Uint8Array(e4), r.HEAPU16 = g = new Uint16Array(e4), r.HEAP32 = l = new Int32Array(e4), r.HEAPU32 = h = new Uint32Array(e4), r.HEAPF32 = p = new Float32Array(e4), r.HEAPF64 = O = new Float64Array(e4);
          }
          var y = [], I = [], T = [];
          var N = 0, A = null, S = null;
          function P(e4) {
            r.onAbort && r.onAbort(e4), u(e4 = "Aborted(" + e4 + ")"), v = true, e4 += ". Build with -sASSERTIONS for more info.";
            var t4 = new WebAssembly.RuntimeError(e4);
            throw n(t4), t4;
          }
          var E, w;
          function b(e4) {
            return e4.startsWith("data:application/octet-stream;base64,");
          }
          function C(e4) {
            if (e4 == E && a) return new Uint8Array(a);
            if (i) return i(e4);
            throw "both async and sync fetching of the wasm failed";
          }
          function U(e4, t4, n2) {
            return function(e5) {
              return Promise.resolve().then(() => C(e5));
            }(e4).then((e5) => WebAssembly.instantiate(e5, t4)).then((e5) => e5).then(n2, (e5) => {
              u(`failed to asynchronously prepare wasm: ${e5}`), P(e5);
            });
          }
          b(E = "onig.wasm") || (w = E, E = r.locateFile ? r.locateFile(w, "") : "" + w);
          var G = (e4) => {
            for (; e4.length > 0; ) e4.shift()(r);
          }, B = void 0, R = (e4) => {
            for (var t4 = "", n2 = e4; _[n2]; ) t4 += B[_[n2++]];
            return t4;
          }, W = {}, L = {}, D = {}, x = void 0, M = (e4) => {
            throw new x(e4);
          }, F = void 0, X = (e4, t4, n2) => {
            function r2(t5) {
              var r3 = n2(t5);
              r3.length !== e4.length && ((e5) => {
                throw new F(e5);
              })("Mismatched type converter count");
              for (var i3 = 0; i3 < e4.length; ++i3) k(e4[i3], r3[i3]);
            }
            e4.forEach(function(e5) {
              D[e5] = t4;
            });
            var i2 = new Array(t4.length), o2 = [], a2 = 0;
            t4.forEach((e5, t5) => {
              L.hasOwnProperty(e5) ? i2[t5] = L[e5] : (o2.push(e5), W.hasOwnProperty(e5) || (W[e5] = []), W[e5].push(() => {
                i2[t5] = L[e5], ++a2 === o2.length && r2(i2);
              }));
            }), 0 === o2.length && r2(i2);
          };
          function k(e4, t4, n2 = {}) {
            if (!("argPackAdvance" in t4)) throw new TypeError("registerType registeredInstance requires argPackAdvance");
            return function(e5, t5, n3 = {}) {
              var r2 = t5.name;
              if (e5 || M(`type "${r2}" must have a positive integer typeid pointer`), L.hasOwnProperty(e5)) {
                if (n3.ignoreDuplicateRegistrations) return;
                M(`Cannot register type '${r2}' twice`);
              }
              if (L[e5] = t5, delete D[e5], W.hasOwnProperty(e5)) {
                var i2 = W[e5];
                delete W[e5], i2.forEach((e6) => e6());
              }
            }(e4, t4, n2);
          }
          function H() {
            this.allocated = [void 0], this.freelist = [];
          }
          var Y = new H(), j = () => {
            for (var e4 = 0, t4 = Y.reserved; t4 < Y.allocated.length; ++t4) void 0 !== Y.allocated[t4] && ++e4;
            return e4;
          }, V = (e4) => (e4 || M("Cannot use deleted val. handle = " + e4), Y.get(e4).value), $ = (e4) => {
            switch (e4) {
              case void 0:
                return 1;
              case null:
                return 2;
              case true:
                return 3;
              case false:
                return 4;
              default:
                return Y.allocate({ refcount: 1, value: e4 });
            }
          };
          function z(e4) {
            return this.fromWireType(l[e4 >> 2]);
          }
          var q = (e4, t4) => {
            switch (t4) {
              case 4:
                return function(e5) {
                  return this.fromWireType(p[e5 >> 2]);
                };
              case 8:
                return function(e5) {
                  return this.fromWireType(O[e5 >> 3]);
                };
              default:
                throw new TypeError(`invalid float width (${t4}): ${e4}`);
            }
          }, K = (e4, t4, n2) => {
            switch (t4) {
              case 1:
                return n2 ? (e5) => c[e5 >> 0] : (e5) => _[e5 >> 0];
              case 2:
                return n2 ? (e5) => d[e5 >> 1] : (e5) => g[e5 >> 1];
              case 4:
                return n2 ? (e5) => l[e5 >> 2] : (e5) => h[e5 >> 2];
              default:
                throw new TypeError(`invalid integer width (${t4}): ${e4}`);
            }
          };
          function J(e4) {
            return this.fromWireType(h[e4 >> 2]);
          }
          var Q, Z = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, ee = (e4, t4, n2) => {
            for (var r2 = t4 + n2, i2 = t4; e4[i2] && !(i2 >= r2); ) ++i2;
            if (i2 - t4 > 16 && e4.buffer && Z) return Z.decode(e4.subarray(t4, i2));
            for (var o2 = ""; t4 < i2; ) {
              var a2 = e4[t4++];
              if (128 & a2) {
                var s2 = 63 & e4[t4++];
                if (192 != (224 & a2)) {
                  var f2 = 63 & e4[t4++];
                  if ((a2 = 224 == (240 & a2) ? (15 & a2) << 12 | s2 << 6 | f2 : (7 & a2) << 18 | s2 << 12 | f2 << 6 | 63 & e4[t4++]) < 65536) o2 += String.fromCharCode(a2);
                  else {
                    var u2 = a2 - 65536;
                    o2 += String.fromCharCode(55296 | u2 >> 10, 56320 | 1023 & u2);
                  }
                } else o2 += String.fromCharCode((31 & a2) << 6 | s2);
              } else o2 += String.fromCharCode(a2);
            }
            return o2;
          }, te = (e4, t4) => e4 ? ee(_, e4, t4) : "", ne = "undefined" != typeof TextDecoder ? new TextDecoder("utf-16le") : void 0, re = (e4, t4) => {
            for (var n2 = e4, r2 = n2 >> 1, i2 = r2 + t4 / 2; !(r2 >= i2) && g[r2]; ) ++r2;
            if ((n2 = r2 << 1) - e4 > 32 && ne) return ne.decode(_.subarray(e4, n2));
            for (var o2 = "", a2 = 0; !(a2 >= t4 / 2); ++a2) {
              var s2 = d[e4 + 2 * a2 >> 1];
              if (0 == s2) break;
              o2 += String.fromCharCode(s2);
            }
            return o2;
          }, ie = (e4, t4, n2) => {
            if (void 0 === n2 && (n2 = 2147483647), n2 < 2) return 0;
            for (var r2 = t4, i2 = (n2 -= 2) < 2 * e4.length ? n2 / 2 : e4.length, o2 = 0; o2 < i2; ++o2) {
              var a2 = e4.charCodeAt(o2);
              d[t4 >> 1] = a2, t4 += 2;
            }
            return d[t4 >> 1] = 0, t4 - r2;
          }, oe = (e4) => 2 * e4.length, ae = (e4, t4) => {
            for (var n2 = 0, r2 = ""; !(n2 >= t4 / 4); ) {
              var i2 = l[e4 + 4 * n2 >> 2];
              if (0 == i2) break;
              if (++n2, i2 >= 65536) {
                var o2 = i2 - 65536;
                r2 += String.fromCharCode(55296 | o2 >> 10, 56320 | 1023 & o2);
              } else r2 += String.fromCharCode(i2);
            }
            return r2;
          }, se = (e4, t4, n2) => {
            if (void 0 === n2 && (n2 = 2147483647), n2 < 4) return 0;
            for (var r2 = t4, i2 = r2 + n2 - 4, o2 = 0; o2 < e4.length; ++o2) {
              var a2 = e4.charCodeAt(o2);
              if (a2 >= 55296 && a2 <= 57343 && (a2 = 65536 + ((1023 & a2) << 10) | 1023 & e4.charCodeAt(++o2)), l[t4 >> 2] = a2, (t4 += 4) + 4 > i2) break;
            }
            return l[t4 >> 2] = 0, t4 - r2;
          }, fe = (e4) => {
            for (var t4 = 0, n2 = 0; n2 < e4.length; ++n2) {
              var r2 = e4.charCodeAt(n2);
              r2 >= 55296 && r2 <= 57343 && ++n2, t4 += 4;
            }
            return t4;
          };
          Q = () => performance.now();
          var ue = (e4) => {
            var t4 = (e4 - s.buffer.byteLength + 65535) / 65536;
            try {
              return s.grow(t4), m(), 1;
            } catch (e5) {
            }
          }, ce = [null, [], []];
          (() => {
            for (var e4 = new Array(256), t4 = 0; t4 < 256; ++t4) e4[t4] = String.fromCharCode(t4);
            B = e4;
          })(), x = r.BindingError = class extends Error {
            constructor(e4) {
              super(e4), this.name = "BindingError";
            }
          }, F = r.InternalError = class extends Error {
            constructor(e4) {
              super(e4), this.name = "InternalError";
            }
          }, Object.assign(H.prototype, { get(e4) {
            return this.allocated[e4];
          }, has(e4) {
            return void 0 !== this.allocated[e4];
          }, allocate(e4) {
            var t4 = this.freelist.pop() || this.allocated.length;
            return this.allocated[t4] = e4, t4;
          }, free(e4) {
            this.allocated[e4] = void 0, this.freelist.push(e4);
          } }), Y.allocated.push({ value: void 0 }, { value: null }, { value: true }, { value: false }), Y.reserved = Y.allocated.length, r.count_emval_handles = j;
          var _e, de = { _embind_register_bigint: (e4, t4, n2, r2, i2) => {
          }, _embind_register_bool: (e4, t4, n2, r2) => {
            k(e4, { name: t4 = R(t4), fromWireType: function(e5) {
              return !!e5;
            }, toWireType: function(e5, t5) {
              return t5 ? n2 : r2;
            }, argPackAdvance: 8, readValueFromPointer: function(e5) {
              return this.fromWireType(_[e5]);
            }, destructorFunction: null });
          }, _embind_register_constant: (e4, t4, n2) => {
            e4 = R(e4), X([], [t4], function(t5) {
              return t5 = t5[0], r[e4] = t5.fromWireType(n2), [];
            });
          }, _embind_register_emval: (e4, t4) => {
            k(e4, { name: t4 = R(t4), fromWireType: (e5) => {
              var t5 = V(e5);
              return ((e6) => {
                e6 >= Y.reserved && 0 == --Y.get(e6).refcount && Y.free(e6);
              })(e5), t5;
            }, toWireType: (e5, t5) => $(t5), argPackAdvance: 8, readValueFromPointer: z, destructorFunction: null });
          }, _embind_register_float: (e4, t4, n2) => {
            k(e4, { name: t4 = R(t4), fromWireType: (e5) => e5, toWireType: (e5, t5) => t5, argPackAdvance: 8, readValueFromPointer: q(t4, n2), destructorFunction: null });
          }, _embind_register_integer: (e4, t4, n2, r2, i2) => {
            t4 = R(t4), -1 === i2 && (i2 = 4294967295);
            var o2 = (e5) => e5;
            if (0 === r2) {
              var a2 = 32 - 8 * n2;
              o2 = (e5) => e5 << a2 >>> a2;
            }
            var s2 = t4.includes("unsigned");
            k(e4, { name: t4, fromWireType: o2, toWireType: s2 ? function(e5, t5) {
              return this.name, t5 >>> 0;
            } : function(e5, t5) {
              return this.name, t5;
            }, argPackAdvance: 8, readValueFromPointer: K(t4, n2, 0 !== r2), destructorFunction: null });
          }, _embind_register_memory_view: (e4, t4, n2) => {
            var r2 = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array][t4];
            function i2(e5) {
              var t5 = h[e5 >> 2], n3 = h[e5 + 4 >> 2];
              return new r2(c.buffer, n3, t5);
            }
            k(e4, { name: n2 = R(n2), fromWireType: i2, argPackAdvance: 8, readValueFromPointer: i2 }, { ignoreDuplicateRegistrations: true });
          }, _embind_register_std_string: (e4, t4) => {
            var n2 = "std::string" === (t4 = R(t4));
            k(e4, { name: t4, fromWireType: (e5) => {
              var t5, r2 = h[e5 >> 2], i2 = e5 + 4;
              if (n2) for (var o2 = i2, a2 = 0; a2 <= r2; ++a2) {
                var s2 = i2 + a2;
                if (a2 == r2 || 0 == _[s2]) {
                  var f2 = te(o2, s2 - o2);
                  void 0 === t5 ? t5 = f2 : (t5 += String.fromCharCode(0), t5 += f2), o2 = s2 + 1;
                }
              }
              else {
                var u2 = new Array(r2);
                for (a2 = 0; a2 < r2; ++a2) u2[a2] = String.fromCharCode(_[i2 + a2]);
                t5 = u2.join("");
              }
              return he(e5), t5;
            }, toWireType: (e5, t5) => {
              var r2;
              t5 instanceof ArrayBuffer && (t5 = new Uint8Array(t5));
              var i2 = "string" == typeof t5;
              i2 || t5 instanceof Uint8Array || t5 instanceof Uint8ClampedArray || t5 instanceof Int8Array || M("Cannot pass non-string to std::string"), r2 = n2 && i2 ? ((e6) => {
                for (var t6 = 0, n3 = 0; n3 < e6.length; ++n3) {
                  var r3 = e6.charCodeAt(n3);
                  r3 <= 127 ? t6++ : r3 <= 2047 ? t6 += 2 : r3 >= 55296 && r3 <= 57343 ? (t6 += 4, ++n3) : t6 += 3;
                }
                return t6;
              })(t5) : t5.length;
              var o2 = le(4 + r2 + 1), a2 = o2 + 4;
              if (h[o2 >> 2] = r2, n2 && i2) ((e6, t6, n3, r3) => {
                if (!(r3 > 0)) return 0;
                for (var i3 = n3, o3 = n3 + r3 - 1, a3 = 0; a3 < e6.length; ++a3) {
                  var s3 = e6.charCodeAt(a3);
                  if (s3 >= 55296 && s3 <= 57343 && (s3 = 65536 + ((1023 & s3) << 10) | 1023 & e6.charCodeAt(++a3)), s3 <= 127) {
                    if (n3 >= o3) break;
                    t6[n3++] = s3;
                  } else if (s3 <= 2047) {
                    if (n3 + 1 >= o3) break;
                    t6[n3++] = 192 | s3 >> 6, t6[n3++] = 128 | 63 & s3;
                  } else if (s3 <= 65535) {
                    if (n3 + 2 >= o3) break;
                    t6[n3++] = 224 | s3 >> 12, t6[n3++] = 128 | s3 >> 6 & 63, t6[n3++] = 128 | 63 & s3;
                  } else {
                    if (n3 + 3 >= o3) break;
                    t6[n3++] = 240 | s3 >> 18, t6[n3++] = 128 | s3 >> 12 & 63, t6[n3++] = 128 | s3 >> 6 & 63, t6[n3++] = 128 | 63 & s3;
                  }
                }
                t6[n3] = 0;
              })(t5, _, a2, r2 + 1);
              else if (i2) for (var s2 = 0; s2 < r2; ++s2) {
                var f2 = t5.charCodeAt(s2);
                f2 > 255 && (he(a2), M("String has UTF-16 code units that do not fit in 8 bits")), _[a2 + s2] = f2;
              }
              else for (s2 = 0; s2 < r2; ++s2) _[a2 + s2] = t5[s2];
              return null !== e5 && e5.push(he, o2), o2;
            }, argPackAdvance: 8, readValueFromPointer: J, destructorFunction: (e5) => he(e5) });
          }, _embind_register_std_wstring: (e4, t4, n2) => {
            var r2, i2, o2, a2, s2;
            n2 = R(n2), 2 === t4 ? (r2 = re, i2 = ie, a2 = oe, o2 = () => g, s2 = 1) : 4 === t4 && (r2 = ae, i2 = se, a2 = fe, o2 = () => h, s2 = 2), k(e4, { name: n2, fromWireType: (e5) => {
              for (var n3, i3 = h[e5 >> 2], a3 = o2(), f2 = e5 + 4, u2 = 0; u2 <= i3; ++u2) {
                var c2 = e5 + 4 + u2 * t4;
                if (u2 == i3 || 0 == a3[c2 >> s2]) {
                  var _2 = r2(f2, c2 - f2);
                  void 0 === n3 ? n3 = _2 : (n3 += String.fromCharCode(0), n3 += _2), f2 = c2 + t4;
                }
              }
              return he(e5), n3;
            }, toWireType: (e5, r3) => {
              "string" != typeof r3 && M(`Cannot pass non-string to C++ string type ${n2}`);
              var o3 = a2(r3), f2 = le(4 + o3 + t4);
              return h[f2 >> 2] = o3 >> s2, i2(r3, f2 + 4, o3 + t4), null !== e5 && e5.push(he, f2), f2;
            }, argPackAdvance: 8, readValueFromPointer: z, destructorFunction: (e5) => he(e5) });
          }, _embind_register_void: (e4, t4) => {
            k(e4, { isVoid: true, name: t4 = R(t4), argPackAdvance: 0, fromWireType: () => {
            }, toWireType: (e5, t5) => {
            } });
          }, emscripten_get_now: Q, emscripten_memcpy_big: (e4, t4, n2) => _.copyWithin(e4, t4, t4 + n2), emscripten_resize_heap: (e4) => {
            var t4 = _.length, n2 = 2147483648;
            if ((e4 >>>= 0) > n2) return false;
            for (var r2, i2 = 1; i2 <= 4; i2 *= 2) {
              var o2 = t4 * (1 + 0.2 / i2);
              o2 = Math.min(o2, e4 + 100663296);
              var a2 = Math.min(n2, (r2 = Math.max(e4, o2)) + (65536 - r2 % 65536) % 65536);
              if (ue(a2)) return true;
            }
            return false;
          }, fd_write: (e4, t4, n2, r2) => {
            for (var i2 = 0, o2 = 0; o2 < n2; o2++) {
              var a2 = h[t4 >> 2], s2 = h[t4 + 4 >> 2];
              t4 += 8;
              for (var c2 = 0; c2 < s2; c2++) d2 = e4, g2 = _[a2 + c2], l2 = void 0, l2 = ce[d2], 0 === g2 || 10 === g2 ? ((1 === d2 ? f : u)(ee(l2, 0)), l2.length = 0) : l2.push(g2);
              i2 += s2;
            }
            var d2, g2, l2;
            return h[r2 >> 2] = i2, 0;
          } }, ge = function() {
            var e4, t4, i2, o2, f2 = { env: de, wasi_snapshot_preview1: de };
            function c2(e5, t5) {
              var n2, i3 = e5.exports;
              return s = (ge = i3).memory, m(), ge.__indirect_function_table, n2 = ge.__wasm_call_ctors, I.unshift(n2), function(e6) {
                if (N--, r.monitorRunDependencies && r.monitorRunDependencies(N), 0 == N && (null !== A && (clearInterval(A), A = null), S)) {
                  var t6 = S;
                  S = null, t6();
                }
              }(), i3;
            }
            if (N++, r.monitorRunDependencies && r.monitorRunDependencies(N), r.instantiateWasm) try {
              return r.instantiateWasm(f2, c2);
            } catch (e5) {
              u(`Module.instantiateWasm callback failed with error: ${e5}`), n(e5);
            }
            return (e4 = a, t4 = E, i2 = f2, o2 = function(e5) {
              c2(e5.instance);
            }, e4 || "function" != typeof WebAssembly.instantiateStreaming || b(t4) || "function" != typeof fetch ? U(t4, i2, o2) : fetch(t4, { credentials: "same-origin" }).then((e5) => WebAssembly.instantiateStreaming(e5, i2).then(o2, function(e6) {
              return u(`wasm streaming compile failed: ${e6}`), u("falling back to ArrayBuffer instantiation"), U(t4, i2, o2);
            }))).catch(n), {};
          }(), le = (e4) => (le = ge.malloc)(e4), he = (e4) => (he = ge.free)(e4);
          function pe() {
            function e4() {
              _e || (_e = true, r.calledRun = true, v || (G(I), t3(r), r.onRuntimeInitialized && r.onRuntimeInitialized(), function() {
                if (r.postRun) for ("function" == typeof r.postRun && (r.postRun = [r.postRun]); r.postRun.length; ) e5 = r.postRun.shift(), T.unshift(e5);
                var e5;
                G(T);
              }()));
            }
            N > 0 || (function() {
              if (r.preRun) for ("function" == typeof r.preRun && (r.preRun = [r.preRun]); r.preRun.length; ) e5 = r.preRun.shift(), y.unshift(e5);
              var e5;
              G(y);
            }(), N > 0 || (r.setStatus ? (r.setStatus("Running..."), setTimeout(function() {
              setTimeout(function() {
                r.setStatus("");
              }, 1), e4();
            }, 1)) : e4()));
          }
          if (r._omalloc = (e4) => (r._omalloc = ge.omalloc)(e4), r._ofree = (e4) => (r._ofree = ge.ofree)(e4), r._getLastOnigError = () => (r._getLastOnigError = ge.getLastOnigError)(), r._createOnigScanner = (e4, t4, n2, i2, o2) => (r._createOnigScanner = ge.createOnigScanner)(e4, t4, n2, i2, o2), r._freeOnigScanner = (e4) => (r._freeOnigScanner = ge.freeOnigScanner)(e4), r._findNextOnigScannerMatch = (e4, t4, n2, i2, o2, a2) => (r._findNextOnigScannerMatch = ge.findNextOnigScannerMatch)(e4, t4, n2, i2, o2, a2), r._findNextOnigScannerMatchDbg = (e4, t4, n2, i2, o2, a2) => (r._findNextOnigScannerMatchDbg = ge.findNextOnigScannerMatchDbg)(e4, t4, n2, i2, o2, a2), r.__embind_initialize_bindings = () => (r.__embind_initialize_bindings = ge._embind_initialize_bindings)(), r.dynCall_jiji = (e4, t4, n2, i2, o2) => (r.dynCall_jiji = ge.dynCall_jiji)(e4, t4, n2, i2, o2), r.UTF8ToString = te, S = function e4() {
            _e || pe(), _e || (S = e4);
          }, r.preInit) for ("function" == typeof r.preInit && (r.preInit = [r.preInit]); r.preInit.length > 0; ) r.preInit.pop()();
          return pe(), e3.ready;
        });
        e2.exports = t2;
      } }, t = {}, function n(r) {
        var i = t[r];
        if (void 0 !== i) return i.exports;
        var o = t[r] = { exports: {} };
        return e[r].call(o.exports, o, o.exports, n), o.exports;
      }(770);
      var e, t;
    });
  }
});
export default require_main();
