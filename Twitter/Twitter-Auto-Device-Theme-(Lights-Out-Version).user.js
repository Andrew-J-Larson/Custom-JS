// ==UserScript==
// @name         Twitter - Auto Device Theme (Lights Out Version)
// @namespace    https://thealiendrew.github.io/
// @version      1.0.1
// @description  Makes twitter match the device theme at all times.
// @author       AlienDrew
// @match        https://twitter.com/*
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Twitter/Twitter-Auto-Device-Theme-(Lights-Out-Version).user.js
// @icon         https://help.twitter.com/content/dam/help-twitter/brand/logo.png
// @grant        none
// ==/UserScript==

const INTERVAL_SPEED = 5;
const BG_VAR = 'background-color';
const DARK_BG = 'rgb(0, 0, 0)';
const LIGHT_BG = 'rgb(255, 255, 255)';
const hideMenusCSS = '#layers > div:nth-child(2) { display: none !important }';
const moreMenuSelector = 'div[data-testid="AppTabBar_More_Menu"]';
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
        let moreMenu, displayLink, displayModeSwitch;
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
    // need to wait for the background-color style to not be empty
    let waitingForBGStyle = setInterval(function() {
        if (document.body.style.backgroundColor) {
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