/**
 * /lib.js
 *
 * @file 普遍的な関数をまとめたファイル。
 * @namespace lib
 */
const mod = {}

/**
 * モジュールを受け取る。
 *
 * @memberof lib
 * @param {module} crypto
 * @param {module} axios
 */
const init = (crypto, axios) => {
  mod.crypto = crypto
  mod.axios = axios
}

/**
 * オブジェクト型の変数を、GETリクエストパラメータの形に変換する。
 *
 * @memberof lib
 * @param {Object} obj
 */
const objToQuery = (obj) => {
  return Object.entries(obj).map(([key, value]) => { return `${key}=${value}` }).join('&')
}

/**
 * axiosで指定したurlにHTTPリクエストを送信する。
 *
 * @memberof lib
 * @param {Boolean} isPost
 * @param {String} origin
 * @param {String} path
 * @param {Object} param
 * @param {Object} header
 * @param {Boolean} json
 */
const apiRequest = (isPost, origin, path, param = {}, header = {}, json = true) => {
  const calcSha256AsB64 = (str) => {
    const sha256 = mod.crypto.createHash('sha256')
    sha256.update(str)
    return sha256.digest('base64')
  }
  const calcSha256HmacAsB64 = (secret, str) => {
    const sha256Hmac = mod.crypto.createHmac('sha256', secret)
    sha256Hmac.update(str)
    return sha256Hmac.digest('base64')
  }

  return new Promise((resolve) => {
    const query = param && objToQuery(param)
    const queryString = query ? `?${query}` : ''
    const pathWithQueryString = `${path}${isPost ? '' : queryString}`
    const contentHash = calcSha256AsB64(JSON.stringify(isPost ? param : {}))
    const timestamp = Date.now()
    const dataToSign = `${timestamp}:${pathWithQueryString}:${contentHash}`
    const signature = calcSha256HmacAsB64(process.env.CLIENT_SECRET, dataToSign)
    const url = origin + pathWithQueryString

    const opt = {
      method: isPost ? 'POST' : 'GET',
      url,
      headers: {
        ...header,
        'x-xlogin-timestamp': timestamp,
        'x-xlogin-signature': signature,
        'tmp-dataToSign': dataToSign,
      },
      timeout: 30 * 1000,
    }
    if (json) {
      opt.responseType = 'json'
    }
    if (isPost && param) {
      opt.data = json ? param : param.toString()
    }
    mod.axios(opt)
      .then((res) => {
        resolve({ res, data: res.data })
      })
      .catch((error) => {
        resolve({ error })
      })
  })
}

/**
 * 指定した文字数のランダム文字列(base64urlエンコード)を生成する。
 *
 * @memberof lib
 * @param {Integer} len
 */
const getRandomB64UrlSafe = (len) => {
  return mod.crypto.randomBytes(len).toString('base64url').slice(0, len)
}

/**
 * 指定したアルゴリズムで、codeVerifierからcodeChallengeに変換する。
 *
 * @memberof lib
 * @param {String} codeVerifier
 * @param {String} codeChallengeMethod
 */
const convertToCodeChallenge = (codeVerifier, codeChallengeMethod) => {
  const calcSha256AsB64Url = (str) => {
    const sha256 = mod.crypto.createHash('sha256')
    sha256.update(str)
    return sha256.digest('base64url')
  }

  if (codeChallengeMethod === 'S256') {
    return calcSha256AsB64Url(codeVerifier)
  }
  throw new Error('unimplemented')
}

/**
 * OIDCの処理で、codeを使って問い合わせてアクセストークンを取得する。
 *
 * @memberof lib
 * @param {String} code
 * @param {Object} oidcSessionPart
 * @param {String} endpoint
 */
const getAccessTokenByCode = (code, oidcSessionPart, origin, path) => {
  if (!code || !oidcSessionPart.clientId || !oidcSessionPart.state || !oidcSessionPart.codeVerifier) {
    return null
  }

  const { clientId, state, codeVerifier } = oidcSessionPart
  const param = {
    clientId, state, code, codeVerifier,
  }
  const header = {
    'x-xlogin-client-id': clientId,
  }

  return apiRequest(false, origin, path, param, header, true)
}

/**
 * OIDCの処理で、accessTokenを使ってユーザー情報を問い合わせる。
 *
 * @memberof lib
 * @param {String} clientId
 * @param {Array} filterKeyList
 * @param {String} accessToken
 * @param {String} endpoint
 */
const getUserInfo = (clientId, filterKeyList, accessToken, origin, path) => {
  if (!accessToken) {
    return null
  }

  const header = {
    authorization: `Bearer ${accessToken}`,
    'x-xlogin-client-id': clientId,
  }
  const filterKeyListStr = filterKeyList.join(',')
  const param = {
    filterKeyListStr,
  }
  return apiRequest(false, origin, path, param, header, true)
}

/**
 * GETクエリを適切にurlに追加する。
 *
 * @memberof lib
 * @param {String} url
 * @param {String} queryStr
 */
const addQueryStr = (url, queryStr) => {
  if (url.indexOf('?') >= 0) {
    return `${url}&${queryStr}`
  }
  return `${url}?${queryStr}`
}

/**
 * 引数に名前をつける。
 *
 * @memberof lib
 * @param {Object} obj
 */
const _argNamed = (obj) => {
  const flattened = {}

  Object.keys(obj).forEach((key) => {
    if (Array.isArray(obj[key])) {
      Object.assign(flattened, obj[key].reduce((prev, curr) => {
        if (typeof curr === 'undefined') {
          throw new Error(`[error] flat argument by list can only contain function but: ${typeof curr} @${key}\n===== maybe you need make func exported like  module.exports = { func, } =====`)
        } else if (typeof curr === 'function') {
          prev[curr.name] = curr
        } else {
          throw new Error(`[error] flat argument by list can only contain function but: ${typeof curr} @${key}`)
        }
        return prev
      }, {}))
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flattened, obj[key])
    } else {
      flattened[key] = obj[key]
    }
  })

  return flattened
}

/**
 * グローバルの関数をセットする。
 */
const monkeyPatch = () => {
  if (typeof global.argNamed === 'undefined') {
    global.argNamed = _argNamed
  } else {
    console.log('[warn] global.argNamed is already set.')
  }
}

export default {
  init,
  objToQuery,
  apiRequest,
  getRandomB64UrlSafe,
  convertToCodeChallenge,
  getAccessTokenByCode,
  getUserInfo,
  addQueryStr,
  monkeyPatch,
}

