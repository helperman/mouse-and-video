window.onload = function () {
  document.querySelector('#fb').textContent = chrome.i18n.getMessage('fb_title')
  document.querySelector('#left').textContent = chrome.i18n.getMessage('left')
  document.querySelector('#middle').textContent = chrome.i18n.getMessage('middle')
  document.querySelector('#right').textContent = chrome.i18n.getMessage('right')
  document.querySelector('#ponly').textContent = chrome.i18n.getMessage('ponly')
  document.querySelector('#vonly').textContent = chrome.i18n.getMessage('vonly')
  document.querySelector('#both').textContent = chrome.i18n.getMessage('both')
  document.querySelector('#mode').textContent = chrome.i18n.getMessage('mode_title')
  document.querySelector('#shortcut').textContent = chrome.i18n.getMessage('shortcut')

  for (const input of document.querySelectorAll('[name]')) {
    input.addEventListener('blur', function (e) {
      const name = input.name
      let saveValue
      if (e.target.value === 'shortcut') {
        saveValue = e.target.checked
      } else {
        saveValue = e.target.value
      }
      chrome.storage.local.set({
        [name]: saveValue
      })
    })
  }

  chrome.storage.local.get(function (options) {
    if (options.mode === undefined) options.mode = 'both'
    if (options.shortcut === undefined) options.shortcut = true
    document.querySelector("[name='left'").value = options.left || 5
    document.querySelector("[name='middle'").value = options.middle || 2
    document.querySelector("[name='right'").value = options.right || 10
    document.querySelector('#shortcut').checked = options.shortcut
    document.querySelector('#' + options.mode).checked = true
  })
}
