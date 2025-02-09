// ==UserScript==
// @name         Infor CSD Mingle Portal (v2) - Auto Device Theme
// @namespace    https://andrew-larson.dev/
// @version      1.0.0
// @description  Makes Infor CSD match the device theme at all times.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://mingle-portal.inforcloudsuite.com/v2/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Infor/Infor-CSD-Mingle-Portal-v2-Auto-Device-Theme.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Infor/Infor-CSD-Mingle-Portal-v2-Auto-Device-Theme.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=mingle-portal.inforcloudsuite.com
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

const LOOP_TIME = 1; // ms
const DARK_STYLE = 'theme-new-dark';
const LIGHT_STYLE = 'theme-new-light';
const portalRootContainerSelector = 'portal-root > div.portal-root > div.main-container';
const overlayBusySelector = 'div.overlay.busy';
const busyIndicatorActiveSelector = 'div.busy-indicator.active';
const currentPortalTabSelector = 'portal-tab-item.selected';
const userProfileBtnSelector = '#osp-nav-user-profile';
const menuSettingsBtnSelector = '#osp-nav-menu-settings > a';
const profileSaveBtnSelector = '#osp-set-prf-save';
const menuThemeBtnSelector = '#osp-set-menu-theme';
const lightThemeBtnSelector = '#osp-set-thm-light-button';
const darkThemeBtnSelector = '#osp-set-thm-dark-button';
const saveThemeBtnSelector = '#osp-set-thm-save';
const toastTitleSelector = '#toast-container .toast-title';
//
const closeCurrentTabSvgSelector = 'portal-tab-item.osp-tabi-workaround-ids-popup-dummy-class.selected > svg';

var watchEventTriggered = false;
//var activeElement = null;

function updateTheme(changeToScheme) {
    let html = document.querySelector('html');

    let theme = 'light';
    if (html.classList.contains(DARK_STYLE)) theme = 'dark';

    if (theme != changeToScheme) {
        let beforeURL = window.location.href;
        let currentPortalTab = document.querySelector(currentPortalTabSelector);

        let waitForUserProfileBtn = setInterval(function() {
            let userProfileBtn = document.querySelector(userProfileBtnSelector);
            if (userProfileBtn && !document.querySelector(busyIndicatorActiveSelector)) {
                clearInterval(waitForUserProfileBtn);
                userProfileBtn.click();

                let waitForMenuSettingsBtn = setInterval(function() {
                    let menuSettingsBtn = document.querySelector(menuSettingsBtnSelector);
                    if (menuSettingsBtn && !document.querySelector(busyIndicatorActiveSelector)) {
                        clearInterval(waitForMenuSettingsBtn);
                        menuSettingsBtn.click();

                        let waitForMenuThemeBtn = setInterval(function() {
                            let profileSaveBtn = document.querySelector(profileSaveBtnSelector);
                            let menuThemeBtn = document.querySelector(menuThemeBtnSelector);
                            if (profileSaveBtn && menuThemeBtn && !document.querySelector(busyIndicatorActiveSelector)) {
                                clearInterval(waitForMenuThemeBtn);
                                menuThemeBtn.click();

                                let changeToThemeSelector = changeToScheme == 'dark' ? darkThemeBtnSelector : lightThemeBtnSelector;
                                let waitForThemes = setInterval(function() {
                                    let changeToThemeBtn = document.querySelector(changeToThemeSelector);
                                    let saveThemeBtn = document.querySelector(saveThemeBtnSelector);
                                    if (changeToThemeBtn && saveThemeBtn && !document.querySelector(busyIndicatorActiveSelector)) {
                                        clearInterval(waitForThemes);
                                        changeToThemeBtn.click();

                                        let clickedSaveThemeBtn = false;
                                        let waitForSuccessToast = setInterval(function() {
                                            if (!clickedSaveThemeBtn) {
                                                saveThemeBtn.click();
                                                clickedSaveThemeBtn = true;
                                            } else {
                                                let toastsTitles = document.querySelectorAll(toastTitleSelector);
                                                if (toastsTitles) {
                                                    let toastTitle = toastsTitles[toastsTitles.length - 1];
                                                    let toastSuccess = toastTitle ? (toastTitle && (toastTitle.innerText == 'Success')) : false;
                                                    if (toastSuccess && !document.querySelector(busyIndicatorActiveSelector)) {
                                                        clearInterval(waitForSuccessToast);

                                                        let closedCurrentTab = false;
                                                        let closeCurrentTabSvg = document.querySelector(closeCurrentTabSvgSelector);
                                                        let simulatedMouseClick = new MouseEvent("click", {
                                                            view: window,
                                                            bubbles: true,
                                                            cancelable: true
                                                        });
                                                        setTimeout(function() {
                                                            closeCurrentTabSvg.dispatchEvent(simulatedMouseClick);
                                                            if (currentPortalTab) currentPortalTab.click();
                                                            closedCurrentTab = true;
                                                        }, LOOP_TIME);

                                                        // wait until after any clicks have been made
                                                        let waitForTabClose = setInterval(function() {
                                                            if (closedCurrentTab && !document.querySelector(busyIndicatorActiveSelector)) {
                                                                clearInterval(waitForTabClose);
                                                                let newURL = window.location.href;

                                                                setTimeout(function() {
                                                                    if (beforeURL != newURL) window.location.href = beforeURL;
                                                                    else window.location.reload();

                                                                    watchEventTriggered = false;
                                                                }, LOOP_TIME);
                                                            }
                                                        }, LOOP_TIME);
                                                    }
                                                } else clickedSaveThemeBtn = false;
                                            }
                                        }, LOOP_TIME);
                                    }
                                }, LOOP_TIME);
                            }
                        }, LOOP_TIME);
                    }
                }, LOOP_TIME);
            }
        }, LOOP_TIME);
    } else watchEventTriggered = false;
}

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    let waitForThemeToBeDetected = setInterval(function() {
        let portalRootContainer = document.querySelector(portalRootContainerSelector);
        if (portalRootContainer && !document.querySelector(overlayBusySelector) && !document.querySelector(busyIndicatorActiveSelector)) {
            clearInterval(waitForThemeToBeDetected);

            // now we can start
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newColorScheme = e.matches ? 'dark' : 'light';
                watchEventTriggered = true;
                //activeElement = document.activeElement;
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
    }, LOOP_TIME);
}, false);
