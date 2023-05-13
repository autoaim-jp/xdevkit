/**
 * /xdevkit/server/output.js
 *
 * @file 外部へのリクエストやレスポンスの関数を定義するファイル
 * @namespace output
 */


/**
 * HTTPリクエストの処理を終了する。
 *
 * @memberof output
 * @param {Object} req
 * @param {Object} res
 * @param {Object} handleResult
 */
const endResponse = ({ req, res, handleResult, ERROR_PAGE }) => {
  console.log('_endResponse error:', handleResult.error)
  req.session.auth = handleResult.session

  if (handleResult.response) {
    return res.json(handleResult.response)
  } if (handleResult.redirect) {
    return res.redirect(handleResult.redirect)
  }
  return res.redirect(ERROR_PAGE)
}


export default {
  endResponse,
}

