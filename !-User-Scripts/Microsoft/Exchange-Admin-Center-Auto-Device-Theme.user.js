// ==UserScript==
// @name         Microsoft Exchange admin center - Auto Device Theme
// @namespace    https://andrew-larson.dev/
// @version      1.0.9
// @description  Makes Microsoft Exchange admin center match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://admin.exchange.microsoft.com/*
// @match        https://admin.exchange.microsoft365.com/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/Exchange-Admin-Center-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/Exchange-Admin-Center-Auto-Device-Theme.user.js
// @icon         https://eacprodeusstorage.blob.core.windows.net/resources/images/favicon_metro.ico
// @grant        none
// @noframes
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (github@drewj.la)

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

const INTERVAL_SPEED = 100;
const themeBtnSelector = 'button[data-automation-id="DarkLightBtn"]';
const themeNotIconSelector = themeBtnSelector + ' > span > i[data-icon-name]';

var watchEventTriggered = false;
var activeElement = null;
var themeButton = null;
var themeNotIcon = null;

function updateTheme(changeToScheme) {
    themeNotIcon = document.querySelector(themeNotIconSelector);
    let theme = 'light';
    if (themeNotIcon.getAttribute('data-icon-name') == 'Light') theme = 'dark';

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
        themeButton = document.querySelector(themeBtnSelector);
        themeNotIcon = document.querySelector(themeNotIconSelector);

        if (themeButton && themeNotIcon) {
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
