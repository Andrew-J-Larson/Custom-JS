// ==UserScript==
// @name         Poolside FM - Minecraft DLC
// @namespace    https://thealiendrew.github.io/
// @version      0.1.7
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

// APP CONSTANTS (NOT TO CHANGE)
const APP_ID = "widget2";

// APP CONSTANTS (feel free to change)
const APP_NAME = "Minecraft";
const APP_WEBSITE = "https://classic.minecraft.net/";
const APP_FAVICON = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/favicons/retro_dithered.png";
const RELOAD_ICON = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/icons/reload.png";
const SANDBOX_IFRAME = "allow-same-origin allow-scripts allow-pointer-lock"; // disabled: allow-popups allow-forms
const STYLE_IFRAME = "width: 100%; height: 100%; transform: none; left: auto; top: auto; border: 1px solid #000; -webkit-box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2); box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2);";

// VARIABLES

var loadedYT = false;
var loadedApp = false;
var isMoving = false;

var webIframe = null; // gets set when loaded

var minecraft = document.createElement("iframe");
minecraft.frameborder = "0";
minecraft.scrolling = "no";
minecraft.allowfullscreen = "1";
minecraft.allow = "encrypted-media";
minecraft.title = APP_NAME + " app";
minecraft.width = "100%";
minecraft.height = "100%";
minecraft.src = APP_WEBSITE;
minecraft.sandbox = SANDBOX_IFRAME;
minecraft.style = "pointer-events: all; " + STYLE_IFRAME;
var minecraftOuterHTML = minecraft.outerHTML;
var appOuterHTML = minecraftOuterHTML.substring(0, 8) + 'id="' + APP_ID + '" ' + minecraftOuterHTML.substring(8);

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

// when the game loads, it needs a first time gui fix
var fixGuiMC = function(webWindow, webIframe) {
    webIframe.focus(); // fixes WebGL not loading error

    var iStyle = webWindow.getAttribute("style");
    var iPreStyle = iStyle.substring(0, iStyle.indexOf("width"));
    webWindow.style = iPreStyle + "width: 500px; height: 375px;";
    setTimeout(function() {webWindow.style = iStyle;}, WAIT_TO_CHANGE);
}

// Takes an app (iframe), and replaces the Poolside TV iframe
var replaceIframe = function(webInnerContent, webWindow) {
    // 'reload' iframe by changing the outer HTML (avoids leave site prompt)
    webIframe.outerHTML = appOuterHTML;
    webIframe = document.getElementById(APP_ID);

    // fix gui after every iframe reload
    webIframe.onload = function() {
        fixGuiMC(webWindow, webIframe);
    }
}

// Converts the Poolside TV into Minecraft
var convertToMinecraft = function() {
    // MORE VARIABLES
    var webInnerContent = webIframe.parentElement;
    var webInnerWrapper = webInnerContent.parentElement.children[0];
    var webWindow = webInnerWrapper.parentElement.parentElement;
    var webWindowDragHeader = webWindow.children[1];
    var webWindowMinIcon = webWindowDragHeader.children[0];
    var webWindowTitle = webWindowDragHeader.children[2];
    var webVideoBar = webInnerContent.children[0];
    var webVideoOverlay = webInnerContent.children[2];

    // rename the window
    webWindow.id = APP_NAME.toLowerCase();
    webWindowTitle.innerText = APP_NAME;

    // style the window
    document.styleSheets[0].addRule('#' + webWindow.id + ".hide-graphic .inner-wrapper", "padding: 0 5px 15px 5px !important;");
    document.styleSheets[0].addRule('#' + webWindow.id + ".hide-graphic .handle-br", "z-index: auto !important;");
    document.styleSheets[0].addRule('#' + webWindow.id + ".hide-graphic:after", "display: block !important;");

    // replace iframe with the app
    replaceIframe(webInnerContent, webWindow);

    // create a reload button (necessary for when WebGL breaks)
    var reloadIcon = webWindowMinIcon.cloneNode(true);
    reloadIcon.id = "reload-iframe";
    reloadIcon.title = "Reload";
    reloadIcon.setAttribute("style", "margin-left: -1px;");
    reloadIcon.onclick = function() {
        //webIframe.src = APP_WEBSITE;
        replaceIframe(webInnerContent, webWindow);
    }
    webWindowDragHeader.insertBefore(reloadIcon, webWindowMinIcon.nextSibling);
    document.styleSheets[0].addRule('#' + reloadIcon.id + ":after", "background: url('" + RELOAD_ICON + "') no-repeat 50%; background-size: 7px auto;");

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
            webIframe.style = "pointer-events: none; " + STYLE_IFRAME;
        } else if (!movingCheck && isMoving) {
            isMoving = false;
            webIframe.style = "pointer-events: all; " + STYLE_IFRAME;
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
        webIconImage.src = APP_FAVICON;
        webIconText.innerText = APP_NAME;
    }
}, LOOP_TIME);
var waitForIframe = setInterval(function() {
    var youtubeLoader = document.querySelector('.youtube-loader');
    webIframe = document.getElementById(APP_ID);
    if (exists(youtubeLoader)) {
        loadedYT = true;
        return;
    }
    if (exists(webIframe) && loadedYT && !exists(youtubeLoader) && !isHidden(webIframe)) {
        clearInterval(waitForIframe);

        convertToMinecraft();
    }
}, LOOP_TIME);
// fixes issue of the element disappearing too fast
setTimeout(function() {if (!loadedYT) loadedYT = true}, WAIT_TO_CHANGE);
