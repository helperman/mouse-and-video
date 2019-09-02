let popupCreated = false;
let scriptExecuted = false;
let popupId, tabIndex, windowId, startTimePopup;
chrome.runtime.onMessage.addListener(function(message, sender){
	if(message.mostraIcone){
		chrome.pageAction.show(sender.tab.id);
	}
	else if(message.playing){
		
		// This code will be executed when the video starts playing on the popup
		// it will pause the video on the tab
		if(popupId && scriptExecuted === false){
			scriptExecuted = true;
			browser.tabs.query({
				index: tabIndex,
				windowId: windowId
			}).then((tab) => {
				browser.tabs.executeScript(
					tab[0].id,
					{
						code: `document.querySelector('video[playing_on_popup]').pause();
							   var valuesWhenPaused = [document.querySelector('video[playing_on_popup]').currentTime,
														  document.querySelector('video[playing_on_popup]').volume,
														  document.querySelector('video[playing_on_popup]').playbackRate];
														  valuesWhenPaused;`
						// code: `document.querySelector('video[playing_on_popup]').pause();
						// 	   var timeWhenPaused = document.querySelector('video[playing_on_popup]').currentTime;timeWhenPaused;`
					}
				).then((result) => {
					// When the video pauses we get the currentTime and send it to the popup
					browser.tabs.query({
						windowId: popupId
					}).then((tab) => {
						browser.tabs.executeScript(
							tab[0].id,
							{
								code: `document.querySelector('video').currentTime =${result[0][0]};
									   document.querySelector('video').volume =${result[0][1]};
									   document.querySelector('video').playbackRate =${result[0][2]};`
							}
						);
					});
				});
			});
		}
	}
	else if(message.popup){
		if(message.acao === "criar" && popupCreated == false){
			tabIndex = sender.tab.index;
			windowId = sender.tab.windowId;
			popupCreated = true;
			let videoId = sender.tab.url.substring(sender.tab.url.length - 11);
			browser.windows.create({
				width: 350,
				height: 230,
				type: "popup",
				url: "https://www.youtube.com/embed/" + videoId + "?start=" + message.tempo + "&autoplay=1",
				titlePreface: ":: Mouse & Video :: "
			}).then(info => {
				popupId = info.id;
				browser.windows.onRemoved.addListener(winId => {
					if(winId === info.id) {
						// Reset variables
						popupCreated = scriptExecuted = false;
						popupId = tabIndex = windowId = undefined;						
					}
				});

				browser.windows.update(
					info.id,
					{
						left: screen.width - 350,
						top: screen.height - 250
					}
				);
			});
		}
		else if(message.acao === "fechar"){
			browser.windows.remove(popupId);
			browser.tabs.highlight({
				windowId: windowId,
				tabs: [tabIndex]
			}).then(() => {
				browser.tabs.query({active:true}).then((info) => {
					browser.tabs.executeScript(
						info[0].id,
						{
						code: `document.querySelector("video[playing_on_popup]").currentTime = ${message.tempo};
							   document.querySelector("video[playing_on_popup]").play();
							   document.querySelector("video[playing_on_popup]").setAttribute("playing_on_popup", false);`
						}
					);		
				});
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
