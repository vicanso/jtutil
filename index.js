
/**!
* Copyright(c) 2012 vicanso 腻味
* MIT Licensed
*/


(function() {
  var async, coffeeScript, fs, jtUtil, less, mkdirp, noop, path, stylus, uglifyJS, zlib, _;

  _ = require('underscore');

  async = require('async');

  fs = require('fs');

  mkdirp = require('mkdirp');

  less = require('less');

  coffeeScript = require('coffee-script');

  stylus = require('stylus');

  path = require('path');

  zlib = require('zlib');

  uglifyJS = require('uglify-js');

  noop = function() {};

  jtUtil = {
    /**
     * mergeFiles 合并文件
     * @param  {Array} files 需要合并的文件列表
     * @param  {String} saveFile 保存的文件
     * @param  {Function} dataConvert 可选参数，需要对数据做的转化，如果不需要转换，该参数作为完成时的call back
     * @param  {Function} cbf 完成时的call back
     * @return {jtUtil}             [description]
    */

    mergeFiles: function(files, saveFile, dataConvert, cbf) {
      var funcs;
      if (cbf == null) {
        cbf = noop;
      }
      funcs = [];
      if (arguments.length === 3) {
        cbf = dataConvert;
        dataConvert = null;
      }
      _.each(files, function(file) {
        return funcs.push(function(cbf) {
          var ext, handle;
          handle = function(err, data) {
            if (!err && dataConvert) {
              data = dataConvert(data, file, saveFile);
            }
            return cbf(err, data);
          };
          ext = path.extname(file);
          switch (ext) {
            case '.less':
              handle = _.wrap(handle, function(func, err, data) {
                var options;
                if (err) {
                  return func(err, data);
                } else {
                  options = {
                    paths: [path.dirname(file)],
                    compress: true
                  };
                  return jtUtil.parseLess(data, options, func);
                }
              });
              break;
            case '.styl':
              handle = _.wrap(handle, function(func, err, data) {
                var options;
                if (err) {
                  return func(err, data);
                } else {
                  options = {
                    paths: [path.dirname(file)],
                    filename: file,
                    compress: true
                  };
                  return jtUtil.parseStylus(data, options, func);
                }
              });
              break;
            case '.coffee':
              handle = _.wrap(handle, function(func, err, data) {
                var options;
                if (err) {
                  return func(err, data);
                } else {
                  options = {
                    fromString: true,
                    warnings: true
                  };
                  return jtUtil.parseCoffee(data, options, func);
                }
              });
          }
          return fs.readFile(file, 'utf8', handle);
        });
      });
      async.parallel(funcs, function(err, results) {
        if (err) {
          return cbf(err);
        } else {
          return mkdirp(path.dirname(saveFile), function(err) {
            if (err) {
              return cbf(err);
            } else {
              return fs.writeFile(saveFile, results.join(''), cbf);
            }
          });
        }
      });
      return this;
    },
    /**
     * md5 md5加密
     * @param  {String} data 加密的数据
     * @param  {String} digestType 加密数据返回格式，若不传该参数则以hex的形式返回
     * @return {String} 加密后的字符串
    */

    md5: function(data, digestType) {
      return this.crypto(data, 'md5', digestType);
    },
    /**
     * sha1 sha1加密，参数和md5加密一致
     * @param  {String} data 加密的数据
     * @param  {String} digestType 加密数据返回格式，若不传该参数则以hex的形式返回
     * @return {String} 加密后的字符串
    */

    sha1: function(data, digestType) {
      return this.crypto(data, 'sha1', digestType);
    },
    /**
     * crypto 加密
     * @param  {String} data 加密数据
     * @param  {String} type 加密类型，可选为:md5, sha1等
     * @param  {String} digestType 加密数据的返回类型，若不传该参数则以hex的形式返回
     * @return {String} 加密后返回的字符串
    */

    crypto: function(data, type, digestType) {
      var crypto, cryptoData;
      if (digestType == null) {
        digestType = 'hex';
      }
      crypto = require('crypto');
      cryptoData = crypto.createHash(type).update(data).digest(digestType);
      return cryptoData;
    },
    /**
     * gzip gzip压缩数据
     * @param  {String, Buffer} data 需要压缩的数据
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    gzip: function(data, cbf) {
      this.zlibHandle('gzip', data, cbf);
      return this;
    },
    /**
     * deflate 以deflate的方式压缩数据
     * @param  {String, Buffer} data 需要压缩的数据
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    deflate: function(data, cbf) {
      this.zlibHandle('deflate', data, cbf);
      return this;
    },
    /**
     * zlibHandle 压缩处理
     * @param  {String} func 压缩的方法名
     * @param  {String, Buffer} data 压缩的数据
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    zlibHandle: function(func, data, cbf) {
      var handle;
      handle = zlib[func];
      if (_.isFunction(handle)) {
        handle(data, cbf);
      } else {
        cbf(new Error("the function:" + func + " is not support!"));
      }
      return this;
    },
    /**
     * requireFileExists 判断require的文件是否存在（主要判断该文件还以四种后缀文件coffee, js, json, node）
     * @param  {String} file 文件名（不包含后缀）
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    requireFileExists: function(file, cbf) {
      var checkFunctions, requireExts;
      requireExts = ['', 'coffee', 'js', 'json', 'node'];
      checkFunctions = [];
      _.each(requireExts, function(ext) {
        return checkFunctions.push(function(cbf) {
          var checkFile;
          checkFile = file;
          if (ext) {
            checkFile += "." + ext;
          }
          return fs.exists(checkFile, function(exists) {
            return cbf(null, exists);
          });
        });
      });
      async.parallel(checkFunctions, function(err, results) {
        return cbf(_.any(results));
      });
      return this;
    },
    /**
     * cutStringByViewSize 根据显示的尺寸截剪字符串
     * @param  {String} str 字符串
     * @param  {Number} viewSize 显示的长度（中文字符为2，英文字符为1）
     * @return {String} 返回截短后的字符串
    */

    cutStringByViewSize: function(str, viewSize) {
      var charCode, currentViewSize, index, strLength;
      strLength = str.length;
      viewSize *= 2;
      currentViewSize = 0;
      index = 0;
      while (index !== strLength) {
        charCode = str.charCodeAt(index);
        if (charCode < 0xff) {
          currentViewSize++;
        } else {
          currentViewSize += 2;
        }
        index++;
        if (currentViewSize > viewSize) {
          break;
        }
      }
      if (index === strLength) {
        return str;
      } else {
        return str.substring(0, index) + '...';
      }
    },
    /**
     * parseLess 编译less
     * @param  {String} data less的内容
     * @param  {Object} options 编译的选项
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    parseLess: function(data, options, cbf) {
      var env, parser, paths;
      paths = options.paths;
      delete options.paths;
      env = {
        paths: paths
      };
      parser = new less.Parser(env);
      parser.parse(data, function(err, tree) {
        var cssStr;
        if (err) {
          return cbf(err);
        } else {
          cssStr = tree.toCSS(options);
          return cbf(null, cssStr);
        }
      });
      return this;
    },
    /**
     * parseCoffee 编译coffee
     * @param  {String} data coffee内容
     * @param  {Object} minifyOptions 编译选项
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    parseCoffee: function(data, minifyOptions, cbf) {
      var jsStr, minifyCode;
      jsStr = coffeeScript.compile(data);
      if (_.isFunction(minifyOptions)) {
        cbf = minifyOptions;
        minifyOptions = null;
      }
      if (minifyOptions) {
        minifyCode = uglifyJS.minify(jsStr, minifyOptions);
        jsStr = minifyCode.code;
      }
      cbf(null, jsStr);
      return this;
    },
    /**
     * parseStylus 编译stylus
     * @param  {String} data stylus内容
     * @param  {Object} options 编译选项
     * @param  {Function} cbf 回调函数
     * @return {jtUtil}
    */

    parseStylus: function(data, options, cbf) {
      stylus.render(data, options, cbf);
      return this;
    },
    /**
     * [response 响应http请求]
     * @param  {[type]} res         [response对象]
     * @param  {[type]} data        [响应的数据]
     * @param  {[type]} maxAge      [该请求头的maxAge]
     * @param  {[type]} contentType [返回的contentType(默认为text/html)]
     * @return {[type]}             [description]
    */

    response: function(res, data, maxAge, contentType) {
      if (contentType == null) {
        contentType = 'text/html';
      }
      switch (contentType) {
        case 'application/javascript':
          res.header('Content-Type', 'application/javascript; charset=UTF-8');
          break;
        case 'text/html':
          res.header('Content-Type', 'text/html; charset=UTF-8');
      }
      if (maxAge === 0) {
        res.header('Cache-Control', 'no-cache, no-store, max-age=0');
      } else {
        res.header('Cache-Control', "public, max-age=" + maxAge);
      }
      res.header('Last-Modified', new Date());
      res.send(data);
      return this;
    },
    /**
     * randomKey description
     * @param  {Number} length 随机数的获取长度，默认为10
     * @param  {String} legalChars 随机字符串字符集
     * @return {String} 返回随机的字符串
    */

    randomKey: function(length, legalChars) {
      var getRandomChar, legalCharList, num;
      if (length == null) {
        length = 10;
      }
      if (legalChars == null) {
        legalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      }
      legalCharList = legalChars.split('');
      getRandomChar = function(legalCharList) {
        var legalCharListLength;
        legalCharListLength = legalCharList.length;
        return legalCharList[Math.floor(Math.random() * legalCharListLength)];
      };
      return ((function() {
        var _i, _results;
        _results = [];
        for (num = _i = 0; 0 <= length ? _i < length : _i > length; num = 0 <= length ? ++_i : --_i) {
          _results.push(getRandomChar(legalCharList));
        }
        return _results;
      })()).join('');
      return this;
    },
    /**
     * http://mengliao.blog.51cto.com/876134/824079
     * permutation 生成数组元素的所有排列
     * @param  {Array} arr 元素
     * @return {Array} 排列的结果
    */

    permutation: function(arr) {
      var arrLength, fac, i, index, j, result, t, tmpResult, w, _i, _j, _k;
      arrLength = arr.length;
      result = [];
      fac = 1;
      for (i = _i = 2; 2 <= arrLength ? _i <= arrLength : _i >= arrLength; i = 2 <= arrLength ? ++_i : --_i) {
        fac *= i;
      }
      for (index = _j = 0; 0 <= fac ? _j < fac : _j > fac; index = 0 <= fac ? ++_j : --_j) {
        tmpResult = new Array(arrLength);
        t = index;
        for (i = _k = 1; 1 <= arrLength ? _k <= arrLength : _k >= arrLength; i = 1 <= arrLength ? ++_k : --_k) {
          w = t % i;
          j = i - 1;
          while (j > w) {
            tmpResult[j] = tmpResult[j - 1];
            j--;
          }
          tmpResult[w] = arr[i - 1];
          t = Math.floor(t / i);
        }
        result.push(tmpResult);
      }
      return result;
    },
    /**
     * combination 生成数组的所有组合
     * @param  {[type]} arr [description]
     * @param  {[type]} num [description]
     * @return {[type]}     [description]
    */

    combination: function(arr, num) {
      var func, r;
      r = [];
      func = function(t, a, n) {
        var i, total, _i, _results;
        if (n === 0) {
          return r.push(t);
        }
        total = a.length - n;
        _results = [];
        for (i = _i = 0; 0 <= total ? _i <= total : _i >= total; i = 0 <= total ? ++_i : --_i) {
          _results.push(func(t.concat(a[i]), a.slice(i + 1), n - 1));
        }
        return _results;
      };
      func([], arr, num);
      return r;
    },
    /**
     * memoize memoize处理
     * @param  {Function} fn 原始函数
     * @param  {Function} {optional} hasher 生成hash值的函数，默认为使用fn中的第一个参数作为key
     * @param  {Integer} {optional} ttl 结果的缓存时间(ms)
     * @return {Function} 返回新的函数（其函数处理的结果会缓存）
    */

    memoize: function(fn, hasher, ttl) {
      var memo, memoized, originnalHasher, ttls;
      if (_.isNumber(hasher)) {
        ttl = hasher;
        hasher = null;
      }
      if (ttl) {
        ttls = {};
        originnalHasher = hasher || function(se) {
          return se;
        };
        hasher = function() {
          var se;
          se = originnalHasher.apply(null, arguments);
          if (!ttls[se]) {
            ttls[se] = Date.now() + ttl;
          } else if (memo[se] && ttls[se] < Date.now()) {
            delete memo[se];
            ttls[se] = Date.now() + ttl;
          }
          return se;
        };
      }
      memoized = async.memoize(fn, hasher);
      memo = memoized.memo;
      return memoized;
    }
  };

  module.exports = jtUtil;

}).call(this);
