// ==UserScript==
// @name         Microsoft Sticky Notes - Dark Mode
// @namespace    https://andrew-larson.dev/
// @version      1.6.2
// @description  Enables official, but hidden, dark mode on the Sticky Notes website.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @include      /^https?://www\.onenote\.com/stickynotes*/
// @include      /^https?://support\.office\.com/client/results\?NS=stickynotes&Context=%7B%22ThemeId%22:4,*/
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Tampermonkey-Scripts/main/Microsoft/Sticky-Notes-Dark-Mode.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Tampermonkey-Scripts/main/Microsoft/Sticky-Notes-Dark-Mode.user.js
// @icon         data:image/png;base64,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
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     cssDarkStickies https://raw.githubusercontent.com/Andrew-J-Larson/Tampermonkey-Scripts/main/Microsoft/Sticky-Notes-Dark-Mode.user.css
// @resource     cssDarkScrollbar https://raw.githubusercontent.com/Andrew-J-Larson/User-Styles/main/Any/Global-Dark-Scrollbar.user.css
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

// constants
const slowDelay = 1000;
const fastDelay = 100;
const fasterDelay = 10;
const msa_signup_errorWebsite = 'https://www.onenote.com/common1pauth/exchangecode?error=msa_signup';
const stickyNotesWebsite = 'https://www.onenote.com/stickynotes';
const stickiesHelpBeginning = 'https://support.office.com/client/results?NS=stickynotes&Context=%7B%22ThemeId%22:4,';
const cssSupportModernMS = 'https://support.office.com/SocContent/topicCssWithNewLandingPage';
const darkModeClassName = 'n-darkMode';
const uiContainerSelector = '#n-ui-container';
// loading gif constants
const loadingGifDark = 'https://npwuscdn-onenote.azureedge.net/ondcnotesintegration/img/loading-dark.gif';
const loadingGifSelector = '#n-side-pane > div.n-side-pane-content > div > div > div > img';
// need to check url
var currentURL = window.location.href;

// function for elements
var elementExists = function (element) {
    return (typeof (element) != 'undefined' && element != null);
};
// function for fixing css resources
var getCssResource = function (nameOfResource) {
    var css_resource = GM_getResourceText(nameOfResource).split('\n');
    var resource_parsed = '';
    // finds the first @-moz-document, then captures between it and last line encasement
    var k;
    var encasementStarted = false;
    for (k = 0; k < css_resource.length - 1; k++) {
        if (encasementStarted) resource_parsed = resource_parsed.concat(css_resource[k]);
        else encasementStarted = (css_resource[k].startsWith('@-moz-document'))
    }
    return resource_parsed;
};
// function for injecting css styles
var injectCss = function (documentToInject, cssStyle) {
    var node = document.createElement('style');
    node.type = 'text/css';
    node.innerHTML = cssStyle;
    documentToInject.body.appendChild(node);
};

