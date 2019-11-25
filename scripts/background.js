// //let popupWindowId, popupTabId, originalPosition, activeTabId
// let popupTabId, originalPosition, activeTabId
let run = true
let popups = {}

chrome.runtime.onMessage.addListener(function (message, sender) {
  // listener for the shortcut
  browser.commands.onCommand.addListener((command) => {

  })

  /* The user did a Wheel Down + Wheel Up + Wheel Down combo.
  Send a message to all tabs asking if they are playing videos. */
  if (message.combo_fired) {
    /* This is a list that will contain the title of the tabs
    that respond to our message along with a screenshot of the video. */
    const videosPlaying = new Set()
    browser.tabs.query({}).then((tabs) => {
      for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, { playing_video: '?' }).then((response) => {
          // The tab will only respond if the answer is positive.
          if (response) {
            const videoImgSrc = response.response
            videosPlaying.add([tab.title, videoImgSrc, tab.id, tab.index])

            // Timeout is 500 milliseconds for all tabs to respond.
            if (run) {
              run = false
              setTimeout(() => {
                /* If there's more than one tab playing a video
                let the user choose one to move to the popup. */
                if (videosPlaying.size > 1) {
                  browser.tabs.query({
                    active: true
                  }).then((activeTab) => {
                    browser.tabs.sendMessage(
                      activeTab[0].id,
                      {
                        choose_video: true,
                        videos: videosPlaying
                      }
                    ).then(() => {
                      run = true
                      videosPlaying.clear()
                    })
                  })
                } else if (videosPlaying.size === 1) {
                  open_popup(tab.id, tab.index)
                  run = true
                  videosPlaying.clear()
                }
              }, 500)
            }
          }
        })
      }
    })
  }

  // Receive the information of video the user selected to open in the popup
  if (message.video_selected) {
    open_popup(message.video_selected.tabId, message.video_selected.tabIndex)
  }

  if (message.mostraIcone) {
    chrome.pageAction.show(sender.tab.id)
  } else if (message.popup) {
    if (message.acao === 'criar') {
      browser.windows.create({
        width: 370,
        height: 230,
        type: 'popup',
        tabId: sender.tab.id
      }).then(info => {
        popups[info.id] = {
          tabIndex: sender.tab.index,
          windowId: sender.tab.windowId,
          popupTabId: info.tabs[0].id
        }
        browser.windows.update(
          info.id,
          {
            left: screen.width - 390,
            top: screen.height - 255
          }
        )
      })
    } else if (message.acao === 'fechar') {
      browser.windows.getCurrent().then(winInfo => {
        // Move back to main window
        browser.tabs.move(
          popups[winInfo.id].popupTabId,
          {
            windowId: popups[winInfo.id].windowId,
            index: popups[winInfo.id].tabIndex
          }
        ).then(info => {
          if (message.activatePopupTab) {
            browser.tabs.highlight({
              windowId: popups[winInfo.id].windowId,
              tabs: [info[0].index]
            })
          }
        })
      })
    }
  }

  // Aqui vamos verificar se a extensão deve ser desativada neste site.
  // Se o usuário desativou então o domain fica guardado.
  const domain = sender.tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[0]
  chrome.storage.local.get(domain, function (info) {
    // Se não tiver nada então não desativou
    if (Object.keys(info).length === 0) {
      chrome.tabs.sendMessage(
        sender.tab.id,
        {
          run: true
        }
      )
    } else {
      setIcon('disabled', sender.tab.id)
    }
  })
})

chrome.pageAction.onClicked.addListener(function (tab) {
  const domain = tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[0]
  chrome.storage.local.get(domain, function (info) {
    if (Object.keys(info).length > 0) {
      chrome.storage.local.remove(domain)
      chrome.tabs.sendMessage(
        tab.id,
        {
          run: true
        })
      setIcon('enabled', tab.id)
    } else {
      // Usuário desativou a extensão, então manda uma mensagem para apagar o listener.
      chrome.tabs.sendMessage(
        tab.id,
        {
          disabled: true
        })
      chrome.storage.local.set({
        [domain]: domain
      })
      setIcon('disabled', tab.id)
    }
  })
})

function setIcon (status, id) {
  chrome.pageAction.setIcon({
    tabId: id,
    path: {
      16: 'icons/' + status + '-16.png',
      32: 'icons/' + status + '-32.png'
    }
  })

  chrome.pageAction.setTitle({
    tabId: id,
    title: chrome.i18n.getMessage(status)
  })
}

function open_popup (id, index) {
  browser.tabs.sendMessage(id, {
    open_popup: true
  })
}
