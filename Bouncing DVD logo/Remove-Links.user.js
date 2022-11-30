// ==UserScript==
// @name         Bouncing DVD logo - Remove Links
// @namespace    https://thealiendrew.github.io/
// @version      1.0.2
// @description  Removes the links from the website to give it a clear view of the bounching logo.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://bouncingdvdlogo.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Bouncing%20DVD%20logo/Remove-Links.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Bouncing%20DVD%20logo/Remove-Links.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bouncingdvdlogo.com
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

document.querySelector('body > aside').style.display = 'none';