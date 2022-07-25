/* /xdevkit/index.js */
import axios from 'axios'
import crypto from 'crypto'
import express from 'express'
import expressSession from 'express-session'
import Redis from 'ioredis'
import RedisStore from 'connect-redis'

import core from './core/index.js'
import browserServerSetting from './browserServerSetting.js'

import lib from './lib.js'

const init = (setting) => {
  lib.init(crypto, axios)
  core.init(browserServerSetting, setting, lib, express, expressSession, Redis, RedisStore)
}

const getRouter = () => {
  const expressRouter = express.Router()
  expressRouter.use(core.getSessionRouter())
  expressRouter.use(core.getApiRouter())
  return expressRouter
}

export default {
  init,
  getRouter,
}

