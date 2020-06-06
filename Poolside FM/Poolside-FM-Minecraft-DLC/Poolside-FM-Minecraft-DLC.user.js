// ==UserScript==
// @name         Poolside FM - Minecraft DLC
// @namespace    https://thealiendrew.github.io/
// @version      0.3.0
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
const UPDATE_GUI_TIMEOUT = 2.5*SECOND;
const YT_LOADER_TIMEOUT = SECOND;

// =============================================== APP CONSTANTS (NOT TO CHANGE)

const IFRAME_ID = "widget2";
const HIDE_GRAPHIC_SELECTOR = ".hide-graphic";
const INNER_WRAPPER_SELECTOR = ".inner-wrapper";
const YT_LOADER_SELECTOR = ".youtube-loader";
const DESKTOP_ID = "app";
const TASKBAR_SELECTOR = '#' + DESKTOP_ID + " > div > header";
const RESTORE_DOWN_CLASS = "restore-down";
const MAXIMIZE_CLASS = "maximize";
const MINIMIZE_CLASS = "minimize";
const HIDE_DESKTOP_CLASS = "hide-desktop";

// =============================================== APP CONSTANTS (feel free to change)

const APP_NAME = "Minecraft";
const APP_ID = APP_NAME.toLowerCase();
const APP_WEBSITE = "https://classic.minecraft.net/";
const APP_RAW_LINK = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Poolside%20FM/Poolside-FM-Minecraft-DLC/";
const APP_ICONS_LINK = APP_RAW_LINK + "icons/";
const APP_FAVICON = APP_RAW_LINK + "favicons/retro_dithered.png";
const APP_SPLASH = APP_RAW_LINK + "logos/mojang.png";
const MAXIMIZE_ICON = APP_ICONS_LINK + "maximize.png";
const RESTORE_DOWN_ICON = APP_ICONS_LINK + "restore-down.png";
const RELOAD_ICON = APP_ICONS_LINK + "reload.png";
const TASKBAR_ID = "taskbar";
const SIZER_ID = "sizer-iframe";
const RELOAD_ID = "reload-iframe";
const APP_SPLASH_ID = "app-splash";
const SANDBOX_IFRAME = "allow-same-origin allow-scripts allow-pointer-lock allow-forms allow-modals allow-popups";
const STYLE_APP_SPLASH = "image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;";
const STYLE_BASIC_IFRAME = "border: 1px solid #000; -appkit-box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2); box-shadow: inset 1px 1px 0 0 #fff, 5px 5px 0 rgba(0,0,0,.2);";
const STYLE_LOAD_IFRAME = STYLE_BASIC_IFRAME + " left: 100vw; top: 100vh; width: 101%; height: 101%; pointer-events: none;";
const STYLE_IFRAME = STYLE_BASIC_IFRAME + " left: auto; top: auto; width: 100%; height: 100%; transform: none;";
const STYLE_SHOW_INNER_WRAPPER = "padding: 0 5px 15px 5px !important;";
const STYLE_SHOW_AFTER = "display: block !important;";
const STYLE_APP_WINDOW_BTN_PART = " no-repeat 50%; background-size: 7px auto;";
const APP_WINDOW_BTN_MARGIN = "-1px";
const VIDEO_OVERLAY_ENABLED = true;

// =============================================== CSS CLASSES

document.styleSheets[0].addRule('#' + SIZER_ID, "margin-left: " + APP_WINDOW_BTN_MARGIN + ';');
document.styleSheets[0].addRule('#' + SIZER_ID + '.' + RESTORE_DOWN_CLASS + ":after", "title: 'Restore Down'; background: url('" + RESTORE_DOWN_ICON + "') " + STYLE_APP_WINDOW_BTN_PART);
document.styleSheets[0].addRule('#' + SIZER_ID + '.' + MAXIMIZE_CLASS + ":after", "title: 'Maximize'; background: url('" + MAXIMIZE_ICON + "') " + STYLE_APP_WINDOW_BTN_PART);
document.styleSheets[0].addRule('#' + RELOAD_ID, "margin-left: " + APP_WINDOW_BTN_MARGIN + ';');
document.styleSheets[0].addRule('#' + RELOAD_ID + ":after", "title: 'Reload';");
document.styleSheets[0].addRule('#' + DESKTOP_ID + '.' + HIDE_DESKTOP_CLASS + " > div > header", "display: none !important;");
document.styleSheets[0].addRule('#' + DESKTOP_ID + ":not(." + HIDE_DESKTOP_CLASS + ") #" + APP_ID + HIDE_GRAPHIC_SELECTOR + ' ' + INNER_WRAPPER_SELECTOR, STYLE_SHOW_INNER_WRAPPER);
document.styleSheets[0].addRule('#' + DESKTOP_ID + ":not(." + HIDE_DESKTOP_CLASS + ") #" + APP_ID + ":after", STYLE_SHOW_AFTER);

