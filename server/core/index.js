/** 
 * /xdevkit/core/index.js 
 *
 * @file coreの機能をまとめたファイル。
 * @namespace core
 */
import apiRouter from './apiRouter.js'

/**
 * settingとモジュールを受け取りcoreのルーターを初期化する。
 *
 * @memberof core
 * @param {Object} browserServerSetting
 * @param {Object} setting
 * @param {module} lib
 * @param {module} express
 * @param {module} expressSession
 * @param {module} Redis
 * @param {module} RedisStore
 */
const init = (browserServerSetting, setting, lib, express) => {
  apiRouter.init(browserServerSetting, setting, lib, express)
}

export default {
  init,
  getSessionRouter,
  apiRouter,
}

