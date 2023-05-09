/**
 * 処理するリクエストのパスとハンドラをセットしたルーターを作成する。
 *
 * @memberof action
 */
export const getApiRouter = (handleXloginConnect, handleXloginCode, handleUserProfile, endResponse) => {
  const expressRouter = mod.express.Router()

  expressRouter.get('/f/xlogin/connect', (req, res) => {
    const { redirectAfterAuth, requestScope } = req.query
    const resultHandleXloginConnect = handleXloginConnect(redirectAfterAuth, requestScope)
    endResponse(req, res, resultHandleXloginConnect)
  })

  expressRouter.get('/f/xlogin/callback', async (req, res) => {
    const { state, code, iss } = req.query
    const resultHandleXloginCode = await handleXloginCode(state, code, iss, req.session.auth)
    endResponse(req, res, resultHandleXloginCode)
  })

  expressRouter.get('/f/user/profile', (req, res) => {
    const resultHandleUserProfile = handleUserProfile(req.session.auth)
    endResponse(req, res, resultHandleUserProfile)
  })

  return expressRouter
}

export default {
  getApiRouter,
}

