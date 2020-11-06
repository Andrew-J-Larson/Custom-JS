// ==UserScript==
// @name         BitDay (Legacy) - Seconds Tick Blink
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  Makes the colon blink to each second.
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Seconds%20Tick%20Blink.user.js
// @grant        none
// ==/UserScript==

var clockText = document.querySelector("#container > div.clock > h3");

// need mutation observer to sync with time updates
let observer = new MutationObserver(mutations => {
  // watch the clock for changes (not always visible)
  for(let mutation of mutations) {
    // only change the text if we haven't already
    let addedNodes = mutation.addedNodes;
    if (addedNodes && addedNodes.length == 1 && addedNodes[0].textContent.indexOf(':') > -1) {
      setTimeout(function() {
        clockText.innerText = clockText.innerText.replace(':', ' ');
      }, 500);
    }
  }
});

// configuration of the observer:
let config = { childList: true, characterData: true, subtree: true };

// pass in the target node, as well as the observer options
observer.observe(clockText, config);