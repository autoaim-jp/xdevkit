/* /xdevkit/core/index.js */
import sessionRouter, { getSessionRouter } from './sessionRouter.js'
import apiRouter, { getApiRouter } from './apiRouter.js'

const init = (browserServerSetting, setting, lib, express, expressSession, Redis, RedisStore) => {
  sessionRouter.init(setting, express, expressSession, Redis, RedisStore)
  apiRouter.init(browserServerSetting, setting, lib, express)
}

export default {
  init,
  getSessionRouter,
  getApiRouter,
}

