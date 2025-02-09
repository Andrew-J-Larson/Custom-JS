// ==UserScript==
// @name         Microsoft Entra/Azure/Intune/Endpoint Management - Auto Device Theme
// @namespace    https://drewj.la/
// @version      1.0.9
// @description  Makes all Microsoft Entra/Azure/Intune/Endpoint portals/admin centers match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://entra.microsoft.com/*
// @match        https://entra.microsoft365.com/*
// @match        https://*.azure.com/*
// @match        https://intune.microsoft.com/*
// @match        https://intune.microsoft365.com/*
// @match        https://endpoint.microsoft.com/*
// @match        https://endpoint.microsoft365.com/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/Entra-Azure-Intune-Endpoint-Management-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Microsoft/Entra-Azure-Intune-Endpoint-Management-Auto-Device-Theme.user.js
// @icon         https://portal.azure.com/Content/favicon.ico
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
const displayNoneClass = 'fxs-display-none'
const splashScreenSelector = 'div.fxs-splashscreen';
const bladeProgressSelector = 'div.fxs-blade-progress.fxs-portal-background.fxs-progress';
const settingsSectionLoadingSelector = 'div.fxs-settings-section-loading';
const settingsBtnSelector = 'a.fxs-topbar-settings';
const settingsAppearanceDivXPATH = "//div[text()='Appearance + startup views']"; // used to grab the button
const settingsButtonActiveClass = "fxs-topbar-active";
const themes = { light: ['Azure', 'Blue', 'Light'], dark: 'Dark' };
const themeDetectorPrefixClass = "fxs-theme-";
const darkThemeClass = themeDetectorPrefixClass + ((themes.dark).toLowerCase());
const lightThemeSelector = "button.fxs-settings-thumbnail-frame[title=" + (themes.light)[0] + "]";
const darkThemeSelector = "button.fxs-settings-thumbnail-frame[title=" + themes.dark + "]";
const applyBtnSelector = 'div.fxs-settings-applybutton';
const closeBtnSelector = 'button.fxs-settings-close-button';

var watchEventTriggered = false;
var activeElement = null;
var settingsButton = null;
var darkThemeActive = null;

function updateTheme(changeToScheme) {
    let theme = 'light';
    let darkThemeActive = document.body.classList.contains(darkThemeClass);
    if (darkThemeActive) theme = 'dark';

    let startedOnSettingsPage = (window.location.href).startsWith("#settings"),
        previousHref = window.location.href;
    if (theme != changeToScheme) {
        let settingsSectionLoaded, settingsAppearanceDiv, settingsAppearanceButton, themeButton, applyButton;
        // open the settings
        settingsButton = document.querySelector(settingsBtnSelector);
        if (!settingsButton.classList.contains(settingsButtonActiveClass)) settingsButton.click();

        // need to wait for panel to open
        let applyButtonEnabled = false,
            applyButtonClicked = false;
        let waitForSettingsPane = setInterval(function () {
            try {
                if (!settingsSectionLoaded) {
                    settingsSectionLoaded = document.querySelector(settingsSectionLoadingSelector) ? false : true;
                }
                if (!settingsAppearanceDiv) {
                    settingsAppearanceDiv = document.evaluate(settingsAppearanceDivXPATH, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                }
                if (!settingsAppearanceButton) {
                    settingsAppearanceButton = settingsAppearanceDiv.parentElement;
                    settingsAppearanceButton.click();
                }
                if (!themeButton) {
                    if (changeToScheme == 'dark') themeButton = document.querySelector(darkThemeSelector);
                    else themeButton = document.querySelector(lightThemeSelector);
                    themeButton.click();
                }
                if (!applyButton) {
                    applyButton = document.querySelector(applyBtnSelector);
                    if (applyButton.firstChild.ariaDisabled === "true") applyButton = false;
                } else if (!applyButtonClicked) {
                    applyButton.click();
                    applyButtonClicked = applyButton.firstChild.ariaDisabled === "true";
                } else {
                    clearInterval(waitForSettingsPane);

                    // only close settings if we didn't load into settings, otherwise go back to original settings category
                    if (startedOnSettingsPage) {
                        window.location.replace(previousHref);
                    } else {
                        let closeButton = document.querySelector(closeBtnSelector);
                        closeButton.click();
                    }

                    if (watchEventTriggered) activeElement.focus();

                    watchEventTriggered = false;
                }
            } catch (error) { /* Error checking not needed */ }
        }, INTERVAL_SPEED);
    }
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // need to wait for button & icon to be available
    let waitingForSettingsBtn = setInterval(function () {
        let splashScreen = document.querySelector(splashScreenSelector),
            bladeProgress = document.querySelector(bladeProgressSelector);
        settingsButton = document.querySelector(settingsBtnSelector);

        let splashScreenGone = splashScreen ? splashScreen.classList.contains(displayNoneClass) : true;
        let bladeProgressGone = bladeProgress ? bladeProgress.classList.contains(displayNoneClass) : true;
        let themesLoaded = window.getComputedStyle(document.body).getPropertyValue('--colorContainerBackgroundPrimary');
        if (splashScreenGone && bladeProgressGone && themesLoaded && settingsButton) {
            clearInterval(waitingForSettingsBtn);

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