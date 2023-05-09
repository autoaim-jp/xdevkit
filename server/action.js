/**
 * /xdevkit/server/action.js
 *
 * @file ルーターなどのアクションを設定するファイル
 * @namespace action
 */

/**
 * 処理するリクエストのパスとハンドラをセットしたルーターを作成する。
 *
 * @memberof action
 */
const getApiRouter = (express, handleXloginConnect, handleXloginCode, handleUserProfile, endResponse, ERROR_PAGE) => {
  const expressRouter = express.Router()

  expressRouter.get('/f/xlogin/connect', (req, res) => {
    const { redirectAfterAuth, requestScope } = req.query
    const resultHandleXloginConnect = handleXloginConnect(redirectAfterAuth, requestScope)
    endResponse(req, res, resultHandleXloginConnect, ERROR_PAGE)
  })

  expressRouter.get('/f/xlogin/callback', async (req, res) => {
    const { state, code, iss } = req.query
    const resultHandleXloginCode = await handleXloginCode(state, code, iss, req.session.auth)
    endResponse(req, res, resultHandleXloginCode, ERROR_PAGE)
  })

  expressRouter.get('/f/user/profile', (req, res) => {
    const resultHandleUserProfile = handleUserProfile(req.session.auth)
    endResponse(req, res, resultHandleUserProfile, ERROR_PAGE)
  })

  return expressRouter
}

export default {
  getApiRouter,
}

