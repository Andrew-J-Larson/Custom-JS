// ==UserScript==
// @name         Poolside FM - Minecraft DLC
// @namespace    https://thealiendrew.github.io/
// @version      0.1.9
// @description  Allows toggling the video to a playable version of Minecraft Classic!
// @author       AlienDrew
// @match        https://poolside.fm/*
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/Poolside-FM-Minecraft-DLC.user.js
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

// =============================================== TIME CONSTANTS

const TENTH_OF_SECOND = 100;
const SECOND = 10 * TENTH_OF_SECOND;
const UPDATE_GUI_TIMEOUT1 = 5 * TENTH_OF_SECOND;
const UPDATE_GUI_TIMEOUT2 = 2 * TENTH_OF_SECOND;
const YT_LOADER_TIMEOUT = SECOND;

// =============================================== APP CONSTANTS (NOT TO CHANGE)

const APP_ID = "widget2";
const HIDE_GRAPHIC_SELECTOR = ".hide-graphic";
const INNER_WRAPPER_SELECTOR = ".inner-wrapper";
const HANDLE_BR_SELECTOR = ".handle-br";
const YT_LOADER_SELECTOR = ".youtube-loader";

// =============================================== APP CONSTANTS (feel free to change)

const APP_NAME = "Minecraft";
const APP_WINDOW_ID = APP_NAME.toLowerCase();
const APP_WEBSITE = "https://classic.minecraft.net/";
const APP_FAVICON = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/favicons/retro_dithered.png";
const APP_SPLASH = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/logos/mojang.png";
const APP_SPLASH_ID = "app-splash";
const RELOAD_ICON = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/icons/reload.png";
const SANDBOX_IFRAME = "allow-same-origin allow-scripts allow-pointer-lock"; // disabled: allow-popups allow-forms
const STYLE_APP_SPLASH = "image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;";
const STYLE_IFRAME = "width: 100%; height: 100%; transform: none; left: auto; top: auto; border: 1px solid #000; -appkit-box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2); box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2);";
const STYLE_HIDE_GRAPHIC_INNER_WRAPPER = "padding: 0 5px 15px 5px !important;";
const STYLE_HIDE_GRAPHIC_HANDLE_BR = "z-index: auto !important;";
const STYLE_HIDE_GRAPHIC_AFTER = "display: block !important;";

// =============================================== VARIABLES

var loadedYT = false;
var loadedApp = false;
var isMoving = false;

// gets set when loaded
var youtubeLoader = null;
var appVideoOverlay = null;
var appIframe = null;

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

// =============================================== FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Where el is the DOM element you'd like to test for visibility
var isHidden = function(el) {
    return (el.offsetParent === null)
}

// when the game loads, it needs a first time gui fix
var fixGuiMC = function(appWindow, appIframe) {
    var iStyle = appWindow.getAttribute("style");
    var iPreStyle = iStyle.substring(0, iStyle.indexOf("width"));
    appWindow.style = iPreStyle + "width: " + (appWindow.clientWidth - 1) + "px; height: " + (appWindow.clientHeight - 1) + "px;";
    setTimeout(function() {appWindow.style = iStyle}, UPDATE_GUI_TIMEOUT2);
}

// Takes an app (iframe), and replaces the Poolside TV iframe
var replaceIframe = function(appInnerContent, appWindow) {
    // 'reload' iframe by changing the outer HTML (avoids leave site prompt)
    appIframe.outerHTML = appOuterHTML;
    appIframe = document.getElementById(APP_ID);
    appIframe.focus(); // fixes appGL not loading error on some appsites that start up

    // fix Minecraft GUI after every iframe reload
    appIframe.onload = function() {
        setTimeout(function() {fixGuiMC(appWindow, appIframe)}, UPDATE_GUI_TIMEOUT1);
    }
}

