// ==UserScript==
// @name         Open in Microsoft Store
// @namespace    https://andrew-j-larson.github.io/
// @version      1.0.4
// @description  When visiting the webpage for a Microsoft Store app, there will now be an additional option to open the said app in the Microsoft Store.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://apps.microsoft.com/store/detail/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Tampermonkey-Scripts/main/Microsoft/Open-in-Microsoft-Store.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Tampermonkey-Scripts/main/Microsoft/Open-in-Microsoft-Store.user.js
// @icon         https://www.google.com/s2/favicons?domain=microsoft.com
// @grant        none
// @noframes
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (andrew.j.larson18+github@gmail.com)

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

// CONSTANTS
const MS_STORE_URI = "ms-windows-store://pdp/?ProductId=";
const OPEN_IN_MS = "Open in Store app";
const Get_Or_Remove_Button_Selector = "button[id^='getOrRemoveButton-']";
const intervalSpeed = 100; // ms

// Only activate if we are running on Windows 10 or newer
let UserAgent = window.navigator.userAgent;
if (!UserAgent.includes("Windows NT 10.0") && !UserAgent.includes("Windows NT 11.0")) return false;

// Get the product ID from webpage
let getOrRemoveButton; // need this button as reference to create new one
let ProductID;
let waitingForAppInfo = setInterval(function () {
    // need to get the button and its parent element for creating a new button
    getOrRemoveButton = document.querySelector(Get_Or_Remove_Button_Selector);
    if (getOrRemoveButton && getOrRemoveButton.parentElement) {
        clearInterval(waitingForAppInfo);

        ProductID = getOrRemoveButton.id.split('-')[1];

        // Create elements for open in MS store button
        let openInStoreButton = getOrRemoveButton.cloneNode(true);
        openInStoreButton.id = "openInStoreButton-" + ProductID;
        openInStoreButton.onclick = function () { location.href = MS_STORE_URI + ProductID };
        let openInStoreButtonDiv = openInStoreButton.querySelector('div');
        openInStoreButtonDiv.ariaLabel = openInStoreButtonDiv.ariaLabel.replace("Get", "Open");
        openInStoreButtonDiv.innerText = openInStoreButtonDiv.innerText.replace("Get", "Open");
        // place button right after the first button
        getOrRemoveButton.parentElement.insertBefore(openInStoreButton, getOrRemoveButton.nextSibling);
    }
}, intervalSpeed);
