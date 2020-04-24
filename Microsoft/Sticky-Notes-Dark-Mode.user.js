// ==UserScript==
// @name         Microsoft Sticky Notes - Dark Mode
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      1.2
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Microsoft/Sticky-Notes-Dark-Mode.user.js
// @description  Enables official, but hidden, dark mode on the Sticky Notes website.
// @author       AlienDrew
// @match        *://www.onenote.com/stickynotes*
// @run-at       document-body
// @noframes
// ==/UserScript==

// constants
const fastDelay = 100;
const urlDoubleQuote = '%22';
const darkModeThemeId = '4';
const darkModeLinkColor = urlDoubleQuote + '93CFF7' + urlDoubleQuote;
const helpIFrameId = '#helpPaneFull iframe';
// listener variables
var helpIFrameLoaded = false;

// function for elements
function elementExists(element) {
    return (typeof(element) != 'undefined' && element != null);
}

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