// =============================================== VARIABLES

var appIsMaximized = false;
var loadedYT = false;
var loadedApp = false;
var iframeStylesSet = false;
var videoOverlaySet = false;
var isMoving = false;

// gets set when loaded
var youtubeLoader = null;
var appVideoOverlay = null;
var appIframe = null;
var appWindow = null;
var appInnerContent = null;
var appInnerWrapper = null;
var appDragHeader = null;
var appHandleSizer = null;
var vueApp = null;
var desktop = null;
var taskbar = null;
var minimizeBtn = null;
var sizerBtn = null;
var reloadBtn = null;
var prevX = null; // in pixels
var prevY = null; // in pixels
var prevW = null; // in pixels
var prevH = null; // in pixels

// =============================================== OBJECTS & RELATED

var minecraft = document.createElement("iframe");
minecraft.frameborder = "0";
minecraft.scrolling = "no";
minecraft.allowfullscreen = "1";
minecraft.allow = "encrypted-media";
minecraft.title = APP_NAME + " app";
minecraft.src = APP_WEBSITE;
minecraft.sandbox = SANDBOX_IFRAME;
minecraft.style = STYLE_LOAD_IFRAME;
var minecraftOuterHTML = minecraft.outerHTML;
var appOuterHTML = minecraftOuterHTML.substring(0, 8) + 'id="' + IFRAME_ID + '" ' + minecraftOuterHTML.substring(8);

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
var fixGuiMC = function(appIframe) {
    appIframe.style = "pointer-events: all; " + STYLE_IFRAME;
    document.exitPointerLock();
    document.getElementsByTagName("section")[0].focus();
}

// Takes an app (iframe), and replaces the Poolside TV iframe
var replaceIframe = function() {
    // 'reload' iframe by changing the outer HTML (avoids leave site prompt)
    appIframe.outerHTML = appOuterHTML;
    appIframe = document.getElementById(IFRAME_ID);
    appIframe.focus(); // fixes appGL not loading error on some appsites that start up

    // fix Minecraft GUI after every iframe reload
    appIframe.onload = function() {setTimeout(function() {fixGuiMC(appIframe)}, UPDATE_GUI_TIMEOUT)}
}

// Set the app vue X, Y, W, H
var storeVueWindowCoords = function() {
    prevX = vueApp.left;
    prevY = vueApp.top;
    prevW = vueApp.width;
    prevH = vueApp.height;
}

// Sets the design changes for the app window sizer button
var setSizerBtnDesign = function(maximizing) {
    if (maximizing) {
        storeVueWindowCoords();
        appWindow.children[1].style.pointerEvents = "none";
        reloadBtn.style.pointerEvents = "all";
        minimizeBtn.style.pointerEvents = "all";
        sizerBtn.style.pointerEvents = "all";
        sizerBtn.classList.remove(MAXIMIZE_CLASS);
        sizerBtn.classList.add(RESTORE_DOWN_CLASS);
        desktop.classList.add(HIDE_DESKTOP_CLASS);
        window.appWindow = appWindow;
        vueApp.left = 0;
        vueApp.top = 0;
        vueApp.changeWidth(appWindow.parentElement.clientWidth);
        vueApp.changeHeight(appWindow.parentElement.clientHeight);
        vueApp.draggable = false;
    } else {
        if (prevX == null && prevY == null && prevW == null && prevH == null) storeVueWindowCoords();
        appWindow.children[1].style.pointerEvents = '';
        reloadBtn.style.pointerEvents = '';
        minimizeBtn.style.pointerEvents = '';
        sizerBtn.style.pointerEvents = '';
        sizerBtn.classList.add(MAXIMIZE_CLASS);
        sizerBtn.classList.remove(RESTORE_DOWN_CLASS);
        desktop.classList.remove(HIDE_DESKTOP_CLASS);
        vueApp.left = prevX;
        vueApp.top = prevY;
        vueApp.changeWidth(prevW);
        vueApp.changeHeight(prevH);
        vueApp.draggable = true;
    }
}

