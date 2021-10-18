// ==UserScript==
// @name         iCollege - Video size to Webpage size
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  Allows maximizing a course video to the webpage size, and dims background.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://www.icollege.co/course-launch/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/iCollege.co/iCollege-Video-size-to-Webpage-size.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/iCollege.co/iCollege-Video-size-to-Webpage-size.user.js
// @icon         https://www.icollege.co/sites/all/themes/iCollege/favicon.ico
// @grant        GM_addStyle
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

// constants

const BACKGROUND_COLOR = "background: rgba(0,0,0,0.85)";
const VIDEO_STYLE_CLASS = "videoToWebpage";
const SIZE_BUTTON_CLASS = VIDEO_STYLE_CLASS + "Button";
const VIDEO_STYLE = "body."+VIDEO_STYLE_CLASS+" { overflow: hidden }" +
                    "div#block-system-main > div.content > div > div.container."+VIDEO_STYLE_CLASS+" { width: 100%; max-width: 100% } " +
                    "div#replace-new-video."+VIDEO_STYLE_CLASS+" { position: absolute; width: 100%; max-width: 100%; height: 100%; max-height: 100%; padding: 0; margin: 0; "+BACKGROUND_COLOR+" } " +
                    "div#replace-new-video."+VIDEO_STYLE_CLASS+" video { position: fixed; top: 50%; transform: translateY(-50%); margin-left: 15px }" +
                    "."+SIZE_BUTTON_CLASS+" { position: absolute; z-index: 1; top: 30px; right: 21px }" +
                    "."+SIZE_BUTTON_CLASS+" button { border: solid 2px black; border-radius: 5px; padding: 2px; background: rgb(255,255,255) }" +
                    "."+SIZE_BUTTON_CLASS+"."+VIDEO_STYLE_CLASS+" { top: 15px; right: 30px }";

// main

GM_addStyle(VIDEO_STYLE);

window.addEventListener('load', function() {
    let mainContainer = document.querySelector('div#block-system-main > div.content > div > div.container')
    let videoContainer = document.getElementById('replace-new-video');

    // need a background cover behind video
    let shadeCover = document.createElement('div'); // jhsdkfahsjkdghasjkdhgasjkdgaksjdhaskjd
    // need a button to toggle the video size
    let sizeButtonContainer = document.createElement('div');
    sizeButtonContainer.classList.add(SIZE_BUTTON_CLASS);
    let sizeButton = document.createElement('button');
    sizeButton.innerHTML = "Size2Webpage";
    sizeButton.onclick = function() {
        document.body.classList.toggle(VIDEO_STYLE_CLASS);
        mainContainer.classList.toggle(VIDEO_STYLE_CLASS);
        videoContainer.classList.toggle(VIDEO_STYLE_CLASS);
        sizeButtonContainer.classList.toggle(VIDEO_STYLE_CLASS);
    };
    sizeButtonContainer.appendChild(sizeButton);
    videoContainer.appendChild(sizeButtonContainer);
}, false);
