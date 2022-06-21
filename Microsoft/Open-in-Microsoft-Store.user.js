// ==UserScript==
// @name         Open in Microsoft Store
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  When visiting the webpage for a Microsoft Store app, there will now be an additional option to open the said app in the Microsoft Store.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @include      /^https?:\/\/www\.microsoft\.com\/[^\\]*\/p\/[^\\]*/[^\\]*$/
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Microsoft/Open-in-Microsoft-Store.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Microsoft/Open-in-Microsoft-Store.user.js
// @icon         https://www.google.com/s2/favicons?domain=microsoft.com
// @grant        none
// @noframes
// ==/UserScript==

// CONSTANTS
const MS_STORE_URI = "ms-windows-store://pdp/?ProductId=";
const OPEN_IN_MS = "Open in Microsoft Store";
const Button_Pannel_Selector = "#ButtonPanel_buttonPanel > div";
const intervalSpeed = 100; // ms

// Only activate if we are running on Windows 10 or newer
let UserAgent = window.navigator.userAgent;
if (!UserAgent.includes("Windows NT 10.0") && !UserAgent.includes("Windows NT 11.0")) return false;

// Get the product ID from webpage
let ProductID;
let ProductTitle;
let waitingForAppInfo = setInterval(function() {
    // window.pl contains the MS store app info we need
    let buttonPanel = document.querySelector(Button_Pannel_Selector);
    if (window.pl && window.pl.id && window.pl.title && buttonPanel) {
        clearInterval(waitingForAppInfo);

        ProductID = window.pl.id;
        ProductTitle = window.pl.title;

        // Create elements for open in MS store button
        let openInStoreAnchor = document.createElement("a");
        openInStoreAnchor.href = MS_STORE_URI + ProductID;
        openInStoreAnchor.target = "_self";
        openInStoreAnchor.classList.add("pi-overflow-ctrl");
        openInStoreAnchor.role = "presentation"
        let openInStoreButton = document.createElement("button");
        openInStoreButton.setAttribute("data-tv-default-focus-rank", "600");
        openInStoreButton.setAttribute("data-focus-rank", "600");
        openInStoreButton.setAttribute("aria-label", OPEN_IN_MS);
        openInStoreButton.setAttribute("aria-disabled", "false");
        openInStoreButton.id = "buttonPanel_AppIdentityOpenButton";
        openInStoreButton.classList.add("c-button");
        openInStoreButton.classList.add("f-primary");
        openInStoreButton.classList.add("cli_defaultFocus");
        openInStoreButton.type = "button";
        openInStoreButton.setAttribute("data-tv-strategy-up", "projection");
        openInStoreButton.setAttribute("data-tv-strategy-down", "projection");
        let openInStoreSpan = document.createElement("span");
        openInStoreSpan.setAttribute("aria-hidden", "true");
        openInStoreSpan.innerText = OPEN_IN_MS;
        // build element together
        openInStoreButton.appendChild(openInStoreSpan);
        openInStoreAnchor.appendChild(openInStoreButton);
        buttonPanel.appendChild(openInStoreAnchor);
    }
}, intervalSpeed);