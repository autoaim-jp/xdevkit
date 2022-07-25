const mod = {}

const init = (crypto, axios) => {
  mod.crypto = crypto
  mod.axios = axios
}

const getRandomB64UrlSafe = (len) => {
  return mod.crypto.randomBytes(len).toString('base64url').slice(0, len)
}

const objToQuery = (obj) => {
  return Object.entries(obj).map(([key, value]) => { return `${key}=${value}` }).join('&')
}

const convertToCodeChallenge = (codeVerifier, codeChallengeMethod) => {
  const calcSha256AsB64Url = (str) => {
    const sha256 = mod.crypto.createHash('sha256')
    sha256.update(str)
    return sha256.digest('base64url')
  }

  if (codeChallengeMethod === 'S256') {
    return calcSha256AsB64Url(codeVerifier)
  } else {
    throw new Error('unimplemented')
  }
}

const getAccessTokenByCode = (apiRequest, code, oidcSessionPart, endpoint) => {
  if (!code || !oidcSessionPart['clientId'] || !oidcSessionPart['state'] || !oidcSessionPart['codeVerifier']) {
    return null
  }

  const { clientId, state, codeVerifier } = oidcSessionPart
  const oidcQueryStr = objToQuery({ clientId, state, code, codeVerifier })
  const reqUrl = `${endpoint}?${oidcQueryStr}`

  return apiRequest(false, reqUrl, {}, {}, true)
}

const getUserInfo = (apiRequest, clientId, filterKeyList, accessToken, endpoint) => {
  if (!accessToken) {
    return null
  }

  const header = { 
    'authorization': `Bearer ${accessToken}`,
    'x-xlogin-client-id': clientId,
  }
  const filterKeyListStr = filterKeyList.join(',')
  const param = {
    filterKeyListStr,
  }
  return apiRequest(false, endpoint, param, header, true)
}

const addQueryStr = (url, queryStr) => {
  if (url.indexOf('?') >= 0) {
    return `${url}&${queryStr}`
  } else {
    return `${url}?${queryStr}`
  }
}

const apiRequest = (isPost, url, param = {}, header = {}, json = true) => {
  return new Promise((resolve, reject) => {
    const query = param && Object.keys(param).map((key) => { return key + '=' + param[key] }).join('&')
    const opt = {
      method: isPost? 'POST': 'GET',
      url: url + (isPost? '': (query? '?' + query: '')),
      headers: Object.assign({
      }, header),
      timeout: 30 * 1000,
    }
    if(json) {
      opt.responseType = 'json'
    }
    if(isPost && param) {
      opt.data = json? (isPost? (param? param: {}): {}): param.toString()
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



export default {
  init,
  getRandomB64UrlSafe,
  objToQuery,
  convertToCodeChallenge,
  getAccessTokenByCode,
  getUserInfo,
  addQueryStr,
  apiRequest,
}

