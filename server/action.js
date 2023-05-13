/**
 * /xdevkit/server/action.js
 *
 * @file ルーターなどのアクションを設定するファイル
 * @namespace action
 */


/**
 * セッションを管理するルーターを作成する。
 *
 * @memberof action
 */
const getSessionRouter = ({
  express, Redis, expressSession, REDIS_PORT, REDIS_HOST, REDIS_DB, SESSION_ID, SESSION_COOKIE_SECURE, RedisStore,
}) => {
  const expressRouter = express.Router()
  const redis = new Redis({
    port: REDIS_PORT,
    host: REDIS_HOST,
    db: REDIS_DB,
  })
  expressRouter.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    rolling: true,
    name: SESSION_ID,
    cookie: {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: SESSION_COOKIE_SECURE,
      httpOnly: true,
      sameSite: 'lax',
    },
    store: new (RedisStore(expressSession))({ client: redis }),
  }))

  return expressRouter
}


const getHandlerConnect = ({ handleXloginConnect, endResponse, ERROR_PAGE }) => {
  return (req, res) => {
    const { redirectAfterAuth, requestScope } = req.query
    const resultHandleXloginConnect = handleXloginConnect(redirectAfterAuth, requestScope)
    endResponse(req, res, resultHandleXloginConnect, ERROR_PAGE)
  }
}

const getHandlerCallback = ({ handleXloginCallback, endResponse, ERROR_PAGE }) => {
  return async (req, res) => {
    const { state, code, iss } = req.query
    const resultHandleXloginCallback = await handleXloginCallback(state, code, iss, req.session.auth)
    endResponse(req, res, resultHandleXloginCallback, ERROR_PAGE)
  }
}

const getHandlerProfile = ({ handleUserProfile, endResponse, ERROR_PAGE }) => {
  return (req, res) => {
    const resultHandleUserProfile = handleUserProfile(req.session.auth)
    endResponse(req, res, resultHandleUserProfile, ERROR_PAGE)
  }
}

export default {
  getSessionRouter,

  getHandlerConnect,
  getHandlerCallback,
  getHandlerProfile,
}

