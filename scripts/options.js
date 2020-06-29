window.onload = function () {
  function saveChanges(option, value) {
    chrome.storage.local.set({
      [option]: value,
    });
  }
  const pipCheckbox = document.querySelector("#pip");
  const shortcutCheckbox = document.querySelector("#shortcut");
  const incrementsLegend = document.querySelector("#fb");
  const leftInputLabel = document.querySelector("label[for=left]");
  const middleInputLabel = document.querySelector("label[for=middle]");
  const rightInputLabel = document.querySelector("label[for=right]");
  const modeLegend = document.querySelector("#mode");

  document.querySelector(
    "#mode_seek_middle"
  ).textContent = chrome.i18n.getMessage("mode_seek_middle");
  document.querySelector("#mode_volume").textContent = chrome.i18n.getMessage(
    "mode_volume"
  );
  document.querySelector("#mode_seek_all").textContent = chrome.i18n.getMessage(
    "mode_seek_all"
  );
  document.querySelector(
    "#mode_everything"
  ).textContent = chrome.i18n.getMessage("mode_everything");

  modeLegend.textContent = chrome.i18n.getMessage("mode_title");
  incrementsLegend.textContent = chrome.i18n.getMessage("fb_title");
  leftInputLabel.textContent = chrome.i18n.getMessage("left");
  middleInputLabel.textContent = chrome.i18n.getMessage("middle");
  rightInputLabel.textContent = chrome.i18n.getMessage("right");
  shortcutCheckbox.textContent = chrome.i18n.getMessage("shortcut");
  pipCheckbox.textContent = chrome.i18n.getMessage("pip");

  for (const checkbox of document.querySelectorAll("input[type=checkbox]")) {
    checkbox.addEventListener("click", (e) => {
      if (checkbox.id == "pip") {
        // Disable other PIP related options if user disables it
        if (!e.target.checked) {
          shortcutCheckbox.disabled = true;
        } else {
          shortcutCheckbox.disabled = false;
        }
      }
    });
  }

  for (const input of document.querySelectorAll("input")) {
    input.addEventListener("blur", (e) => {
      let value = e.target.value;
      if (e.target.type == "checkbox") value = e.target.checked;
      saveChanges(e.target.name, value);
    });
  }

  chrome.storage.local.get(function (options) {
    if (options.mode === undefined) options.mode = "mode_everything";
    if (options.shortcut === undefined) options.shortcut = true;
    if (options.pip === undefined) options.pip = true;
    document.querySelector("[name='left'").value = options.left || 5;
    document.querySelector("[name='middle'").value = options.middle || 2;
    document.querySelector("[name='right'").value = options.right || 10;
    pipCheckbox.checked = options.pip;
    shortcutCheckbox.checked = options.shortcut;
    if (!pipCheckbox.checked) {
      shortcutCheckbox.disabled = true;
    }
    document.querySelector("#" + options.mode).checked = true;
  });
};
