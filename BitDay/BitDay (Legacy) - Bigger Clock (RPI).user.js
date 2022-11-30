// ==UserScript==
// @name         BitDay (Legacy) - Bigger Clock (RPI)
// @namespace    https://thealiendrew.github.io/
// @version      1.0.2
// @description  Makes the clock much bigger (since zoom glitches position).
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://www.bitday.me/legacy*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Bigger%20Clock%20(RPI).user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Bigger%20Clock%20(RPI).user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bitday.me
// @grant        none
// ==/UserScript==

/* Copyright (C) 2020  Andrew Larson (thealiendrew@gmail.com)

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

var clock = document.querySelector(".clock");
var clockText = clock.firstElementChild;

clock.style.width = "90%";
clock.style.marginTop = "8.5%";
clock.style.backgroundColor = "transparent";
clockText.style.fontSize = "300%";
clockText.style.textShadow = "-5.5px 0 black, -5.5px 5.5px black, 0 5.5px black, 5.5px 5.5px black, 5.5px 0 black, 5.5px -5.5px black, 0 -5.5px black, -5.5px -5.5px black";