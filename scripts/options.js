window.onload = function(){
	
	document.querySelector("#volume").textContent = chrome.i18n.getMessage("volume_title");
	document.querySelector("#slow").textContent = chrome.i18n.getMessage("slow");
	document.querySelector("#medium").textContent = chrome.i18n.getMessage("medium");
	document.querySelector("#fast").textContent = chrome.i18n.getMessage("fast");
	document.querySelector("#fb").textContent = chrome.i18n.getMessage("fb_title");
	document.querySelector("#left").textContent = chrome.i18n.getMessage("left");
	document.querySelector("#middle").textContent = chrome.i18n.getMessage("middle");
	document.querySelector("#right").textContent = chrome.i18n.getMessage("right");
	document.querySelector("#ponly").textContent = chrome.i18n.getMessage("ponly");
	document.querySelector("#vonly").textContent = chrome.i18n.getMessage("vonly");
	document.querySelector("#both").textContent = chrome.i18n.getMessage("both");
	document.querySelector("#mode").textContent = chrome.i18n.getMessage("mode_title");
	document.querySelector("#allowFS").textContent = chrome.i18n.getMessage("allowFS");
	
	// Salvar o modo de uso e o checkbox da tela cheia
	for(let input of document.querySelectorAll("input")){
		input.addEventListener("click", function(e){
			if(this.id != "allowFS"){
				chrome.storage.local.set({
					mode: this.id
				});
			}
			else{
				chrome.storage.local.set({
					fs: this.checked
				});				
			}
		});
	}

	for(let input of document.querySelectorAll("[name]")){
		input.addEventListener("blur", function(e){
			let name = input.name;
			chrome.storage.local.set({
				[name]: e.target.value
			});
		});
	}
	
	chrome.storage.local.get(function(options){
		if(options.mode === undefined) options.mode = "both";
 		//document.querySelector("select").selectedIndex = options.index || 1;
		document.querySelector("[name='left'").value = options.left || 5;
		document.querySelector("[name='middle'").value = options.middle || 2;
		document.querySelector("[name='right'").value = options.right || 10;
		document.querySelector("#"+options.mode).checked = true;
		document.querySelector("#allowFS").checked = options.fs || false;
	});
	
	document.querySelector("select").onchange = function(e){
		chrome.storage.local.set({
 			volume: e.target.value
		});
	}
}
