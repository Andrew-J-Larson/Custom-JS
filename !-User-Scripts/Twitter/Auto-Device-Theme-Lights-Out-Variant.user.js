// ==UserScript==
// @name         Twitter/X - Auto Device Theme (Lights Out Variant)
// @namespace    https://andrew-larson.dev/
// @version      1.1.5
// @description  Makes the Twitter/X website match the device theme at all times. Dark theme uses "Lights Out" variant.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://twitter.com/*
// @match        https://x.com/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Twitter/Auto-Device-Theme-Lights-Out-Variant.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Twitter/Auto-Device-Theme-Lights-Out-Variant.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
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

const INTERVAL_SPEED = 5;
const BG_VAR = 'background-color';
const LIGHT_BG = 'rgb(255, 255, 255)';
const DIM_BG = 'rgb(21, 32, 43)';
const LIGHTS_OUT_BG = 'rgb(0, 0, 0)';
const moreMenuSelector = 'div[data-testid="AppTabBar_More_Menu"]';
const settingsAndPrivacySelector = 'a[data-testid="settings"]';
const accessibilityLinkSelector = 'a[data-testid="accessibilityLink"]';
const displayLinkSelector = 'a[href="/settings/display"]';
const lightModeSwitchSelector = 'input[aria-label="Light"]';
const dimModeSwitchSelector = 'input[aria-label="Dim"]';
const lightsOutModeSwitchSelector = 'input[aria-label="Lights out"]';

const DARK_BG = LIGHTS_OUT_BG;
const darkModeSwitchSelector = lightsOutModeSwitchSelector;

var watchEventTriggered = false;
var activeElement = null;

function updateTheme(changeToScheme) {
    let theme = getComputedStyle(document.body).getPropertyValue(BG_VAR) || 'unknown';

    if (theme != changeToScheme) {
        let moreMenu, settingsAndSupport, accessibilityLink, displayLink, displayModeSwitch;
        let displayModeSwitchSelector = changeToScheme == DARK_BG ? darkModeSwitchSelector : lightModeSwitchSelector;

        let waitForMoreMenu = setInterval(function () {
            try {
                if (!moreMenu) {
                    moreMenu = document.querySelector(moreMenuSelector);
                    moreMenu.click();
                }
                if (!settingsAndSupport) {
                    settingsAndSupport = document.querySelector(settingsAndPrivacySelector);
                    settingsAndSupport.click();
                }
                if (!accessibilityLink) {
                    accessibilityLink = document.querySelector(accessibilityLinkSelector);
                    accessibilityLink.click();
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
                    // need to go back 3 times since going through the settings pages creates 3 history entries
                    window.history.go(-3); // can't use window.history.back(x), because of Safari, but was a worse implementation anyways
                }
            } catch (error) {/* Error checking not needed */ }
        }, INTERVAL_SPEED);
    } else watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // must not be on logout page, and need to wait for the background-color style to not be empty
    let waitingForBGStyle = setInterval(function () {
        if (window.location.pathname != "/logout" && document.body.style.backgroundColor) {
            clearInterval(waitingForBGStyle);

            // now we can start
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newColorScheme = e.matches ? DARK_BG : LIGHT_BG;
                watchEventTriggered = true;
                activeElement = document.activeElement;
                updateTheme(newColorScheme);
            });

            // first time run
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                // dark mode
                updateTheme(DARK_BG);
            } else {
                // light mode
                updateTheme(LIGHT_BG);
            }
        }
    }, INTERVAL_SPEED);
}, false);