if (currentURL.startsWith(msa_signup_errorWebsite)) {// code to run on the error signup website
    document.documentElement.style = 'filter: invert(100%) hue-rotate(180deg)';
} else if (currentURL.startsWith(stickyNotesWebsite)) {// code to run on the sticky notes website
    const urlDoubleQuote = '%22';
    const darkModeThemeId = '4';
    const darkModeLinkColor = urlDoubleQuote + 'BCD6E6' + urlDoubleQuote;
    const helpIFrameId = '#helpPaneFull iframe';
    // listener variables
    var helpIFrameLoaded = false;

    // apply the partial fix
    injectCss(document, getCssResource('cssDarkStickies'));

    // theme help iframe
    function checkForHelp() {
        setTimeout(function () {
            var helpIFrame = document.querySelector(helpIFrameId);
            var helpIFrameExists = elementExists(helpIFrame);
            if (helpIFrameExists && !helpIFrameLoaded) {
                // get locations in string for theme and link edits
                var oldURL = helpIFrame.src;
                var themeIdStart = oldURL.indexOf(':', oldURL.indexOf('ThemeId')) + 1;
                var themeIdEnd = oldURL.indexOf(',', themeIdStart);
                var linkColorStart = oldURL.indexOf(':', oldURL.indexOf('LinkColor')) + 1;
                var linkColorEnd = oldURL.indexOf(',', linkColorStart);

                // create the new url
                var newURL = oldURL.substring(0, themeIdStart) + darkModeThemeId + oldURL.substring(themeIdEnd, linkColorStart) + darkModeLinkColor + oldURL.substring(linkColorEnd);

                // change to the new URL
                helpIFrame.src = newURL;
                helpIFrameLoaded = true;
            } else if (!helpIFrameExists) helpIFrameLoaded = false;
            checkForHelp();
        }, fastDelay);
    }

    // apply the dark mode class to the html element
    document.body.classList.add(darkModeClassName);
    var loadingGif = null;
    var fixLoadingGif = setInterval(function () {
        loadingGif = document.querySelector(loadingGifSelector);
        if (elementExists(loadingGif)) {
            clearInterval(fixLoadingGif);
            loadingGif.src = loadingGifDark;
        }
    }, fasterDelay);

    // fix issues with Phone note view not being darkened like it should
    setInterval(function () {
        var uiContainer = document.querySelector(uiContainerSelector);
        if (elementExists(uiContainer) && !uiContainer.classList.contains(darkModeClassName)) uiContainer.classList.add(darkModeClassName);
    }, fastDelay);

    checkForHelp();
} else if (currentURL.startsWith(stickiesHelpBeginning)) { // code to run on the dark sticky notes help website
    const iframeID = 'ocSearchIFrame';
    const iframeAddDarkScroll = getCssResource('cssDarkScrollbar');

    var resetHelpView = function (internalIframe) {
        internalIframe.style.display = 'none';
        // bring page to back to display after we know the background color is changed
        setTimeout(function () {
            internalIframe.style.display = '';
        }, slowDelay);
    };

    // set the style fixes
    var checkForIFrame = setInterval(function () {
        var iframe = document.getElementById(iframeID);
        var iframeDoc = iframe.contentDocument;

        if (elementExists(iframe) && iframeDoc != null) {
            clearInterval(checkForIFrame);
            iframe.style.display = 'none';

            // reset display from nav buttons/input
            var allNav = document.querySelectorAll('#f1NavBack, #f1NavHome');
            for (let i = 0; i < allNav.length; i++) {
                allNav[i].onmouseup = function () {
                    resetHelpView(iframe);
                };
            }
            var searchButton = document.querySelector('#ocSearchButton');
            var searchBox = document.querySelector('#ocSearchBox');
            searchButton.onmouseup = function () {
                if (!searchBox.value) return;

                resetHelpView(iframe);
            };
            searchBox.addEventListener("keypress", function (e) {
                if (e.keyCode == 13) {
                    if (!searchBox.value) return;

                    resetHelpView(iframe);
                }
            });

            // must listen for page load to change style
            iframe.onload = function () {
                var iDocument = frames[0].document;

                // add custom dark scrollbar
                injectCss(iDocument, iframeAddDarkScroll);

                // activate the MS Support Modern CSS (improves light theme, and fixes dark theme)
                var msSupportModernStyle = document.createElement('link');
                msSupportModernStyle.type = 'text/css';
                msSupportModernStyle.rel = 'stylesheet';
                msSupportModernStyle.href = cssSupportModernMS;
                iDocument.head.appendChild(msSupportModernStyle);
                // make help page lose display
                var allLinks = iDocument.querySelectorAll('a');
                for (let j = 0; j < allLinks.length; j++) {
                    allLinks[j].onmouseup = function () {
                        resetHelpView(iframe);
                    };
                }

                // bring page to back to display
                resetHelpView(iframe);
            };
        }
    }, fastDelay);
}
