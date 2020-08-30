// ==UserScript==
// @name         BitDay (Legacy) - Seconds Tick Blink
// @namespace    https://thealiendrew.github.io/
// @version      0.0.1
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/BitDay/BitDay%20(Legacy)%20-%20Seconds%20Tick%20Blink.user.js
// @description  Makes the colon blink to each second.
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @grant        none
// ==/UserScript==

var clockText = document.querySelector("#container > div.clock > h3");
setInterval(function() {
  clockText.innerText = clockText.innerText.replace(':', ' ');
}, 1000);