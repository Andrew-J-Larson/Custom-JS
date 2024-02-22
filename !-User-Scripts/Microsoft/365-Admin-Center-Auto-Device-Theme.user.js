// ==UserScript==
// @name         Microsoft 365 admin center - Auto Device Theme
// @namespace    https://andrew-larson.dev/
// @version      1.0.6
// @description  Makes Microsoft 365 admin center match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://admin.microsoft.com/*
// @match        https://admin.microsoft365.com/*
// @match        https://portal.office.com/adminportal/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/365-Admin-Center-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/365-Admin-Center-Auto-Device-Theme.user.js
// @icon         https://res.cdn.office.net/admincenter/admin-content/images/favicon_fluent.ico
// @grant        none
// @run-at       document-body
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

// unfortunately need these here on certain websites that disable the console
const consoleLog = window.console.log;
const consoleWarn = window.console.warn;
const consoleDebug = window.console.debug;
const consoleError = window.console.error;
const consoleInfo = window.console.info;
const consoleTrace = window.console.trace;

const INTERVAL_SPEED = 100;
const moreActionsBtnSelector = '#Dashboard-Header-CommandBar-More-Action';
const themeBtnSelector = '#DarkLight';
const panelThemeBtnSelector = 'button[data-automation-id*=DarkLightBtn]';
const themeNotIconSelector = themeBtnSelector + ' i[data-icon-name]';

var watchEventTriggered = false;
var activeElement = null;

function updateTheme(changeToScheme) {
    let theme = 'light';

    // special case of theme selection when on homepage
    if (((window.location.href).split('#')[1]).startsWith('/homepage')) {
        let moreActionsBtn = document.querySelector(moreActionsBtnSelector);
        if (moreActionsBtn) moreActionsBtn.click();
    }

    let themeNotIcon = document.querySelector(themeNotIconSelector);
    if (themeNotIcon.getAttribute('data-icon-name') == 'Light') theme = 'dark';

    if (theme != changeToScheme) {
        // click the theme switcher
        let themeButton = document.querySelector(panelThemeBtnSelector) || document.querySelector(themeBtnSelector);
        themeButton.click();

        if (watchEventTriggered) activeElement.focus();
    }

    watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    let waitingForPageToLoad = setInterval(function () {
        let testMoreActionsBtn = document.querySelector(moreActionsBtnSelector);
        let testThemeButton = document.querySelector(themeBtnSelector);
        let testThemeNotIcon = document.querySelector(themeNotIconSelector);

        if (testMoreActionsBtn || (testThemeButton && testThemeNotIcon)) {
            clearInterval(waitingForPageToLoad);

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
