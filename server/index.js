/**
 * /xdevkit/server/index.js
 *
 * @file エントリポイントのファイル。
 * @namespace index
 */
import axios from 'axios'
import crypto from 'crypto'
import express from 'express'
import expressSession from 'express-session'
import Redis from 'ioredis'
import RedisStore from 'connect-redis'

import action from './action.js'
import core from './core/index.js'
import browserServerSetting from './browserServerSetting.js'
import lib from './lib.js'
import output from './output.js'

let xdevkitSetting = null

/**
 * libとcoreを初期化する。
 *
 * @memberof index
 * @param {Object} setting
 */
const init = (setting) => {
  lib.monkeyPatch()

  xdevkitSetting = setting

  lib.init(crypto, axios)
  core.init(browserServerSetting, setting, lib, express)
}

/**
 * coreのルーターを統合したルーターを返す。
 *
 * @memberof index
 */
const getRouter = () => {
  const expressRouter = express.Router()
  expressRouter.use(action.getSessionRouter(argNamed({
    mod: { express, expressSession, Redis, RedisStore },
    setting: xdevkitSetting.get('session.REDIS_PORT', 'session.REDIS_HOST', 'session.REDIS_DB', 'session.SESSION_ID', 'session.SESSION_COOKIE_SECURE'),
  })))
  expressRouter.use(action.getApiRouter(argNamed({
    core: [core.apiRouter.handleXloginConnect, core.apiRouter.handleXloginCode, core.apiRouter.handleUserProfile],
    mod: { express },
    output: [output.endResponse],
    setting: xdevkitSetting.get('url.ERROR_PAGE'),
  })))
  return expressRouter
}

export default {
  init,
  getRouter,
}