// Converts the Poolside TV into Minecraft
var convertToMinecraft = function() {
    // MORE VARIABLES
    var appInnerContent = appIframe.parentElement;
    var appInnerWrapper = appInnerContent.parentElement.children[0];
    var appWindow = appInnerWrapper.parentElement.parentElement;
    var appWindowDragHeader = appWindow.children[1];
    var appWindowMinIcon = appWindowDragHeader.children[0];
    var appWindowTitle = appWindowDragHeader.children[2];
    var appVideoBar = appInnerContent.children[0];

    // ID the innerContent
    appInnerContent.id = APP_SPLASH_ID;

    // rename the window
    appWindow.id = APP_WINDOW_ID;
    appWindowTitle.innerText = APP_NAME;

    // style the window
    var splashScreenStyle = appInnerContent.style;
    splashScreenStyle.backgroundColor = "white";
    splashScreenStyle.backgroundImage = "url('" + APP_SPLASH + "')";
    splashScreenStyle.backgroundRepeat = "no-repeat";
    splashScreenStyle.backgroundPosition = "center";
    splashScreenStyle.backgroundSize = "contain";
    document.styleSheets[0].addRule('#' + APP_SPLASH_ID, STYLE_APP_SPLASH);
    document.styleSheets[0].addRule('#' + APP_WINDOW_ID + HIDE_GRAPHIC_SELECTOR + ' ' + INNER_WRAPPER_SELECTOR, STYLE_HIDE_GRAPHIC_INNER_WRAPPER);
    document.styleSheets[0].addRule('#' + APP_WINDOW_ID + HIDE_GRAPHIC_SELECTOR + ' ' + HANDLE_BR_SELECTOR, STYLE_HIDE_GRAPHIC_HANDLE_BR);
    document.styleSheets[0].addRule('#' + APP_WINDOW_ID + HIDE_GRAPHIC_SELECTOR + ":after", STYLE_HIDE_GRAPHIC_AFTER);

    // replace Poolside TV with the app
    replaceIframe(appInnerContent, appWindow);

    // create a reload button (necessary for when appGL breaks)
    var reloadIcon = appWindowMinIcon.cloneNode(true);
    reloadIcon.id = "reload-iframe";
    reloadIcon.title = "Reload";
    reloadIcon.setAttribute("style", "margin-left: -1px;");
    reloadIcon.onclick = function() {replaceIframe(appInnerContent, appWindow)}
    appWindowDragHeader.insertBefore(reloadIcon, appWindowMinIcon.nextSibling);
    document.styleSheets[0].addRule('#' + reloadIcon.id + ":after", "background: url('" + RELOAD_ICON + "') no-repeat 50%; background-size: 7px auto;");

    // delete the video bar
    appInnerContent.removeChild(appVideoBar);

    // delete the overlay
    //appInnerContent.removeChild(appVideoOverlay);
    // or make overlay click through
    appVideoOverlay.setAttribute("style", "pointer-events: none;");

    // watch for when resizing to fix issues with it being bugged
    setInterval(function() {
        var movingCheck = appWindow.classList.contains("resizing") || appWindow.classList.contains("dragging");
        if (movingCheck && !isMoving) {
            isMoving = true;
            appIframe.style = "pointer-events: none; " + STYLE_IFRAME;
        } else if (!movingCheck && isMoving) {
            isMoving = false;
            appIframe.style = "pointer-events: all; " + STYLE_IFRAME;
        }
    }, TENTH_OF_SECOND);
}

// =============================================== INTERVALS

var waitForShortcut = setInterval(function() {
    var appShortcut = document.querySelector("#app > div > div.section-icons.is-absolute > ul:nth-child(1) > li:nth-child(2) > div");
    if (exists(appShortcut)) {
        clearInterval(waitForShortcut);

        var appIconImageWrapper = appShortcut.children[0];
        var appIconImage = appIconImageWrapper.children[0];
        var appIconText = appShortcut.children[1];

        // change the shortcut
        appIconImage.src = APP_FAVICON;
        appIconText.innerText = APP_NAME;

        // fixes issue of the youtube loader disappearing too fast
        setTimeout(function() {if (!loadedYT) loadedYT = true}, YT_LOADER_TIMEOUT);
    }
}, TENTH_OF_SECOND);
var waitForIframe = setInterval(function() {
    appIframe = document.getElementById(APP_ID);

    if (exists(appIframe)) clearInterval(waitForIframe);
}, TENTH_OF_SECOND);
var waitForYTLoader = setInterval(function() {
    youtubeLoader = document.querySelector(YT_LOADER_SELECTOR);
    if (exists(youtubeLoader)) {
        clearInterval(waitForYTLoader);

        // change youtube loader to overlay prematurely
        youtubeLoader.classList.remove(YT_LOADER_SELECTOR.substring(1));
        youtubeLoader.classList.add("overlay");
        appVideoOverlay = youtubeLoader;
        youtubeLoader = null;
        loadedYT = true;
    }
}, TENTH_OF_SECOND);

// =============================================== MAIN

var loadMain = setInterval(function() {
    // don't run main until appIframe exists and the youtube loader doesn't
    if (exists(appIframe) && !exists(youtubeLoader) && loadedYT) {
        clearInterval(loadMain);

        convertToMinecraft();
    }
}, TENTH_OF_SECOND);