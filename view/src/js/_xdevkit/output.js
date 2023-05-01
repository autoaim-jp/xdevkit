/* /_lib/_xdevkit/output.js */

/* element */
export const applyElmList = (query, f, parent = document) => {
  Object.values(parent.querySelectorAll(query)).forEach((elm) => {
    f(elm)
  })
}

/* modal */
const _closeModal = () => {
  applyElmList('[data-id="modal"], #modalBackground', (elm) => {
    elm.classList.add('hidden')
  })
}

export const showModal = (modalElm, cancelButtonIsVisible = false, onConfirm = () => {}) => {
  if (modalElm.id === 'modalTemplate') {
    modalElm.id = ''
  }
  document.body.appendChild(modalElm)
  _closeModal()

  setTimeout(() => {
    applyElmList('[data-id="modalClose"], [data-id="modalCancelButton"]', (elm) => {
      elm.onclick = _closeModal
    }, document)

    if (cancelButtonIsVisible) {
      modalElm.querySelector('[data-id="modalCancelButton"]').classList.remove('hidden')
    } else {
      modalElm.querySelector('[data-id="modalCancelButton"]').classList.add('hidden')
    }
    modalElm.querySelector('[data-id="modalConfirmButton"]').onclick = () => {
      if (typeof onConfirm === 'function') {
        onConfirm()
      }
      _closeModal()
    }
    modalElm.classList.remove('hidden')
    document.querySelector('#modalBackground').classList.remove('hidden')
    modalElm.querySelector('[data-id="modalContent"]').scrollTop = 0
    modalElm.querySelector('[data-id="modalCard"]').onclick = (e) => {
      e.stopPropagation()
    }
    modalElm.onclick = (e) => {
      e.stopPropagation()
      _closeModal()
    }
  }, 100)
}

export const getErrorModalElmAndSetter = () => {
  const modalTemplateElm = document.querySelector('#modalTemplate')
  const modalElm = modalTemplateElm.cloneNode(true)

  modalElm.querySelector('[data-id="modalTitle"]').innerText = 'エラー'

  const labelP = document.createElement('p')
  labelP.innerText = 'エラーが発生しました。'
  modalElm.querySelector('[data-id="modalContent"]').appendChild(labelP)

  const setContent = (textStr, errorLabelList) => {
    labelP.innerText = errorLabelList[textStr] || textStr
  }

  return { modalElm, setContent }
}

/* tab */
export const createTabMenuContainer = () => {
  const tabMenuContainerElm = document.querySelector('#tabMenuContainerTemplate').cloneNode(true)
  tabMenuContainerElm.id = ''
  tabMenuContainerElm.classList.remove('hidden')
  return tabMenuContainerElm
}
const _showTabContainer = ({ activeTabContainerId, tabList }) => {
  Object.keys(tabList).forEach((tabContainerId) => {
    const tabContainerElm = document.querySelector(`#${tabContainerId}`)
    tabContainerElm.classList.add('hidden')
  })
  const tabContainerElm = document.querySelector(`#${activeTabContainerId}`)
  tabContainerElm.classList.remove('hidden')
}

export const showTabButton = ({ tabMenuContainerElm, tabList, activeTabContainerId }) => {
  const getOnClickTabButton = ({ newActiveTabContainerId }) => {
    return (e) => {
      if (e) {
        e.preventDefault()
      }
      showTabButton({ tabMenuContainerElm, tabList, activeTabContainerId: newActiveTabContainerId })
      _showTabContainer({ tabList, activeTabContainerId: newActiveTabContainerId })
    }
  }
  tabMenuContainerElm.clearChildren()
  Object.entries(tabList).forEach(([tabContainerId, value]) => {
    let tabItemElm = null
    if (tabContainerId === activeTabContainerId) {
      tabItemElm = document.querySelector('#tabActiveItemTemplate').cloneNode(true)
    } else {
      tabItemElm = document.querySelector('#tabItemTemplate').cloneNode(true)
    }
    tabItemElm.id = ''
    tabItemElm.classList.remove('hidden')
    tabItemElm.children[0].innerText = value
    tabItemElm.children[0].onclick = getOnClickTabButton({ newActiveTabContainerId: tabContainerId })
    tabMenuContainerElm.appendChild(tabItemElm)
    if (tabContainerId === activeTabContainerId) {
      _showTabContainer({ tabList, activeTabContainerId: tabContainerId })
    }
  })
}

/* common all page */
export const switchLoading = (isVisible) => {
  const loadingElm = document.querySelector('#loading')
  if (!loadingElm) {
    return
  }

  if (isVisible) {
    loadingElm.classList.remove('hidden')
  } else {
    loadingElm.classList.add('hidden')
  }
}

export const reloadXloginLoginBtn = (clientId) => {
  const getOnClickXloginButtonHandler = () => {
    const handler = (elm) => {
      const { permission } = elm.dataset
      let queryPart = ''
      if (permission !== undefined) {
        queryPart += `&requestScope=${permission.replace(/\$CLIENT_ID/g, clientId)}`
      }
      return () => {
        window.location.href = `/f/xlogin/connect?redirectAfterAuth=/mypage${queryPart}`
      }
    }

    return handler
  }

  const setOnClickXloginButton = ({ onClickXloginButtonHandler }) => {
    document.querySelectorAll('[data-id="xloginLoginBtn"]').forEach((elm) => {
      elm.onclick = onClickXloginButtonHandler(elm)
    })
  }

  const onClickXloginButtonHandler = getOnClickXloginButtonHandler()
  setOnClickXloginButton({ onClickXloginButtonHandler })
}

