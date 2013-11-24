/**!
* Copyright(c) 2012 vicanso 墨鱼仔
* MIT Licensed
*/


(function() {
  var async, fs, jtUtil, noop, path, request, zlib, _;

  _ = require('underscore');

  async = require('async');

  fs = require('fs');

  path = require('path');

  zlib = require('zlib');

  request = require('request');

  noop = function() {};

  jtUtil = {
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
     * @param  {Integer} {optional} ttl 结果的缓存时间(ms)，为0的时候用于控制同一时间所进行的同样的任务处理（若当前有同样的任务未完成，后续的任务使用当前任务的结果返回），不对结果缓存
     * @return {Function} 返回新的函数（其函数处理的结果会缓存）
    */

    memoize: function(fn, hasher, ttl) {
      var memo, memoized, originnalHasher, ttls;
      if (_.isNumber(hasher)) {
        ttl = hasher;
        hasher = null;
      }
      if (ttl != null) {
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
    },
    /**
     * request http请求
     * @param  {String, Object} url 请求的URL地址或者参数
     * @param  {Integer} {optional} retryTimes 重试的次数
     * @param  {Function} cbf 回调函数
     * @return {[type]}            [description]
    */

    request: function(url, retryTimes, cbf) {
      var options, timeout,
        _this = this;
      if (_.isFunction(retryTimes)) {
        cbf = retryTimes;
        retryTimes = 2;
      }
      timeout = 60 * 1000;
      if (_.isObject(url)) {
        options = url;
        if (options.timeout == null) {
          options.timeout = timeout;
        }
      } else {
        options = {
          url: url,
          timeout: timeout,
          encoding: null,
          headers: {
            'Accept-Encoding': 'gzip'
          }
        };
      }
      return request(options, function(err, res, body) {
        var _ref;
        if (err) {
          if (retryTimes > 0) {
            return _this.request(url, --retryTimes, cbf);
          } else {
            return cbf(err);
          }
        } else if ((res != null ? (_ref = res.headers) != null ? _ref['content-encoding'] : void 0 : void 0) === 'gzip') {
          return zlib.gunzip(body, cbf);
        } else {
          return cbf(null, body);
        }
      });
    }
  };

  _.extend(module.exports, jtUtil);

}).call(this);
