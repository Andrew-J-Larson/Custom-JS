// ==UserScript==
// @name         freeCodeCamp - Donation Auto Remind Later
// @namespace    https://andrew-j-larson.github.io/
// @version      1.0.5
// @description  try to take over the world!
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://www.freecodecamp.org/*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/freeCodeCamp/Donation-Auto-Remind-Later.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/freeCodeCamp/Donation-Auto-Remind-Later.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=freecodecamp.org
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

// Constants (CSS)
const DONATION_LABEL_MODEL_CLASS = "donation-label-modal";
const ASK_ME_LATER_BUTTON_SELECTOR = "button.btn-link:last-of-type";

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // can't use an observer, there's some weird Chromium bug that prevents it from working properly on `document.body`
    /*
    // only observe when elements are being added at the root of the body or in any of the children
    const donationFinderConfig = { childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const donationFinderCallback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList") {
                if (mutation.addedNodes) {
                    for (const addedNode of mutation.addedNodes) {
                        if (addedNode.classList && addedNode.classList.contains(DONATION_LABEL_MODEL_CLASS)) {
                            let donationLabelModel = addedNode;
                            let donationBodyModel = donationLabelModel.parentElement.parentElement.parentElement.parentElement;
                            let askMeLaterButton = donationBodyModel.querySelector(ASK_ME_LATER_BUTTON_SELECTOR);
                            let lastActiveElement = document.activeElement;
                            askMeLaterButton.click();
                            lastActiveElement.focus();
                        }
                    }
                }
            }
        }
    };

    // Create an observer instance linked to the callback function
    const donationFinderObserver = new MutationObserver(donationFinderCallback);

    // Start observing the target node for configured mutations
    donationFinderObserver.observe(document.body, donationFinderConfig);
    */

    // must use `setInterval` instead
    const fps250 = 4; // ms; the delay to keep checking for the donation model
    setInterval(function() {
        // not ever going to clear this interval, so not assigning it a variable is fine for now
        let donationLabelModel = document.querySelector('.' + DONATION_LABEL_MODEL_CLASS);
        if (donationLabelModel) {
            let donationBodyModel = donationLabelModel.parentElement.parentElement.parentElement.parentElement;
            let askMeLaterButton = donationBodyModel.querySelector(ASK_ME_LATER_BUTTON_SELECTOR);
            let lastActiveElement = document.activeElement;
            askMeLaterButton.click();
            lastActiveElement.focus();
        }
    }, fps250);
}, false);
