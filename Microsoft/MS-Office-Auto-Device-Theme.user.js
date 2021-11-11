// ==UserScript==
// @name         Microsoft Office Web Apps - Auto Device Theme
// @namespace    https://thealiendrew.github.io/
// @version      1.0.1
// @description  Makes any Microsoft Office web app match the device theme at all times.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @include      /^https?:\/\/[A-Za-z0-9\-]*\.office(365)?\.com\/.*$/
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Microsoft/MS-Office-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Microsoft/MS-Office-Auto-Device-Theme.user.js
// @icon         https://res-1.cdn.office.net/officehub/images/content/images/favicon-8f211ea639.ico
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

const INTERVAL_SPEED = 5; // ms
const OLD_PAGE_DELAY = 1500; // ms

// needed when screen is small
const maybeMoreButtonSelector = '#O365_MainLink_Affordance';

// the following if found don't need page to be refreshed
const settingsButtonSelector = '#O365_MainLink_Settings';
const firstThemeCardSelector = '#themecardpanel > div > div';
const themeToggleSwitchSelector = '#DarkModeSwitch';

// the following if found will need the page to be refreshed
const owaSettingsButtonSelector = '#owaSettingsButton';
const owaFirstThemeCardSelector = 'div[aria-label="Theme"] > div'
const owaThemeToggleSwitchSelector = 'button[aria-label="options-quick-darkMode"]';

var watchEventTriggered = false;
var activeElement = null;
var maybeMoreButton, firstThemeCard, settingsButton; // gets set later

function updateTheme(changeToScheme) {
    let html = document.querySelector('html');

    let theme = window.__themeState__.theme.black;
    theme = (theme == "#ffffff" || (theme == "var(--black)" && getComputedStyle(document.documentElement).getPropertyValue('--black') == "#ffffff")) ? 'dark' : 'light';

    if (theme != changeToScheme) {
        let waitForMoreAndSettings = setInterval(function() {
            let firstClicked;
            maybeMoreButton = document.querySelector(maybeMoreButtonSelector);
            settingsButton = document.querySelector(settingsButtonSelector) || document.querySelector(owaSettingsButtonSelector);
            if (maybeMoreButton && !settingsButton) {
                // more button needs to be pressed first
                maybeMoreButton.click();
                firstClicked = maybeMoreButton;
            } else if (settingsButton) {
                clearInterval(waitForMoreAndSettings);

                // now settings can be opened
                settingsButton.click();
                if (!firstClicked) firstClicked = settingsButton;

                let waitForThemeToggle = setInterval(function() {
                    firstThemeCard = document.querySelector(firstThemeCardSelector) || document.querySelector(owaFirstThemeCardSelector);
                    let themeToggleSwitch = document.querySelector(themeToggleSwitchSelector) || document.querySelector(owaThemeToggleSwitchSelector);
                    if (firstThemeCard && themeToggleSwitch) {
                        clearInterval(waitForThemeToggle);

                        firstThemeCard.click();
                        themeToggleSwitch.click();
                        firstClicked.click();

                        // need to wait a short bit for change to go through, only on old pages that need reloading
                        if (window.userNormalizedTheme) {
                            setTimeout(function() {
                                window.location.reload();
                            }, OLD_PAGE_DELAY);
                        }

                        if (watchEventTriggered) activeElement.focus();
                    }
                }, INTERVAL_SPEED);
            }
        }, INTERVAL_SPEED);
    }

    watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    let waitForThemeAndSettingsAvailable = setInterval(function() {
        // need to wait for one of the required buttons
        if (window.__themeState__ && window.__themeState__.theme && window.__themeState__.theme.black && (document.querySelector(maybeMoreButtonSelector) || document.querySelector(settingsButtonSelector) || document.querySelector(owaSettingsButtonSelector))) {
            clearInterval(waitForThemeAndSettingsAvailable);

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
