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
import core from './core.js'
import browserServerSetting from './browserServerSetting.js'
import lib from './lib.js'
import output from './output.js'

const asocial = { action, core, lib, output, setting: { browserServerSetting } }
const a = asocial

/**
 * 処理するリクエストのパスとハンドラをセットしたルーターを作成する。
 *
 * @memberof index
 */
const _getApiRouter = () => {
  const expressRouter = express.Router()

  const connectHandler = action.getHandlerConnect(argNamed({
    core: [a.core.handleXloginConnect],
    output: [a.output.endResponse],
  }))
  expressRouter.get('/f/xlogin/connect', connectHandler)

  const callbackHandler = action.getHandlerCallback(argNamed({
    core: [a.core.handleXloginCallback],
    output: [a.output.endResponse],
  }))
  expressRouter.get('/f/xlogin/callback', callbackHandler)

  const profileHandler = action.getHandlerProfile(argNamed({
    core: [a.core.handleUserProfile],
    output: [a.output.endResponse],
  }))
  expressRouter.get('/f/user/profile', profileHandler)

  return expressRouter
}

/**
 * coreのルーターを統合したルーターを返す。
 *
 * @memberof index
 */
const getRouter = ({ xdevkitSetting }) => {
  a.lib.monkeyPatch()

  a.setting.xdevkitSetting = xdevkitSetting

  a.lib.init(a.argNamed({
    mod: { crypto, axios }
  }))
  a.core.init(browserServerSetting, a.setting, lib, express)

  const expressRouter = express.Router()
  expressRouter.use(action.getSessionRouter(argNamed({
    mod: { express, expressSession, Redis, RedisStore },
    setting: setting.get('session.REDIS_PORT', 'session.REDIS_HOST', 'session.REDIS_DB', 'session.SESSION_ID', 'session.SESSION_COOKIE_SECURE'),
  })))
  expressRouter.use(_getApiRouter())
  return expressRouter
}

export default {
  init,
  getRouter,
}

