/**
 * HTTPリクエストの処理を終了する。
 *
 * @memberof output
 * @param {Object} req
 * @param {Object} res
 * @param {Object} handleResult
 */
const endResponse = (req, res, handleResult) => {
  console.log('_endResponse error:', handleResult.error)
  req.session.auth = handleResult.session

  if (handleResult.response) {
    return res.json(handleResult.response)
  } if (handleResult.redirect) {
    return res.redirect(handleResult.redirect)
  }
  return res.redirect(mod.setting.url.ERROR_PAGE)
}


export default {
  endResponse,
}

