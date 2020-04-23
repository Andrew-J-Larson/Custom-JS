// ==UserScript==
// @name         Microsoft Sticky Notes - Dark Mode
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      1.0
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Microsoft/Sticky-Notes-Dark-Mode.user.js
// @description  Enables official, but hidden, dark mode on the Sticky Notes website.
// @author       AlienDrew
// @match        *://www.onenote.com/stickynotes*
// @run-at       document-start
// @noframes
// ==/UserScript==

// apply the dark mode class to the html element
document.documentElement.classList.add('n-darkMode');