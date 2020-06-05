// ==UserScript==
// @name         Poolside FM - Minecraft DLC
// @namespace    https://thealiendrew.github.io/
// @version      0.1.6
// @description  Allows toggling the video to a playable version of Minecraft Classic!
// @author       AlienDrew
// @match        https://poolside.fm/*
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/Poolside-FM-Minecraft-DLC.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/favicons/retro_dithered_tampermonkey.png
// @grant        none
// @run-at       document-end
// @noframes
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

// CONSTANTS

const WAIT_TO_CHANGE = 2000;
const LOOP_TIME = 100;
const STYLE_IFRAME = "width: 100%; height: 100%; transform: none; left: auto; top: auto; border: 1px solid #000; -webkit-box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2); box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2);";
const MC_ICON = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/favicons/retro_dithered.png";

// VARIABLES

var loadedYT = false;
var isMoving = false;

var minecraft = document.createElement("iframe");
minecraft.setAttribute("frameborder", "0");
minecraft.setAttribute("scrolling", "no");
minecraft.setAttribute("allowfullscreen", "1");
minecraft.setAttribute("allow", "encrypted-media;");
minecraft.setAttribute("title", "Minecraft app");
minecraft.setAttribute("width", "100%");
minecraft.setAttribute("height", "100%");
minecraft.setAttribute("src", "https://classic.minecraft.net/");
minecraft.setAttribute("id", "widget2");
minecraft.setAttribute("style", "pointer-events: all; " + STYLE_IFRAME);

// FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Where el is the DOM element you'd like to test for visibility
function isHidden(el) {
    return (el.offsetParent === null)
}

// Converts the Poolside TV into Minecraft
var convertToMinecraft = function(webIframe) {
    // MORE VARIABLES
    var webInnerContent = webIframe.parentElement;
    var webInnerWrapper = webInnerContent.parentElement.children[0];
    var webWindow = webInnerWrapper.parentElement.parentElement;
    var webWindowDragHeader = webWindow.children[1];
    var webWindowTitle = webWindowDragHeader.children[2];
    var webVideoBar = webInnerContent.children[0];
    var webVideoOverlay = webInnerContent.children[2];

    // rename the window
    webWindow.id = "minecraft";
    webWindowTitle.innerText = "Minecraft";

    // style the window
    document.styleSheets[0].addRule("#minecraft.hide-graphic .inner-wrapper", "padding: 0 5px 15px 5px !important;");
    document.styleSheets[0].addRule("#minecraft.hide-graphic .handle-br", "z-index: auto !important;");
    document.styleSheets[0].addRule("#minecraft.hide-graphic:after", "display: block !important;");

    // replace the iframe
    webInnerContent.replaceChild(minecraft, webIframe);

    // fix gui on startup
    var iStyle = webWindow.getAttribute("style");
    var iPreStyle = iStyle.substring(0, iStyle.indexOf("width"));
    webWindow.style = iPreStyle + "width: 500px; height: 375px;";
    setTimeout(function() {webWindow.style = iStyle;}, WAIT_TO_CHANGE);

    // delete the video bar
    webInnerContent.removeChild(webVideoBar);

    // delete the overlay
    //webInnerContent.removeChild(webVideoOverlay);
    // or make overlay click through
    webVideoOverlay.setAttribute("style", "pointer-events: none;");

    // watch for when resizing to fix issues with it being bugged
    setInterval(function() {
        var movingCheck = webWindow.classList.contains("resizing") || webWindow.classList.contains("dragging");
        if (movingCheck && !isMoving) {
            isMoving = true;
            minecraft.setAttribute("style", "pointer-events: none; " + STYLE_IFRAME);
        } else if (!movingCheck && isMoving) {
            isMoving = false;
            minecraft.setAttribute("style", "pointer-events: all; " + STYLE_IFRAME);
        }
    }, LOOP_TIME);
}

// MAIN

var waitForShortcut = setInterval(function() {
    var webShortcut = document.querySelector("#app > div > div.section-icons.is-absolute > ul:nth-child(1) > li:nth-child(2) > div");
    if (exists(webShortcut)) {
        clearInterval(waitForShortcut);

        var webIconImageWrapper = webShortcut.children[0];
        var webIconImage = webIconImageWrapper.children[0];
        var webIconText = webShortcut.children[1];

        // change the shortcut
        webIconImage.src = MC_ICON;
        webIconText.innerText = "Minecraft";
    }
}, LOOP_TIME);
var waitForIframe = setInterval(function() {
    var youtubeLoader = document.querySelector('.youtube-loader');
    var theIframe = document.querySelector("#widget2");
    if (exists(youtubeLoader)) {
        loadedYT = true;
        return;
    }
    if (exists(theIframe) && loadedYT && !exists(youtubeLoader) && !isHidden(theIframe)) {
        clearInterval(waitForIframe);

        convertToMinecraft(theIframe);
    }
}, LOOP_TIME);