// Toggles size of window for app
var toggleSizer = function(choice) {
    var tempIsMaximized = appIsMaximized;
    if (exists(choice) && typeof(optional) == "boolean") tempIsMaximized = choice;
    else tempIsMaximized = !appIsMaximized;

    // only do something when we've changed the setting
    if (tempIsMaximized != appIsMaximized) {
        setSizerBtnDesign(tempIsMaximized);
        appIsMaximized = tempIsMaximized;
    }
}

// Converts the Poolside TV into Minecraft
var convertToMinecraft = function() {
    // MORE VARIABLES
    desktop = document.getElementById(DESKTOP_ID);
    taskbar = document.querySelector(TASKBAR_SELECTOR);
    appInnerContent = appIframe.parentElement;
    appInnerWrapper = appInnerContent.parentElement;
    appWindow = appInnerWrapper.parentElement;
    vueApp = appWindow.__vue__;
    appHandleSizer = appWindow.children[0];
    appDragHeader = appWindow.children[1];
    minimizeBtn = appDragHeader.children[0];
    var appWindowTitle = appDragHeader.children[2];
    var appVideoBar = appInnerContent.children[0];

    // ID other variables
    taskbar.id = TASKBAR_ID;
    appInnerContent.id = APP_SPLASH_ID;

    // rename the window
    appWindow.id = APP_ID;
    appWindowTitle.innerText = APP_NAME;

    // style the window
    var splashScreenStyle = appInnerContent.style;
    splashScreenStyle.backgroundColor = "white";
    splashScreenStyle.backgroundImage = "url('" + APP_SPLASH + "')";
    splashScreenStyle.backgroundRepeat = "no-repeat";
    splashScreenStyle.backgroundPosition = "center";
    splashScreenStyle.backgroundSize = "contain";
    if (!iframeStylesSet) {
        iframeStylesSet = true;
        document.styleSheets[0].addRule('#' + APP_SPLASH_ID, STYLE_APP_SPLASH);
    }

    // replace Poolside TV with the app
    replaceIframe();

    // get buttons
    reloadBtn = minimizeBtn.cloneNode(true);
    sizerBtn = minimizeBtn.cloneNode(true);
    minimizeBtn.classList.add(MINIMIZE_CLASS);

    // create additional window buttons
    // RELOAD (necessary for when appGL breaks)
    reloadBtn.id = RELOAD_ID;
    reloadBtn.onmouseup = function() {replaceIframe()}
    appDragHeader.insertBefore(reloadBtn, minimizeBtn.nextSibling);
    document.styleSheets[0].addRule('#' + reloadBtn.id + ":after", "background: url('" + RELOAD_ICON + "') " + STYLE_APP_WINDOW_BTN_PART);
    // SIZER
    sizerBtn.id = SIZER_ID;
    sizerBtn.onmouseup = function() {toggleSizer()}
    appDragHeader.insertBefore(sizerBtn, minimizeBtn.nextSibling);
    setSizerBtnDesign(appIsMaximized);

    // delete the video bar
    appInnerContent.removeChild(appVideoBar);

    // delete the overlay (if there is one) or make overlay click-through
    if (!videoOverlaySet) {
        videoOverlaySet = true;
        if (VIDEO_OVERLAY_ENABLED) appVideoOverlay.setAttribute("style", "pointer-events: none;");
        else appInnerContent.removeChild(appVideoOverlay);
    }

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
    appIframe = document.getElementById(IFRAME_ID);

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