/* /_lib/_xdevkit/_lib/index.js */

/* crypto */
export const getRandomStr = (len) => {
  return btoa(crypto.getRandomValues(new Uint8Array(len))).slice(0, len)
}

/* url */
export const getSearchQuery = () => {
  const searchQuery = {}
  window.location.search.replace(/^\?/, '').split('&').forEach((row) => {
    const kv = row.split('=')
    const [key, value] = kv
    searchQuery[key] = value
  })
  return searchQuery
}

