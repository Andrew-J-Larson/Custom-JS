// ==UserScript==
// @name         Microsoft 365 (Suite Apps) - Auto Device Theme
// @namespace    https://andrew-j-larson.github.io/
// @version      1.0.6
// @description  Makes all Microsoft 365 suite (office) apps match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://*.officeapps.live.com/*/*.aspx*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/365-Suite-Apps-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/365-Suite-Apps-Auto-Device-Theme.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=officeapps.live.com
// @grant        none
// @run-at       document-body
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (andrew.j.larson18+github@gmail.com)
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

// avoids breaking some websites that assume all errors are their own
try {
    // Constants

    const INTERVAL_SPEED = 1; // ms

    const darkModeClassName = 'UxDarkMode'; // gets applied in the body for now

    const styleDataLoadThemedStylesSelector = 'style[data-load-themed-styles]';

    // tab/button selectors
    const currentTabSelector = 'button[role="tab"][aria-selected="true"]';
    const viewTabSelector = 'button#View';
    const viewTabDarkModeToggleSelector = 'button#DarkModeToggle';

    var watchEventTriggered = false;
    var activeElement = null;
    var currentTab = null;
    var viewTab = null;

    function updateTheme(changeToScheme) {
        let theme = (document.body).classList.contains(darkModeClassName) ? 'dark' : 'light';
        if (theme != changeToScheme) {
            // ribbon tabs need to be available first
            activeElement = document.activeElement;
            currentTab = document.querySelector(currentTabSelector);

            let waitForViewTabSelected = setInterval(function() {
                viewTab = document.querySelector(viewTabSelector);
                viewTab.click();
                if (viewTab == document.querySelector(currentTabSelector)) {
                    clearInterval(waitForViewTabSelected);


                    let waitForDarkModeToggle = setInterval(function() {
                        let viewTabDarkModeToggle = document.querySelector(viewTabDarkModeToggleSelector);
                        if (viewTabDarkModeToggle) {
                            clearInterval(waitForDarkModeToggle);

                            viewTabDarkModeToggle.click();

                            // special ribbon tab 'reversal' procedure needed, strangely only works if inside a timeout, even if speed is 0
                            setTimeout(function(){
                                document.getElementById(currentTab.id).click();
                                if (watchEventTriggered) activeElement.focus();
                            }, INTERVAL_SPEED);
                        }
                    }, INTERVAL_SPEED);
                }
            }, INTERVAL_SPEED);
        }

        watchEventTriggered = false;
    }

    // wait for the page to be fully loaded
    window.addEventListener('load', function () {
        let waitForCurrentTabAndViewTab = setInterval(function () {
            // need to wait for the required buttons
            currentTab = document.querySelector(currentTabSelector);
            viewTab = document.querySelector(viewTabSelector);
            if (currentTab && viewTab) {
                clearInterval(waitForCurrentTabAndViewTab);

                // only some apps are themeable at this time
                // NOTE: at time of writing script, only WORD seems to be compatible
                let styleDataLoadThemedStyles = document.querySelector(styleDataLoadThemedStylesSelector);
                if (!(styleDataLoadThemedStyles && (styleDataLoadThemedStyles.innerText).includes(`.${darkModeClassName}`))) {
                    // app not themeable
                    consoleWarn("[" + GM_info.script.name + "] Can't run on this web app, dark mode not yet supported.");
                    throw new Error(); // only needed to exit script prematurely... but can't capture error message for some reason
                }

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
} catch (e) {
    consoleWarn(e.message);
}
