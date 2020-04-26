// ==UserScript==
// @name         Microsoft Sticky Notes - Dark Mode
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      1.3
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Microsoft/Sticky-Notes-Dark-Mode.user.js
// @description  Enables official, but hidden, dark mode on the Sticky Notes website.
// @author       AlienDrew
// @match        http*://*/*
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     css https://userstyles.org/styles/179150.css
// ==/UserScript==

// dark scrollbar via https://userstyles.org/styles/179150

// constants
const fastDelay = 100;
const urlDoubleQuote = '%22';
const darkModeThemeId = '4';
const darkModeLinkColor = urlDoubleQuote + '93CFF7' + urlDoubleQuote;
const helpIFrameId = '#helpPaneFull iframe';
const iframeID = 'ocSearchIFrame';
const stickyNotesWebsite = 'https://www.onenote.com/stickynotes';
const stickiesHelpBeginning = 'https://support.office.com/client/results?NS=stickynotes&Context=%7B%22ThemeId%22:4,';
// needs to change when the page loads
var iframeFixCss = '.ocpArticleContent .ocpAlert{background-color:#686868}';
// listener variables
var helpIFrameLoaded = false;
// need to check url
var currentURL = window.location.href;

// function for elements
var elementExists = function(element) {
    return (typeof(element) != 'undefined' && element != null);
};

if (currentURL.startsWith(stickyNotesWebsite)) {// code to run on the sticky notes website
    // theme help iframe
    function checkForHelp() {
        setTimeout(function() {
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
    document.body.classList.add('n-darkMode');
    checkForHelp();
} else if (currentURL.startsWith(stickiesHelpBeginning)) { // code to run on the dark sticky notes help website
    // also apply dark scrollbar to iframe
    const dark_scrollbar = GM_getResourceText('css').split('\n');
    var dark_scrollbar_fixed = "";
    // starts at 1 and ends at the second to last line to remove the @-moz-document encasement
    var k;
    for (k = 1; k < dark_scrollbar.length - 1; k++) {
        dark_scrollbar_fixed = dark_scrollbar_fixed.concat(dark_scrollbar[k]);
    }
    iframeFixCss += dark_scrollbar_fixed;

    // iframe needs dark theme fix
    checkForSearchBar = setInterval(function() {
        var searchBarPage = document.getElementById('ocClientSearch');

        // must wait for the search bar to detect theme
        if (elementExists(searchBarPage)) {
            clearInterval(checkForSearchBar);

            // check for dark theme
            if (searchBarPage.classList.contains('black')) {
                checkForDark = setInterval(function() {
                    var iframe = document.getElementById(iframeID);
                    var iframeDoc = iframe.contentDocument;

                    if (elementExists(iframe) && iframeDoc != null) {
                        clearInterval(checkForDark);

                        // must listen for page load to change style
                        iframe.onload = function () {
                            var iDocument = frames[0].document;
                            var fixNode = document.createElement('style');
                            fixNode.type = 'text/css';
                            fixNode.innerHTML = iframeFixCss;
                            iDocument.body.appendChild(fixNode);
                        }
                    }
                }, 100);
            }
        }
    }, 100);
}