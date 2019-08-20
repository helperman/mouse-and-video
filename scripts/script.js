// Checar se existem vídeos na página para mostrar o ícone da extensão na barra de endereço.
let observer = new MutationObserver(function(mutationList, observer){
		let videos = document.querySelectorAll("video");
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
	let left, middle, right, multiplier, mode, fs, firstMov;
	let brightness = 1;
	let volume = 0;

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

	function wheel(e){
		
		// fixXX
		let cX = e.clientX - Math.round(this.video.getBoundingClientRect().x);
		let movimento = e.deltaY;
		
		brightness += 1 * (movimento < 0 ? (1 * 0.1) : (-1 * 0.1));
		brightness = parseFloat(Math.min(Math.max(brightness, 0), 1).toFixed(1));
		if (e.shiftKey) { 
			this.video.style.filter =  "brightness("+brightness+")" 
		}
		else{
			if(mode == "ponly"){
				this.video.currentTime +=  1 * (movimento < 0 ? (1 * middle) : (-1 * middle));
			}
			else if(mode == "vonly"){
				mudaVolume(movimento, this.video);
			}
			else{
				if(e.offsetY <= this.video.clientHeight / 2){
					if(cX < this.video.clientWidth - ((90/100) * this.video.clientWidth)){
						// Caso a função de tela cheia não esteja habilitada, usa o espaço correspondente para mudar o volume
						if(fs && movimento > 0){
							document.exitFullscreen();
						}
						else if(fs && movimento < 0){
							//Modo tela cheia
							if (document.fullscreenElement == null) {
								(function(x){
									document.dispatchEvent(new KeyboardEvent('keydown', {'key':'f', 'view': window, 'code': 'KeyF', 'keyCode':70, 'bubbles':true}));
									setTimeout(function(){
										if(document.fullscreenElement == null){
											const attribs = [...document.elementsFromPoint(e.x, e.y)
												.filter(el => el.clientWidth == x.clientWidth && el.clientHeight == x.clientHeight)
												.pop()
												.querySelectorAll("*")]
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
								}(this.video));
							}
						}
						else{
							mudaVolume(movimento, this.video);
						}
					}
					else if(cX > this.video.clientWidth - ((10/100) * this.video.clientWidth)){
						mudaVelocidade(movimento, this.video);
					}
					else{
						mudaVolume(movimento, this.video);
					}				
				}
				else{
					mudaTempo(cX, movimento, this.video);
				}
			}
		}
	}

	document.onwheel =  function(e) {
		for(let vid of document.querySelectorAll("video")){
			if(e.clientY >= vid.getBoundingClientRect().y 
			&& e.clientY <= vid.getBoundingClientRect().y + vid.clientHeight 
			&& e.clientX >= vid.getBoundingClientRect().x 
			&& e.clientX <= vid.getBoundingClientRect().x + vid.clientWidth
			&& (e.target.clientHeight === vid.clientHeight || e.target.clientWidth === vid.clientWidth)){				
				e.preventDefault();
				e.target.video = vid;
				e.target.onwheel = wheel;
				document.pvwm = e.target;
			}
		}			
	}	
}