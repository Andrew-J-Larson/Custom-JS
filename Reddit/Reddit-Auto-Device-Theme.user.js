// ==UserScript==
// @name         Reddit - Auto Device Theme
// @namespace    https://thealiendrew.github.io/
// @version      1.0.2
// @description  Makes reddit match the device theme at all times.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://www.reddit.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Reddit/Reddit-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Reddit/Reddit-Auto-Device-Theme.user.js
// @icon         https://www.redditinc.com/assets/images/site/reddit-logo.png
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

const BG_VAR = '--background';
const DARK_BG = '#1A1A1B';
const LIGHT_BG = '#FFFFFF';
const pageDivSelector = 'body > div > div';
const userMenuSelector = '#USER_DROPDOWN_ID';
const darkModeSwitchSelector = 'button[class="_2KotRmn9DgdA58Ikji2mnV _1zZ3VDhRC38fXLLvVCHOwK"]';

var watchEventTriggered = false;
var activeElement = null;

function updateTheme(changeToScheme) {
    let pageDiv = document.querySelector(pageDivSelector);
    let background = getComputedStyle(pageDiv).getPropertyValue(BG_VAR);

    let theme = 'light';
    if (background == DARK_BG) theme = 'dark';

    if (theme != changeToScheme) {
        let userMenu = document.querySelector(userMenuSelector);
        userMenu.click();

        let darkModeSwitch = document.querySelector(darkModeSwitchSelector);
        darkModeSwitch.click();

        if (watchEventTriggered) activeElement.focus();
    }

    watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
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
}, false);
