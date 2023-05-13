/**
 * /input.js
 *
 * @file 入力データのパースやデータ取得などを行うファイル。
 * @namespace input
 */

/**
 * OIDCの処理で、codeを使って問い合わせてアクセストークンを取得する。
 *
 * @memberof input
 * @param {String} code
 * @param {Object} oidcSessionPart
 * @param {String} API_SERVER_ORIGIN
 * @param {String} XLOGIN_CODE_ENDPOINT 
 */
const getAccessTokenByCode = ({
  code, oidcSessionPart, API_SERVER_ORIGIN, XLOGIN_CODE_ENDPOINT, apiRequest,
}) => {
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

  return apiRequest({
    isPost: false, origin: API_SERVER_ORIGIN, path: XLOGIN_CODE_ENDPOINT, param, header, json: true,
  })
}

/**
 * OIDCの処理で、accessTokenを使ってユーザー情報を問い合わせる。
 *
 * @memberof input 
 * @param {Array} filterKeyList
 * @param {String} accessToken
 * @param {String} CLIENT_ID
 * @param {String} API_SERVER_ORIGIN
 * @param {String} XLOGIN_USER_INFO_ENDPOINT
 */
const getUserInfo = ({
  filterKeyList, accessToken, CLIENT_ID, API_SERVER_ORIGIN, XLOGIN_USER_INFO_ENDPOINT, apiRequest,
}) => {
  if (!accessToken) {
    return null
  }

  const header = {
    authorization: `Bearer ${accessToken}`,
    'x-xlogin-client-id': CLIENT_ID,
  }
  const filterKeyListStr = filterKeyList.join(',')
  const param = {
    filterKeyListStr,
  }
  return apiRequest({
    isPost: false, origin: API_SERVER_ORIGIN, path: XLOGIN_USER_INFO_ENDPOINT, param, header, json: true,
  })
}

export default {
  getAccessTokenByCode,
  getUserInfo,
}

