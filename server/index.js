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

const asocial = {
  action, core, lib, output, setting: { browserServerSetting },
}
const a = asocial

/**
 * 処理するリクエストのパスとハンドラをセットしたルーターを作成する。
 *
 * @memberof index
 */
const _getApiRouter = () => {
  const expressRouter = express.Router()

  const connectHandler = a.action.getHandlerConnect(argNamed({
    core: [a.core.handleXloginConnect],
    output: [a.output.endResponse],
    setting: a.setting.xdevkitSetting.getList('url.ERROR_PAGE'),
  }))
  expressRouter.get('/f/xlogin/connect', connectHandler)

  const callbackHandler = a.action.getHandlerCallback(argNamed({
    core: [a.core.handleXloginCallback],
    output: [a.output.endResponse],
    setting: a.setting.xdevkitSetting.getList('url.ERROR_PAGE'),
  }))
  expressRouter.get('/f/xlogin/callback', callbackHandler)

  const profileHandler = a.action.getHandlerProfile(argNamed({
    core: [a.core.handleUserProfile],
    output: [a.output.endResponse],
    setting: a.setting.xdevkitSetting.getList('url.ERROR_PAGE'),
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

  a.lib.init(argNamed({
    mod: { crypto, axios },
  }))
  a.core.init(argNamed({
    asocial: { setting: a.setting, lib: a.lib },
    mod: { express },
  }))

  const expressRouter = express.Router()
  expressRouter.use(a.action.getSessionRouter(argNamed({
    mod: {
      express, expressSession, Redis, RedisStore,
    },
    setting: a.setting.xdevkitSetting.getList('session.REDIS_PORT', 'session.REDIS_HOST', 'session.REDIS_DB', 'session.SESSION_ID', 'session.SESSION_COOKIE_SECURE'),
  })))
  expressRouter.use(_getApiRouter())
  return expressRouter
}

export default {
  getRouter,
}

