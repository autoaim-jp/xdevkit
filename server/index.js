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

import browserServerSetting from './browserServerSetting.js'
import output from './output.js'
import core from './core.js'
import input from './input.js'
import action from './action.js'
import lib from './lib.js'

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
 * セッションを管理するルーターを作成する。
 *
 * @memberof index
 */
const _getSessionRouter = () => {
  const expressRouter = express.Router()
  const redis = new Redis({
    port: a.setting.xdevkitSetting.getValue('session.REDIS_PORT'),
    host: a.setting.xdevkitSetting.getValue('session.REDIS_HOST'),
    db: a.setting.xdevkitSetting.getValue('session.REDIS_DB'),
  })
  expressRouter.use(expressSession({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    rolling: true,
    name: a.setting.xdevkitSetting.getValue('session.SESSION_ID'),
    cookie: {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      secure: a.setting.xdevkitSetting.getValue('session.SESSION_COOKIE_SECURE'),
      httpOnly: true,
      sameSite: 'lax',
    },
    store: new (RedisStore(expressSession))({ client: redis }),
  }))

  return expressRouter
}


/**
 * xdevkitのルータを返す。
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
    asocial: { setting: a.setting, input: a.input, lib: a.lib },
  }))

  const expressRouter = express.Router()
  expressRouter.use(_getSessionRouter())
  expressRouter.use(_getApiRouter())
  return expressRouter
}

export default {
  getRouter,
}

