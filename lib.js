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
    const query = param && Object.keys(param).map((key) => { return `${key}=${param[key]}` }).join('&')
    const queryString = query ? `?${query}` : ''
    const contentHash = calcSha256AsB64(JSON.stringify(param))
    const timestamp = Date.now()
    const dataToSign = `${timestamp}:${path}:${contentHash}`
    const signature = calcSha256HmacAsB64(process.env.CLIENT_SECRET, dataToSign)
    const url = origin + path

    const opt = {
      method: isPost ? 'POST' : 'GET',
      url: url + (isPost ? '' : queryString),
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
 * オブジェクト型の変数を、GETリクエストパラメータの形に変換する。
 *
 * @memberof lib
 * @param {Object} obj
 */
const objToQuery = (obj) => {
  return Object.entries(obj).map(([key, value]) => { return `${key}=${value}` }).join('&')
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
  const oidcQueryStr = objToQuery({
    clientId, state, code, codeVerifier,
  })
  const requestPath = `${path}?${oidcQueryStr}`
  const header = {
    'x-xlogin-client-id': clientId,
  }

  return apiRequest(false, origin, requestPath, {}, header, true)
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

export default {
  init,
  apiRequest,
  getRandomB64UrlSafe,
  objToQuery,
  convertToCodeChallenge,
  getAccessTokenByCode,
  getUserInfo,
  addQueryStr,
}

