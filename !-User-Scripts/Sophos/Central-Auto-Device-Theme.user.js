// ==UserScript==
// @name         Sophos Central - Auto Device Theme
// @namespace    https://andrew-j-larson.github.io/
// @version      1.0.7
// @description  Makes Sophos Central match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://central.sophos.com/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Sophos/Central-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Sophos/Central-Auto-Device-Theme.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=central.sophos.com
// @grant        none
// @noframes
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (andrew.j.larson18+github@gmail.com)

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

const INTERVAL_SPEED = 1000; // ms; needs to be longer timed because of weird loading issues with Sophos Central
const loadingScreenSelector = 'div#loading';
const scLoaderSelector = 'div.sc-loader-container';
const contentSelector = 'div#angular-page-container > div.content-area'
const themeBtnSelector = 'button#change-theme-header-button';
const themeNotIconSelector = themeBtnSelector + ' > span.glyphicon';
const themeToLightIconClass = 'glyphicon-sc-sun';
const themeToDarkIconClass = 'glyphicon-sc-moon';

var watchEventTriggered = false;
var activeElement = null;
var themeButton = null;
var themeNotIcon = null;

function updateTheme(changeToScheme) {
    themeNotIcon = document.querySelector(themeNotIconSelector);
    let theme = 'light';
    if (themeNotIcon.classList.contains(themeToLightIconClass)) theme = 'dark';

    if (theme != changeToScheme) {
        // click the theme switcher
        themeButton = document.querySelector(themeBtnSelector);
        themeButton.click();

        if (watchEventTriggered) activeElement.focus();
    }

    watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // need to wait for button & icon to be available
    let waitingForThemeBtnAndIco = setInterval(function () {
        let loadingScreen = document.querySelector(loadingScreenSelector),
            scLoader = document.querySelector(scLoaderSelector),
            content = document.querySelector(contentSelector);
        themeButton = document.querySelector(themeBtnSelector);
        themeNotIcon = document.querySelector(themeNotIconSelector);
        content = content ? (content.querySelector('.ng-star-inserted').length > 1 ? content.querySelector('.ng-star-inserted')[1] : content) : content;

        if (themeButton && themeNotIcon &&
            loadingScreen ? (window.getComputedStyle(loadingScreen)).getPropertyValue('display') == 'none' : true &&
                scLoader ? (window.getComputedStyle(scLoader)).getPropertyValue('visibility') == 'hidden' : true &&
                content && (window.getComputedStyle(content)).getPropertyValue('display') != 'none' &&
        (window.getComputedStyle(content)).getPropertyValue('visibility') != 'hidden') {
            clearInterval(waitingForThemeBtnAndIco);

            // now we can start
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newColorScheme = e.matches ? 'dark' : 'light';
                watchEventTriggered = true;
                activeElement = document.activeElement;
                updateTheme(newColorScheme);
            });

            // first time run
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                // dark mode
                updateTheme('dark');
            } else {
                // light mode
                updateTheme('light');
            }
        }
    }, INTERVAL_SPEED);
}, false);
