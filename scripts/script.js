// Checar se existem vídeos na página para mostrar o ícone da extensão na barra de endereço.
let observer = new MutationObserver(function(mutationList, observer){
		const videos = document.querySelectorAll("video");
		if(videos.length > 0){
			chrome.runtime.sendMessage({
				mostraIcone: true
			});
			observer.disconnect();

			// Só roda roda o script se tiver vídeo na página
			chrome.runtime.onMessage.addListener(function(message){
				if(message.run){
					run();
				}
				else if(message.disabled){
					document.onwheel = null;
					document.pvwm.onwheel = null;
				}
			});
		}
});
var config = { attributes: true, childList: true, subtree: true };
observer.observe(document, config);

function run(){
	let left, middle, right, multiplier, mode, fs, firstMov, popElement;
	let brightness = 1;
	let volume = 0;
	let popup = {
		page: (action) => {
			for(let child of document.body.children){
				if(child !== document.mv_popup_element){
					if(action === "hide_all"){
						child.style.display = "none";
						//child.style.visibility = "hidden";
					}
					else{
						child.style.display = "initial";
						//child.style.visibility = "visible";
					}
				}
			}
		},
		action: (action) => {
			chrome.runtime.sendMessage({
				popup: true,
				acao: action
			});
		}
	}


	chrome.storage.local.get(function(options){
		multiplier = options.volume || 3;
		left = options.left || 5;
		middle = options.middle || 2;
		right = options.right || 10;
		mode = options.mode || "both";
		fs = options.fs;
	});

	chrome.storage.onChanged.addListener(function(changes){
		if(!changes["always_disabled"]){

			if(changes.volume){
				multiplier = changes.volume.newValue;
			}
			else if(changes.left){
				left = changes.left.newValue;
			}
			else if(changes.right){
				right = changes.right.newValue;
			}
			else if(changes.mode){
				mode = changes.mode.newValue;
			}
			else if(changes.fs){
				fs = changes.fs.newValue;
			}
			else if(changes.middle){
				middle = changes.middle.newValue;
			}
		}
	});


	// Pause the video only when it starts playing on the popup
	document.querySelector("video").onplaying = () => {
		browser.runtime.sendMessage({
			playing: true
		});
	}

	function mudaVolume(movimento, video){
		if(video.muted){
			video.muted = false;
			video.volume = 0;
		}
		volume = video.volume;
		volume += 1 * (movimento < 0 ? (1 * (0.01 * multiplier)) : (-1 * (0.01 * multiplier)));
		video.volume = parseFloat(Math.min(Math.max(volume, 0), 1).toFixed(2));
	}

	function mudaVelocidade(movimento, video){
		firstMov = movimento;
		setTimeout(function(mov){
			if(firstMov !== mov){
				video.playbackRate = video.defaultPlaybackRate;
			}
		},150, firstMov);
		video.playbackRate += 1 * (movimento < 0 ? (1 * 0.25) : (-1 * 0.25));
		video.playbackRate = parseFloat(Math.min(Math.max(video.playbackRate, 0.25), 4).toFixed(2));
	}

	function mudaTempo(cX, movimento, video){
		if (cX <= video.clientWidth/3){
			video.currentTime +=  1 * (movimento < 0 ? (1 * left) : (-1 * left));
		}
		else if(cX > video.clientWidth/3 && cX <= (video.clientWidth/3)*2){
			video.currentTime +=  1 * (movimento < 0 ? (1 * middle) : (-1 * middle));
		}
		else{
			video.currentTime +=  1 * (movimento < 0 ? (1 * right) : (-1 * right));
		}
	}

	function wheel(e, vid){
		if(!document.mv_pause_function){
			e.preventDefault();

			// fixXX
			let cX = e.clientX - Math.round(vid.getBoundingClientRect().x);
			let movimento = e.deltaY;

			brightness += 1 * (movimento < 0 ? (1 * 0.1) : (-1 * 0.1));
			brightness = parseFloat(Math.min(Math.max(brightness, 0), 1).toFixed(1));

			if (e.shiftKey) {
				vid.style.filter =  "brightness("+brightness+")";
			}
			else{
				if(mode == "ponly"){
					vid.currentTime +=  1 * (movimento < 0 ? (1 * middle) : (-1 * middle));
				}
				else if(mode == "vonly"){
					mudaVolume(movimento, vid);
				}
				else{
					if(e.offsetY <= vid.clientHeight / 2){
						if(cX < vid.clientWidth - ((90/100) * vid.clientWidth)){
							if(movimento > 0){
								/* Here we check whether we are in fullscreen mode or not.
								The popup must open only when the video is not in fullscreen. */
								if(document.fullscreenElement) {
									document.exitFullscreen();

									// We need this so that when the user scrolls out of fullscreen
									// the popup doesn't open up unwantedly
									document.mv_pause_function = true;
									setTimeout(() => {document.mv_pause_function = false;}, 500);
								}
								else{
									open_popup();
								}
							}
							else if(movimento < 0){

								// Scrolling up in this area from the popup will close it and return to the main window
								if(document.mv_playing_on_popup){
									close_popup();
								}
								else{
									if (document.fullscreenElement == null) {
										(function(x){
											document.dispatchEvent(new KeyboardEvent('keydown', {'key':'f', 'view': window, 'code': 'KeyF', 'keyCode':70, 'bubbles':true}));
											setTimeout(function(){
												if(document.fullscreenElement == null){
													const attribs = [...popElement.querySelectorAll("*")]
													.map(node => [...node.attributes])
													.reduce((acc, cur) => acc.concat(cur), [])
													.filter(attrib => attrib.nodeValue.toLowerCase().replace(" ","").indexOf("fullscreen") >= 0)
													.filter(attrib => attrib.ownerElement.clientWidth != x.clientWidth &&
															attrib.ownerElement.clientHeight != x.clientHeight);
													for(let x of attribs){
														try{
															if(document.fullscreenElement == null)
																x.ownerElement.click();
														}
														catch(e){
														}
													}
													setTimeout(() => {
														if(document.fullscreenElement == null){
															x.requestFullscreen();
														}
													},100);
												}
											},100)
										}(vid));
									}
								}
							}
							else{
								mudaVolume(movimento, vid);
							}
						}
						else if(cX > vid.clientWidth - ((10/100) * vid.clientWidth)){
							mudaVelocidade(movimento, vid);
						}
						else{
							mudaVolume(movimento, vid);
						}
					}
					else{
						mudaTempo(cX, movimento, vid);
					}
				}
			}
		}
	}

	function open_popup(){

		if(!document.mv_playing_on_popup){

			document.mv_playing_on_popup = true;

			// Pause execution of the wheel function while transitioning to popup
			document.mv_pause_function = true;

			/* Making 'body' fullscreen is
			necessary to free up the upper part of the popup window.
			Otherwise the hidden tab bar will mess things up */
			document.body.onfullscreenchange = () => {
				if(document.fullscreenElement) {
					popup.action("criar");
					document.body.insertBefore(document.mv_popup_element, document.body.firstChild);
					document.mv_popup_element.className += " popup_style";

					// Hide scrollbar
					document.documentElement.style.overflow = "hidden";

					// Show only the video player and hide everything else in the popup
					popup.page("hide_all");

					setTimeout(() => {
						document.mv_pause_function = false;
					}, 500);
					document.body.onfullscreenchange =  null;
				}
			}
			document.body.requestFullscreen();
		}
	}

	function close_popup(){

		document.mv_playing_on_popup = false;

		// Pause execution of the wheel function while transitioning out of popup
		document.mv_pause_function = true;
		document.mv_pause_main = true;

		popup.page("show_all");
		popup.action("fechar");
		document.mv_popup_element.classList.remove("popup_style");

		// Show scrollbar
		document.documentElement.style.overflow = "initial";

		// Use nextElementSibling
		if(document.mv_next_sibling){
			document.mv_parent_node.insertBefore(document.mv_popup_element, document.mv_next_sibling);
		}
		else{
			// Use parentNode
			document.mv_parent_node.appendChild(document.mv_popup_element);
		}

		//Add delay to prevent fullscreen from happening when closing the popup
		setTimeout(() => {
			document.mv_popup_element.scrollIntoView();
			document.mv_pause_function = false;
		}, 500);

	}

	function main(e){
		/* document.mv_pause_main is useful when transitioning to the popup.
		Otherwise popElement will change when scrolling too fast*/
		if(!document.mv_pause_function && !e.target.mv_on){
			for(let vid of document.querySelectorAll("video")){
				if(!vid.paused
				&& e.clientY >= vid.getBoundingClientRect().y
				&& e.clientY <= vid.getBoundingClientRect().y + vid.clientHeight
				&& e.clientX >= vid.getBoundingClientRect().x
				&& e.clientX <= vid.getBoundingClientRect().x + vid.clientWidth
				&& (e.target.clientHeight === vid.clientHeight || e.target.clientWidth === vid.clientWidth)){
					e.preventDefault();

					// Get the oldest parent whose width and height matches those of the video tag
					// This will be useful to try to guess which element to click to enter fullscreen
					// and also to adapt it to work in the popup
					popElement = [...document.elementsFromPoint(e.x, e.y)
						.filter(el => el.contains(vid) && el.clientWidth == e.target.clientWidth && el.clientHeight == e.target.clientHeight)]
						.pop();

					/* ********* Popup info START ********* */

					// This is the only element that will be shown in the popup
					//document.mv_popup_element = popElement;
					document.mv_popup_element = vid;

					/* This will be used to know where to place the element
					when the popup closes */
					document.mv_next_sibling = document.mv_popup_element.nextElementSibling;
					document.mv_parent_node = document.mv_popup_element.parentNode;

					/* ********* Popup info END ********* */

					/* This is a flag to skip this video because
					we already atached the wheel function to it */
					e.target.mv_on = true;

					e.target.onwheel = (e) => wheel(e, vid);
					document.pvwm = e.target;
					break;
				}
			}
		}
	}

	document.onwheel =  main;
}