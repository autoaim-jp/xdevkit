/**
 * /xdevkit/index.js
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


/**
 * libとcoreを初期化する。
 *
 * @memberof index
 * @param {Object} setting
 */
const init = (setting) => {
  lib.init(crypto, axios)
  core.init(browserServerSetting, setting, lib, express, expressSession, Redis, RedisStore)
}

/**
 * coreのルーターを統合したルーターを返す。
 *
 * @memberof index
 */
const getRouter = () => {
  const expressRouter = express.Router()
  expressRouter.use(core.getSessionRouter())
  expressRouter.use(action.getApiRouter(express, core.apiRouter.handleXloginConnect, core.apiRouter.handleXloginCode, core.apiRouter.handleUserProfile, output.endResponse))
  return expressRouter
}

export default {
  init,
  getRouter,
}

