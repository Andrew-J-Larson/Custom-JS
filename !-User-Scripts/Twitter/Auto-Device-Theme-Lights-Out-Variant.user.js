// ==UserScript==
// @name         Twitter - Auto Device Theme (Lights Out Variant)
// @namespace    https://thealiendrew.github.io/
// @version      1.0.8
// @description  Makes Twitter match the device theme at all times. Dark theme uses "Lights Out" variant.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://twitter.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/main/!-User-Scripts/Twitter/Auto-Device-Theme-Lights-Out-Variant.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/main/!-User-Scripts/Twitter/Auto-Device-Theme-Lights-Out-Variant.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (thealiendrew@gmail.com)

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

const INTERVAL_SPEED = 5;
const BG_VAR = 'background-color';
const DARK_BG = 'rgb(0, 0, 0)';
const LIGHT_BG = 'rgb(255, 255, 255)';
const hideMenusCSS = '#layers > div:nth-child(2) { display: none !important }';
const moreMenuSelector = 'div[data-testid="AppTabBar_More_Menu"]';
const settingsAndSupportSelector = 'div[data-testid="settingsAndSupport"]';
const displayLinkSelector = 'a[href="/i/display"]';
const displaySettingsSelector = '#layers > div:nth-child(2)';
const lightModeSwitchSelector = 'input[aria-label="Light"]';
const darkModeSwitchSelector = 'input[aria-label="Lights out"]';

var watchEventTriggered = false;
var activeElement = null;

function updateTheme(changeToScheme) {
    let background = getComputedStyle(document.body).getPropertyValue(BG_VAR);

    let theme = 'light';
    if (background == DARK_BG) theme = 'dark';

    if (theme != changeToScheme) {
        let moreMenu, settingsAndSupport, displayLink, displayModeSwitch;
        let displayModeSwitchSelector = changeToScheme == 'dark' ? darkModeSwitchSelector : lightModeSwitchSelector;

        // need a custom style to keep certain menus hidden while changing theme
        let hideMenusStyle = document.createElement('style');
        hideMenusStyle.type = 'text/css';
        hideMenusStyle.innerHTML = hideMenusCSS;
        document.getElementsByTagName('head')[0].appendChild(hideMenusStyle);

        let waitForMoreMenu = setInterval(function() {
            try {
                if (!moreMenu) {
                    moreMenu = document.querySelector(moreMenuSelector);
                    moreMenu.click();
                }
                if (!settingsAndSupport) {
                    settingsAndSupport = document.querySelector(settingsAndSupportSelector);
                    settingsAndSupport.click();
                }
                if (!displayLink) {
                    displayLink = document.querySelector(displayLinkSelector);
                    displayLink.click();
                }
                if (!displayModeSwitch) {
                    displayModeSwitch = document.querySelector(displayModeSwitchSelector);
                    displayModeSwitch.click();

                    clearInterval(waitForMoreMenu);
                    // can't click button programmatically to exit, so window history back will have to do
                    window.history.back();
                    // need to remove the style theme is changed
                    setTimeout(function() {
                        hideMenusStyle.parentNode.removeChild(hideMenusStyle);

                        if (watchEventTriggered) {
                            activeElement.focus();
                            watchEventTriggered = false;
                        }
                    }, INTERVAL_SPEED);
                }
            } catch (error) {/* Error checking not needed */}
        }, INTERVAL_SPEED);
    } else watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // must not be on logout page, and need to wait for the background-color style to not be empty
    let waitingForBGStyle = setInterval(function() {
        if (window.location.pathname != "/logout" && document.body.style.backgroundColor) {
            clearInterval(waitingForBGStyle);

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