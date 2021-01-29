// ==UserScript==
// @name         BitDay (Legacy) - Minimal GUI
// @namespace    https://thealiendrew.github.io/
// @version      1.0.1
// @description  Removes all GUI, except the clock area.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @include      /^https?://www\.bitday\.me/legacy*/
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Minimal%20GUI.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Minimal%20GUI.user.js
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

var donateBtn = document.querySelector(".donate");
var footer = document.querySelector("footer");

donateBtn.style.display = footer.style.display = "none";