// ==UserScript==
// @name         Poolside FM - Minecraft DLC
// @namespace    https://thealiendrew.github.io/
// @version      0.1.0
// @icon         https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon.ico
// @description  Allows toggling the video to a playable version of Minecraft Classic!
// @author       AlienDrew
// @match        https://poolside.fm/*
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

// CONSTANTS

const WAIT_TO_CHANGE = 2200;

// VARIABLES

var loadedYT = false;

var minecraft = document.createElement("iframe");
minecraft.setAttribute("frameborder", "0");
minecraft.setAttribute("allowfullscreen", "1");
minecraft.setAttribute("allow", "encrypted-media;");
minecraft.setAttribute("title", "Minecraft app");
minecraft.setAttribute("width", "0");
minecraft.setAttribute("height", "0");
minecraft.setAttribute("src", "https://classic.minecraft.net/");
minecraft.setAttribute("id", "widget2");
minecraft.setAttribute("style", "pointer-events: all;");

// FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

var convertToMinecraft = function(webIframe, webShortcut) {
    // MORE VARIABLES
    var webInnerContent = webIframe.parentElement;
    var webInnerWrapper = webInnerContent.parentElement.children[0];
    var webWindow = webInnerWrapper.parentElement.parentElement;
    var webWindowDragHeader = webWindow.children[1];
    var webWindowTitle = webWindowDragHeader.children[2];
    var webVideoBar = webInnerContent.children[0];
    var webVideoOverlay = webInnerContent.children[2];
    var webIconImageWrapper = webShortcut.children[0];
    var webIconImage = webIconImageWrapper.children[0];
    var webIconText = webShortcut.children[1];

    // change the shortcut
    webIconImage.src = "https://www.minecraft.net/etc.clientlibs/minecraft/clientlibs/main/resources/favicon-32x32.png";
    webIconText.innerText = "Minecraft";

    // rename the window
    webWindowTitle.innerText = "Minecraft";

    // replace the iframe
    webInnerContent.replaceChild(minecraft, webIframe);

    // fix gui on startup
    var iStyle = webWindow.getAttribute("style");
    var iPreStyle = iStyle.substring(0, iStyle.indexOf("width"));
    setTimeout(function() {webWindow.style = iPreStyle + "width: 500px; height: 375px;"}, WAIT_TO_CHANGE);
    setTimeout(function() {webWindow.style = iStyle;}, WAIT_TO_CHANGE + 10);

    // allow pointer events
    webInnerContent.setAttribute("style", "pointer-events: all;");

    // delete the video bar
    webInnerContent.removeChild(webVideoBar);

    // delete the overlay
    //webInnerContent.removeChild(webVideoOverlay);
    // or make overlay click through
    webVideoOverlay.setAttribute("style", "pointer-events: none;");
}

// MAIN

var waitForIframe = setInterval(function() {
    var youtubeLoader = document.querySelector('.youtube-loader');
    var theIframe = document.querySelector("#widget2");
    var theShortcut = document.querySelector("#app > div > div.section-icons.is-absolute > ul:nth-child(1) > li:nth-child(2) > div");
    if (exists(youtubeLoader)) {
        loadedYT = true;
        return;
    }
    if (exists(theIframe) && exists(theShortcut) && loadedYT) {
        clearInterval(waitForIframe);

        setTimeout(function() {convertToMinecraft(theIframe, theShortcut)}, WAIT_TO_CHANGE);
    }
}, 100);
