// ==UserScript==
// @name         Microsoft 365 (Web Apps) - Auto Device Theme
// @namespace    https://thealiendrew.github.io/
// @version      1.1.7
// @description  Makes all Microsoft 365 web apps match the device theme at all times.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://*.microsoft365.com/*
// @match        https://*.office.com/*
// @match        https://*.office365.com/*
// @match        https://*.sharepoint.com/personal/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/main/!-User-Scripts/Microsoft/365-Web-Apps-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/main/!-User-Scripts/Microsoft/365-Web-Apps-Auto-Device-Theme.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoft365.com
// @grant        none
// @noframes
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

/* globals __themeState__ */

// avoids breaking some websites that assume all errors are their own
try {
    // don't start script on old Exchange portal
    let uriLocation = window.location;
    if ((uriLocation.hostname).startsWith('outlook.') && (uriLocation.pathname).startsWith('/ecp/')) throw new Error("[" + GM_info.script.name + "] Can't run on the old exchange portal, it doesn't have a dark theme.");

    // Constants

    const INTERVAL_SPEED = 5; // ms
    const OLD_PAGE_DELAY = 1500; // ms

    // required for checking theme
    const contentRootSelector = (window.location.hostname).endsWith('sharepoint.com') ? '#appRoot' : 'body > ohp-app > div, body > div#app';

    // needed when screen is small
    const maybeMoreButtonSelector = '#O365_MainLink_Affordance';
    const maybeMoreSettingsButtonSelector = '#O365_MainLink_Settings_Affordance';

    // the following if found don't need page to be refreshed
    const settingsButtonSelector = '#O365_MainLink_Settings';
    const settingsPaneSelector = '#FlexPane_Settings';
    const flexPaneCloseButtonSelector = 'button#flexPaneCloseButton';
    const firstThemeCardSelector = '#themecardpanel > div > div';
    const themeToggleSwitchSelector = '#DarkModeSwitch';

    // Outlook Web App: the following if found will need the page to be refreshed
    const owaSettingsButtonSelector = '#owaSettingsButton';
    const owaFirstThemeCardSelector = 'div[aria-label="Theme"] > div'
    const owaThemeToggleSwitchSelector = 'button[aria-label="options-quick-darkMode"]';

    // used for checking subdomain
    let subdomain; // gets set later
    // the following subdomains have no dark theme selection, so must be excluded
    const excludedSubDomains = ["nam.delve", "tasks", "to-do", "insights.viva", "whiteboard"];

    var watchEventTriggered = false;
    var activeElement = null;

    function updateTheme(changeToScheme) {
        let contentRoot = document.querySelector(contentRootSelector);

        // window.__themeState__.theme is not always guaranteed to load , so need to check computed styles of Office and normal apps
        let theme = window.getComputedStyle(contentRoot).getPropertyValue('--black') || window.getComputedStyle(contentRoot).getPropertyValue('--colorNeutralForeground1') || __themeState__.theme.themeName;
        theme = theme ? theme.toLowerCase().trim() : theme; // need to test against lowercase only, and remove extra whitespace
        theme = (theme == "#ffffff" || theme.includes('dark mode')) ? 'dark' : 'light';

        let maybeMoreButton, settingsButton; // needs to be here or else causes infinite loops
        if (theme != changeToScheme) {
            let waitForMoreAndSettings = setInterval(function() {
                maybeMoreButton = document.querySelector(maybeMoreButtonSelector);
                settingsButton = document.querySelector(settingsButtonSelector) || document.querySelector(maybeMoreSettingsButtonSelector) || document.querySelector(owaSettingsButtonSelector);
                if (maybeMoreButton && maybeMoreButton.ariaExpanded == "false") {
                    // more button needs to be pressed first
                    maybeMoreButton.click();
                } else if (settingsButton) {
                    clearInterval(waitForMoreAndSettings);

                    // now settings can be opened
                    settingsButton.click();

                    let waitForThemeToggle = setInterval(function() {
                        let firstThemeCard = document.querySelector(firstThemeCardSelector) || document.querySelector(owaFirstThemeCardSelector);
                        let themeToggleSwitch = document.querySelector(themeToggleSwitchSelector) || document.querySelector(owaThemeToggleSwitchSelector);
                        if (firstThemeCard && themeToggleSwitch) {
                            clearInterval(waitForThemeToggle);

                            firstThemeCard.click();
                            themeToggleSwitch.click();

                            // need to wait a short bit for change to go through, only on old pages that need reloading (e.g. Outlook)
                            if (window.userNormalizedTheme) {
                                setTimeout(function() {
                                    window.location.reload();
                                }, OLD_PAGE_DELAY);
                            } else { // click the close button on the settings pane
                                let settingsPane = document.querySelector(settingsPaneSelector);
                                let settingsPaneCloseButton = ((settingsPane.parentElement).parentElement).querySelector(flexPaneCloseButtonSelector);
                                settingsPaneCloseButton.click();
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
    window.addEventListener('load', function() {
        subdomain = (window.location.host).split('.')[0];
        let testSubDomainIndex = 0;
        let testSubDomainEnd = excludedSubDomains.length;
        let testSubDomainLoop = setInterval(function() {
            if (subdomain == excludedSubDomains[testSubDomainIndex]) {
                testSubDomainIndex = -1;
            } else testSubDomainIndex++;
            // only stop when we've reached that point
            if (testSubDomainIndex >= testSubDomainEnd) {
                clearInterval(testSubDomainLoop);

                let waitForThemeAndSettingsAvailable = setInterval(function() {
                    // need to wait for one of the required buttons
                    if (document.querySelector(maybeMoreButtonSelector) || document.querySelector(settingsButtonSelector) || document.querySelector(owaSettingsButtonSelector)) {
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
            } else if (testSubDomainIndex < 0) {
                // page has no dark mode, exit
                clearInterval(testSubDomainLoop);
            }
        }, 0);
    }, false);
} catch (e) {
    console.warn(e.message);
}