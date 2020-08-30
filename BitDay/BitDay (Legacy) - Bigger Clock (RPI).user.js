// ==UserScript==
// @name         BitDay (Legacy) - Bigger Clock (RPI)
// @namespace    https://thealiendrew.github.io/
// @version      0.0.1
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/BitDay/BitDay%20(Legacy)%20-%20Bigger%20Clock%20(RPI).user.js
// @description  Makes the clock much bigger (since zoom glitches position).
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @grant        none
// ==/UserScript==

var clock = document.querySelector(".clock");
var clockText = clock.firstElementChild;

clock.style.width = "90%";
clock.style.marginTop = "8.5%";
clockText.style.fontSize = "300%";
