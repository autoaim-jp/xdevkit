/**
 * /xdevkit/server/action.js
 *
 * @file ルーターなどのアクションを設定するファイル
 * @namespace action
 */

const getHandlerConnect = ({ handleXloginConnect, endResponse, ERROR_PAGE }) => {
  return (req, res) => {
    const { redirectAfterAuth, requestScope } = req.query
    const handleResult = handleXloginConnect({ redirectAfterAuth, requestScope })
    endResponse({ req, res, handleResult, ERROR_PAGE })
  }
}

const getHandlerCallback = ({ handleXloginCallback, endResponse, ERROR_PAGE }) => {
  return async (req, res) => {
    const { state, code, iss } = req.query
    const { auth: userSession } = req.session
    const handleResult = await handleXloginCallback({ state, code, iss, userSession })
    endResponse({ req, res, handleResult, ERROR_PAGE })
  }
}

const getHandlerProfile = ({ handleUserProfile, endResponse, ERROR_PAGE }) => {
  return (req, res) => {
    const { auth: userSession } = req.session
    const handleResult = handleUserProfile({ userSession })
    endResponse({ req, res, handleResult, ERROR_PAGE })
  }
}

export default {
  getHandlerConnect,
  getHandlerCallback,
  getHandlerProfile,
}

