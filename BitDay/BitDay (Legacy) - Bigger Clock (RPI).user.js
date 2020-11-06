// ==UserScript==
// @name         BitDay (Legacy) - Bigger Clock (RPI)
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  Makes the clock much bigger (since zoom glitches position).
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Bigger%20Clock%20(RPI).user.js
// @grant        none
// ==/UserScript==

var clock = document.querySelector(".clock");
var clockText = clock.firstElementChild;

clock.style.width = "90%";
clock.style.marginTop = "8.5%";
clock.style.backgroundColor = "transparent";
clockText.style.fontSize = "300%";
clockText.style.textShadow = "-5.5px 0 black, -5.5px 5.5px black, 0 5.5px black, 5.5px 5.5px black, 5.5px 0 black, 5.5px -5.5px black, 0 -5.5px black, -5.5px -5.5px black";