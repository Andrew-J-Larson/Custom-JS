// ==UserScript==
// @name         iCollege - Video size to Webpage size
// @namespace    https://thealiendrew.github.io/
// @version      1.2.0
// @description  Allows maximizing a course video to the webpage size, and dims background.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://www.icollege.co/course-launch/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/iCollege/Video-size-to-Webpage-size.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/iCollege/Video-size-to-Webpage-size.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=icollege.co
// @grant        GM_addStyle
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (thealiendrew@gmail.com)
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
const VIDEO_STYLE = "body." + VIDEO_STYLE_CLASS + " { overflow: hidden }" +
    "div#block-system-main > div.content > div > div.container." + VIDEO_STYLE_CLASS + " { width: 100%; max-width: 100% } " +
    "div#replace-new-video." + VIDEO_STYLE_CLASS + " { position: absolute; width: 100%; max-width: 100%; height: 100%; max-height: 100%; padding: 0; margin: 0; " + BACKGROUND_COLOR + " } " +
    "div#replace-new-video." + VIDEO_STYLE_CLASS + " video { position: fixed; top: 50%; transform: translateY(-50%); margin-left: 15px }" +
    "." + SIZE_BUTTON_CLASS + " { position: absolute; z-index: 1; top: 30px; right: 21px }" +
    "." + SIZE_BUTTON_CLASS + " button { border: solid 2px white; border-radius: 5px; padding: 2px; background: black; color: white}" +
    "." + SIZE_BUTTON_CLASS + "." + VIDEO_STYLE_CLASS + " { top: 15px; right: 30px }";
const intervalLoop = 200; // ms

// main

GM_addStyle(VIDEO_STYLE);
let mainContainer, videoContainer, videoElement, sizeButtonContainer, sizeButton;

let loopCheckAddButton = setInterval(function () {
    if (!document.getElementById(SIZE_BUTTON_CLASS)) {
        mainContainer = document.querySelector('div#block-system-main > div.content > div > div.container')
        videoContainer = document.getElementById('replace-new-video');
        videoElement = document.getElementById('myvideos');

        // need a button to toggle the video size
        sizeButtonContainer = document.createElement('div');
        sizeButtonContainer.classList.add(SIZE_BUTTON_CLASS);
        sizeButton = document.createElement('button');
        sizeButton.innerHTML = "Size2Webpage";
        sizeButton.id = SIZE_BUTTON_CLASS;
        sizeButton.onclick = function () {
            document.body.classList.toggle(VIDEO_STYLE_CLASS);
            mainContainer.classList.toggle(VIDEO_STYLE_CLASS);
            videoContainer.classList.toggle(VIDEO_STYLE_CLASS);
            sizeButtonContainer.classList.toggle(VIDEO_STYLE_CLASS);
        };
        sizeButtonContainer.appendChild(sizeButton);
        videoContainer.appendChild(sizeButtonContainer);
        // need to detect when video ends to reset view back to normal (to avoid positioning bugs)
        videoElement.addEventListener('ended', function () {
            // only reset if we are in page view mode
            if (videoContainer.classList.contains(VIDEO_STYLE_CLASS)) sizeButton.click();
        }, false);
    }
}, intervalLoop);
