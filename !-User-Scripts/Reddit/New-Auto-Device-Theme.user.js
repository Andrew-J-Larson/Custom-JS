// ==UserScript==
// @name         Reddit (New) - Auto Device Theme
// @namespace    https://andrew-larson.dev/
// @version      1.2.8
// @description  Makes (new) Reddit match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://new.reddit.com/*
// @match        https://www.reddit.com/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Reddit/New-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Reddit/New-Auto-Device-Theme.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @grant        none
// @noframes
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (github@andrew-larson.dev)

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

const loopInterval = 200; // ms
const BG_VAR = '--background';
const DARK_BG = '#1A1A1B';
const LIGHT_BG = '#FFFFFF';
const pageDivSelector = 'body > div > div';
const darkmodeSwitchSelector = 'faceplate-switch-input[name="darkmode-switch-name"]'

var watchEventTriggered = false;
var activeElement = null;

function updateTheme(changeToScheme) {
    // avoids breaking some websites that assume all errors are their own
    try {
        let pageDiv = document.querySelector(pageDivSelector);
        let background = getComputedStyle(pageDiv).getPropertyValue(BG_VAR);

        let theme = 'light';
        if (background == DARK_BG) theme = 'dark';

        if (theme != changeToScheme) {
            let darkmodeSwitch = document.querySelector(darkmodeSwitchSelector);
            darkmodeSwitch.click();
        }

        watchEventTriggered = false;
    } catch (e) {
        console.warn(e);
    }
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // if old reddit might be loading, must delay; using timeline to get rough loadTime to use for delay
    let magicLoadingNumberDivisor = 4; // not sure why, but seems like the most reasonable number to use to get close to remote resource load times
    let timeoutDelay = (window.location.host).startsWith("www.") ? (document.timeline.currentTime / magicLoadingNumberDivisor) : 0;
    setTimeout(function () {
        // doesn't work on old reddit
        if (window.reddit) throw new Error("This script only runs on the newest Reddit design.");

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
    }, timeoutDelay);
}, false);
