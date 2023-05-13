/**
 * /xdevkit/core.js
 *
 * @file OIDC関連のAPIエンドポイントのルーターのファイル。
 * @namespace core
 */
const mod = {}

/**
 * settingとモジュールを受け取り初期化する。
 *
 * @memberof core
 * @param {Object} browserServerSetting
 * @param {Object} setting
 * @param {module} lib
 * @param {module} express
 */
const init = (browserServerSetting, setting, lib, express) => {
  mod.bsc = browserServerSetting
  mod.setting = setting
  mod.lib = lib
  mod.express = express
}

/**
 * エラー時にレスポンスを返す。
 *
 * @memberof core
 * @param {Integer} status
 * @param {String} error
 * @param {Boolean} isServerRedirect
 * @param {Object} response
 * @param {Object} session
 */
const _getErrorResponse = (status, error, isServerRedirect, response = null, session = {}) => {
  const redirect = `${mod.setting.xdevkitSetting.getValue('url.ERROR_PAGE')}?error=${encodeURIComponent(error)}`
  if (isServerRedirect) {
    return {
      status, session, response, redirect, error,
    }
  }
  if (response) {
    return {
      status, session, response, error,
    }
  }
  return {
    status, session, response: { status, error, redirect }, error,
  }
}

/**
 * 認証サーバーへ、OIDCを開始するためのHTTPリクエストを送信する。
 * /f/xlogin/connect へPOSTリクエストが来たときに、
 * 必要なパラメータを整理し、セッションへ登録してから
 * ブラウザからGETリクエストでリダイレクトさせる。
 *
 * @memberof core
 * @param {String} redirectAfterAuth
 */
const handleXloginConnect = (redirectAfterAuth, requestScope) => {
  const oidcSessionPart = {}
  oidcSessionPart.iss = mod.setting.xdevkitSetting.getValue('env.AUTH_SERVER_ORIGIN')
  oidcSessionPart.codeVerifier = mod.lib.getRandomB64UrlSafe(mod.setting.xdevkitSetting.getValue('api.CODE_VERIFIER_L'))
  oidcSessionPart.redirectAfterAuth = redirectAfterAuth

  const oidcQueryParam = {}
  oidcQueryParam.codeChallengeMethod = mod.setting.xdevkitSetting.getValue('api.XLOGIN_CODE_CHALLENGE_METHOD')
  oidcQueryParam.codeChallenge = mod.lib.convertToCodeChallenge(oidcSessionPart.codeVerifier, oidcQueryParam.codeChallengeMethod)
  oidcQueryParam.state = mod.lib.getRandomB64UrlSafe(mod.setting.xdevkitSetting.getValue('api.STATE_L'))
  oidcQueryParam.responseType = mod.setting.xdevkitSetting.getValue('api.XLOGIN_RESPONSE_TYPE')
  oidcQueryParam.scope = mod.setting.xdevkitSetting.getValue('api.SCOPE')
  oidcQueryParam.clientId = mod.setting.xdevkitSetting.getValue('env.CLIENT_ID')
  oidcQueryParam.redirectUri = mod.setting.xdevkitSetting.getValue('env.SERVER_ORIGIN') + mod.setting.xdevkitSetting.getValue('url.XLOGIN_REDIRECT_URI')
  oidcQueryParam.requestScope = requestScope || ''

  const oidcQueryStr = `?${mod.lib.objToQuery(oidcQueryParam)}`
  const redirectTo = mod.setting.xdevkitSetting.getValue('env.AUTH_SERVER_ORIGIN') + mod.setting.xdevkitSetting.getValue('url.XLOGIN_AUTHORIZATION_ENDPOINT') + oidcQueryStr

  const newUserSession = { oidc: Object.assign(oidcSessionPart, oidcQueryParam) }

  const status = mod.bsc.statusList.OK
  return {
    status, session: newUserSession, response: null, redirect: redirectTo,
  }
}

