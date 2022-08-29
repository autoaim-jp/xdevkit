/**
 * /xdevkit/core/sessionRouter.js
 *
 * @file セッションを管理するルーターのファイル。
 */
const mod = {}

/**
 * settingとモジュールを受け取り初期化する。
 *
 * @memberof core
 * @param {Object} setting
 * @param {module} express
 * @param {module} expressSession
 * @param {module} Redis
 * @param {module} RedisStore
 */
const init = (setting, express, expressSession, Redis, RedisStore) => {
  mod.setting = setting
  mod.express = express
  mod.expressSession = expressSession
  mod.Redis = Redis
  mod.RedisStore = RedisStore
}

/**
 * セッションを管理するルーターを作成する。
 *
 * @memberof core
 */
export const getSessionRouter = () => {
  const expressRouter = mod.express.Router()
  const redis = new mod.Redis({
    port: mod.setting.session.REDIS_PORT,
    host: mod.setting.session.REDIS_HOST,
    db: mod.setting.session.REDIS_DB,
  })
  expressRouter.use(mod.expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    rolling: true,
    name: mod.setting.session.SESSION_ID,
    cookie: {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: mod.setting.session.SESSION_COOKIE_SECURE,
      httpOnly: true,
      sameSite: 'lax',
    },
    store: new (mod.RedisStore(mod.expressSession))({ client: redis }),
  }))

  return expressRouter
}

export default {
  init,
}

