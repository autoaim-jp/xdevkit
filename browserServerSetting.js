/* /xdevkit/browserServerSetting.js */
export const apiEndpoint = '/f'
export const labelList = {
  scope: {
    read: {
      'emailAddress': 'メールアドレスの取得',
      'userName': 'ユーザー名の取得',
      'serviceUserId': 'ユーザーIDの取得',
    },
    write: {
    },
    other: {
      isRequired: '必須',
    },
  },
  error: {
    undefined: 'error',
    handle_credential_credential: 'メールアドレスまたはパスワードが違います。',
    handle_user_add_register: 'メールアドレスは既に登録されています。',
    handle_xlogin_code_session: 'セッションが不正です。',
  },
}

export const statusList = {
  OK: 1,
  SUCCESS: 100,
  LOGIN_SUCCESS: 101,

  INVALID: 1000,
  NOT_ENOUGH_PARAM: 1001,
  INVALID_SESSION: 1002,

  API_ERROR: 1100,
  INVALID_OIDC_ISSUER: 1101,
}

const settingList = {
  apiEndpoint,
  labelList,
  statusList,
}

export const get = (...keyList) => {
  const constantList = keyList.reduce((prev, curr) => {
    prev[curr] = settingList[curr]
    return prev
  }, {})
  for(const key of keyList) {
    if(!constantList[key]) {
      throw new Error('[error] undefined setting constant: ' + key)
    }
  }
  return constantList
}

export default settingList