/**
 * 認証サーバーからのコールバックを処理し、accessTokenやuserInfoを問い合わせる。
 * /f/xlogin/callback へGETリクエストが来たときに、
 * codeとcodeVerifierでaccessTokenを、
 * accessTokenでuserInfoを、POSTリクエストで問い合わせる。
 *
 * @memberof core
 * @param {String} state
 * @param {String} code
 * @param {String} iss
 * @param {Object} userSession
 */
const handleXloginCallback = async (state, code, iss, userSession) => {
  if (!userSession || !userSession.oidc) {
    const status = mod.bsc.statusList.INVALID_SESSION
    const error = 'handle_xlogin_code_session'
    return _getErrorResponse(status, error, true)
  }

  if (state !== userSession.oidc.state) {
    const status = mod.bsc.statusList.INVALID_SESSION
    const error = 'handle_xlogin_code_state'
    return _getErrorResponse(status, error, true)
  }

  if (iss !== userSession.oidc.iss) {
    const status = mod.bsc.statusList.INVALID_OIDC_ISSUER
    const error = 'handle_xlogin_code_iss'
    return _getErrorResponse(status, error, true)
  }

  /* request accessToken */
  const accessTokenResponse = await mod.lib.getAccessTokenByCode(code, userSession.oidc, mod.setting.xdevkitSetting.getValue('env.API_SERVER_ORIGIN'), mod.setting.xdevkitSetting.getValue('url.XLOGIN_CODE_ENDPOINT'))
  if (!accessTokenResponse) {
    const status = mod.bsc.statusList.INVALID_SESSION
    const error = 'handle_xlogin_code_access_token'
    return _getErrorResponse(status, error, true)
  }

  const accessToken = accessTokenResponse?.data?.result?.accessToken
  const splitPermissionList = accessTokenResponse?.data?.result?.splitPermissionList
  if (accessTokenResponse.error || !accessToken || !splitPermissionList) {
    const status = mod.bsc.statusList.API_ERROR
    const error = encodeURIComponent(accessTokenResponse.error)
    return _getErrorResponse(status, error, true)
  }

  /* request userInfo */
  const filterKeyList = mod.setting.xdevkitSetting.getValue('api.SCOPE').split(',').map((row) => { return row.split(':').slice(1).join(':') })
  const userInfoResponse = await mod.lib.getUserInfo(mod.setting.xdevkitSetting.getValue('env.CLIENT_ID'), filterKeyList, accessToken, mod.setting.xdevkitSetting.getValue('env.API_SERVER_ORIGIN'), mod.setting.xdevkitSetting.getValue('url.XLOGIN_USER_INFO_ENDPOINT'))
  if (!userInfoResponse) {
    const status = mod.bsc.statusList.INVALID_SESSION
    const error = 'handle_xlogin_code_user_info'
    return _getErrorResponse(status, error, true)
  }

  const userInfo = userInfoResponse?.data?.result?.userInfo
  if (userInfoResponse.error || !userInfo) {
    const status = mod.bsc.statusList.API_ERROR
    const error = encodeURIComponent(userInfoResponse.error)
    return _getErrorResponse(status, error, true)
  }

  const status = mod.bsc.statusList.LOGIN_SUCCESS
  const redirectTo = mod.lib.addQueryStr(userSession.oidc.redirectAfterAuth, mod.lib.objToQuery({ code: status }))

  return {
    status, session: { accessToken, userInfo, splitPermissionList }, response: null, redirect: redirectTo,
  }
}

/**
 * マイページからのリクエストを処理する。
 * /f/user/profile にGETリクエストが来たときに、
 * セッションからユーザー情報を返す。
 *
 * @memberof core
 * @param {Object} authSession
 */
const handleUserProfile = (authSession) => {
  if (!authSession || !authSession.userInfo) {
    const status = mod.bsc.statusList.INVALID_SESSION
    const error = 'handle_user_profile_session'
    return _getErrorResponse(status, error, false)
  }

  const { userInfo } = authSession
  const status = mod.bsc.statusList.OK
  return { status, session: authSession, response: { userInfo } }
}


export default {
  init,
  handleXloginConnect,
  handleXloginCallback,
  handleUserProfile,
}

