// ==UserScript==
// @name         Microsoft Sticky Notes - Dark Mode
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      1.1
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Microsoft/Sticky-Notes-Dark-Mode.user.js
// @description  Enables official, but hidden, dark mode on the Sticky Notes website.
// @author       AlienDrew
// @match        *://www.onenote.com/stickynotes*
// @run-at       document-body
// @noframes
// ==/UserScript==

// constants
const urlDoubleQuote = '%22';
const darkModeThemeId = '4';
const darkModeLinkColor = urlDoubleQuote + '93CFF7' + urlDoubleQuote;
const fastDelay = 100;
// function for elements
function elementExists(element) {
    return (typeof(element) != 'undefined' && element != null);
}

// apply the dark mode class to the html element
document.body.classList.add('n-darkMode');