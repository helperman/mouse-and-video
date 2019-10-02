//let popupCreated = false;
let scriptExecuted = false;
let popupId, tabIndex, windowId, popupTabId;
chrome.runtime.onMessage.addListener(function(message, sender){
	if(message.mostraIcone){
		chrome.pageAction.show(sender.tab.id);
	}
	else if(message.popup){
		if(message.acao === "criar"){
			tabIndex = sender.tab.index;
			windowId = sender.tab.windowId;
			browser.windows.create({
				width: 370,
				height: 230,
				type: "popup",
				tabId: sender.tab.id
			}).then(info => {
				popupTabId = info.tabs[0].id;
				popupId = info.id;
				browser.windows.update(
					info.id,
					{
						left: screen.width - 370,
						top: screen.height - 250
					}
				);
			});
		}
		else if(message.acao === "fechar"){
			// Move back to main windows
			browser.tabs.move(
				popupTabId,
				{
					windowId: windowId,
					index: tabIndex
				}
			).then(info => {
				browser.tabs.highlight({
					windowId: windowId,
					tabs: [info[0].index]
				});
				popupId = tabIndex = windowId = undefined;
			});
		}
	}

	// Aqui vamos verificar se a extensão deve ser desativada neste site.
	// Se o usuário desativou então o domain fica guardado.
	let domain = sender.tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[0];
	chrome.storage.local.get(domain, function(info){
		// Se não tiver nada então não desativou
		if(Object.keys(info).length == 0) {
			chrome.tabs.sendMessage(
				sender.tab.id,
				{
					run: true
				}
			);
		}
		else{
			setIcon("disabled", sender.tab.id);
		}
	});
});

chrome.pageAction.onClicked.addListener(function(tab){
	let domain = tab.url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im)[0];
	chrome.storage.local.get(domain, function(info){
		if(Object.keys(info).length > 0) {
			chrome.storage.local.remove(domain);
			chrome.tabs.sendMessage(
				tab.id,
				{
					run: true
				});
			setIcon("enabled", tab.id);
		}
		else{
			// Usuário desativou a extensão, então manda uma mensagem para apagar o listener.
			chrome.tabs.sendMessage(
				tab.id,
				{
					disabled: true
				});
			chrome.storage.local.set({
				[domain]: domain
			});
			setIcon("disabled", tab.id);
		}
	});
});

function setIcon(status, id){
	chrome.pageAction.setIcon({
		tabId: id,
		path:{
			16: "icons/"+status+"-16.png",
			32: "icons/"+status+"-32.png"
		}
	});

	chrome.pageAction.setTitle({
		tabId: id,
		title: chrome.i18n.getMessage(status)
	});
}
