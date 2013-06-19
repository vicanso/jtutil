###*!
* Copyright(c) 2012 vicanso 墨鱼仔
* MIT Licensed
###

_ = require 'underscore'
async = require 'async'
fs = require 'fs'
path = require 'path'
zlib = require 'zlib'


noop = () ->

jtUtil =
  ###*
   * md5 md5加密
   * @param  {String} data 加密的数据
   * @param  {String} digestType 加密数据返回格式，若不传该参数则以hex的形式返回
   * @return {String} 加密后的字符串
  ###
  md5 : (data, digestType) ->
    @crypto data, 'md5', digestType
  ###*
   * sha1 sha1加密，参数和md5加密一致
   * @param  {String} data 加密的数据
   * @param  {String} digestType 加密数据返回格式，若不传该参数则以hex的形式返回
   * @return {String} 加密后的字符串
  ###
  sha1 : (data, digestType) ->
    @crypto data, 'sha1', digestType
  ###*
   * crypto 加密
   * @param  {String} data 加密数据
   * @param  {String} type 加密类型，可选为:md5, sha1等
   * @param  {String} digestType 加密数据的返回类型，若不传该参数则以hex的形式返回
   * @return {String} 加密后返回的字符串
  ###
  crypto : (data, type, digestType = 'hex') ->
    crypto = require 'crypto'
    cryptoData = crypto.createHash(type).update(data).digest digestType
    cryptoData
  ###*
   * gzip gzip压缩数据
   * @param  {String, Buffer} data 需要压缩的数据
   * @param  {Function} cbf 回调函数
   * @return {jtUtil} 
  ###
  gzip : (data, cbf) ->
    @zlibHandle 'gzip', data, cbf
    @
  ###*
   * deflate 以deflate的方式压缩数据
   * @param  {String, Buffer} data 需要压缩的数据
   * @param  {Function} cbf 回调函数
   * @return {jtUtil} 
  ###
  deflate : (data, cbf) ->
    @zlibHandle 'deflate', data, cbf
    @
  ###*
   * zlibHandle 压缩处理
   * @param  {String} func 压缩的方法名
   * @param  {String, Buffer} data 压缩的数据
   * @param  {Function} cbf 回调函数
   * @return {jtUtil}
  ###
  zlibHandle : (func, data, cbf) ->
    handle = zlib[func]
    if _.isFunction handle
      handle data, cbf
    else
      cbf new Error "the function:#{func} is not support!"
    @
  ###*
   * requireFileExists 判断require的文件是否存在（主要判断该文件还以四种后缀文件coffee, js, json, node）
   * @param  {String} file 文件名（不包含后缀）
   * @param  {Function} cbf 回调函数
   * @return {jtUtil}  
  ###
  requireFileExists : (file, cbf) ->
    requireExts = ['', 'coffee', 'js', 'json', 'node']
    checkFunctions = []
    _.each requireExts, (ext) ->
      checkFunctions.push (cbf) ->
        checkFile = file
        if ext
          checkFile += ".#{ext}"
        fs.exists checkFile, (exists) ->
          cbf null, exists
    async.parallel checkFunctions, (err, results) ->
      cbf _.any results
    @
  ###*
   * cutStringByViewSize 根据显示的尺寸截剪字符串
   * @param  {String} str 字符串
   * @param  {Number} viewSize 显示的长度（中文字符为2，英文字符为1）
   * @return {String} 返回截短后的字符串
  ###
  cutStringByViewSize : (str, viewSize) ->
    strLength = str.length
    viewSize *= 2
    currentViewSize = 0
    index = 0
    while index != strLength
      charCode = str.charCodeAt index
      if charCode < 0xff
        currentViewSize++
      else
        currentViewSize += 2
      index++
      if currentViewSize > viewSize
        break
    if index == strLength
      str
    else
      str.substring(0, index) + '...'
  ###*
   * randomKey description
   * @param  {Number} length 随机数的获取长度，默认为10
   * @param  {String} legalChars 随机字符串字符集
   * @return {String} 返回随机的字符串
  ###
  randomKey : (length = 10, legalChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') ->
    legalCharList = legalChars.split ''
    getRandomChar = (legalCharList) ->
      legalCharListLength = legalCharList.length
      legalCharList[Math.floor Math.random() * legalCharListLength]
    (getRandomChar legalCharList for num in [0...length]).join ''
  ###*
   * http://mengliao.blog.51cto.com/876134/824079
   * permutation 生成数组元素的所有排列
   * @param  {Array} arr 元素
   * @return {Array} 排列的结果
  ###
  permutation : (arr) ->
    arrLength = arr.length
    result = []
    fac = 1
    for i in [2..arrLength]
      fac *= i
    for index in [0...fac]
      tmpResult = new Array arrLength
      t = index
      for i in [1..arrLength]
        w = t % i
        j = i - 1
        while j > w
          tmpResult[j] = tmpResult[j - 1]
          j--
        tmpResult[w] = arr[i - 1]
        t = Math.floor(t / i)
      result.push tmpResult
    result
  ###*
   * combination 生成数组的所有组合
   * @param  {[type]} arr [description]
   * @param  {[type]} num [description]
   * @return {[type]}     [description]
  ###
  combination : (arr, num) ->
    r = []
    func = (t, a, n) ->
      if n == 0
        return r.push t
      total = a.length - n
      for i in [0..total]
        func t.concat(a[i]), a.slice(i + 1), n - 1
    func [], arr, num
    r
  ###*
   * memoize memoize处理
   * @param  {Function} fn 原始函数
   * @param  {Function} {optional} hasher 生成hash值的函数，默认为使用fn中的第一个参数作为key
   * @param  {Integer} {optional} ttl 结果的缓存时间(ms)，为0的时候用于控制同一时间所进行的同样的任务处理（若当前有同样的任务未完成，后续的任务使用当前任务的结果返回），不对结果缓存
   * @return {Function} 返回新的函数（其函数处理的结果会缓存）
  ###
  memoize : (fn, hasher, ttl) ->
    if _.isNumber hasher
      ttl = hasher
      hasher = null
    # 如果有设置ttl，则构造新的hasher，当调用hasher时，判断ttls里面有没对应的值，
    # 如果没有，则为第一次调用，添加ttl，之后每一次调用hasher时，判断ttl是否过期，
    # 若已过期，则删除memo中的值。
    if ttl?
      ttls = {}
      originnalHasher = hasher || (se) ->
        se
      hasher = () ->
        se = originnalHasher.apply null, arguments
        if !ttls[se]
          ttls[se] = Date.now() + ttl
        else if memo[se] && ttls[se] < Date.now()
          delete memo[se]
          ttls[se] = Date.now() + ttl
        se
    memoized = async.memoize fn, hasher
    memo = memoized.memo
    memoized
module.exports = jtUtil
