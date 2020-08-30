// ==UserScript==
// @name         BitDay (Legacy) - Minimal GUI
// @namespace    https://thealiendrew.github.io/
// @version      0.0.1
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/BitDay/BitDay%20(Legacy)%20-%20Minimal%20GUI.user.js
// @description  Removes all GUI, except the clock area.
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @grant        none
// ==/UserScript==

var donateBtn = document.querySelector(".donate");
var footer = document.querySelector("footer");

donateBtn.style.display = footer.style.display = "none";