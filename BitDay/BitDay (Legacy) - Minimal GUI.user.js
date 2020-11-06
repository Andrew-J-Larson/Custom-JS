// ==UserScript==
// @name         BitDay (Legacy) - Minimal GUI
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  Removes all GUI, except the clock area.
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Minimal%20GUI.user.js
// @grant        none
// ==/UserScript==

var donateBtn = document.querySelector(".donate");
var footer = document.querySelector("footer");

donateBtn.style.display = footer.style.display = "none";