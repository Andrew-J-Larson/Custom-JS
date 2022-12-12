// ==UserScript==
// @name         [DELETE ME!] Bouncing DVD logo - Remove Links
// @namespace    https://thealiendrew.github.io/
// @version      1.0.5
// @description  Removes the links from the website to give it a clear view of the bouncing logo.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://bouncingdvdlogo.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Bouncing%20DVD%20logo/Remove-Links.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Bouncing%20DVD%20logo/Remove-Links.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bouncingdvdlogo.com
// @grant        GM_info
// ==/UserScript==

// THIS COULD BE CONVERTED TO A CSS STYLE INSTEAD!

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

const SCRIPT_NAME = (GM_info.script).name;
const NEW_DL = "https://github.com/TheAlienDrew/Custom-CSS/blob/main/!-User-Styles/Bouncing%20DVD%20Logo/Remove-Links.user.css";
let notify = confirm(`The current script "${SCRIPT_NAME}" has been converted to a User-Style. Please delete this script, and then press okay to bring up the new User-Style download.`)
if (notify) window.location.href = `${NEW_DL}`;