// ==UserScript==
// @name         Reddit (New) - Auto Device Theme
// @namespace    https://andrew-larson.dev/
// @version      1.3.0
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

const loopInterval = 200; // ms
const THEME_DARK_CLASS_NAME = 'theme-dark';
const THEME_LIGHT_CLASS_NAME = 'theme-light';
const darkmodeSwitchSelector = 'faceplate-switch-input[name="darkmode-switch-name"]'

var watchEventTriggered = false;
var activeElement = null;

function updateTheme(changeToScheme) {
    // avoids breaking some websites that assume all errors are their own
    try {
        let htmlElement = document.querySelector('html');

        let theme = 'light';
        if (htmlElement.classList.contains(THEME_DARK_CLASS_NAME)) theme = 'dark';

        if (theme != changeToScheme) {
            let darkmodeSwitch = document.querySelector(darkmodeSwitchSelector);
            if (darkmodeSwitch) darkmodeSwitch.click();
            else throw new Error("[" + GM_info.script.name + "] Must be logged in for this script to work properly.");
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
