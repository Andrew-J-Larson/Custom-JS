// ==UserScript==
// @name         Indeed - Archive All Messages
// @namespace    https://andrew-j-larson.github.io/
// @version      1.0.6
// @description  Archives all your messages in your Indeed inbox.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://messages.indeed.com/conversations*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Indeed/Archive-All-Messages.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Indeed/Archive-All-Messages.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=indeed.com
// @grant        GM_addStyle
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

const slowLoopDelay = 200; // ms
const loopDelay = 10; // ms
const listHeaderSelector = "#conversation-list-pane-header > div";
const conversationListSelector = "div.msgw-ConversationList";
const conversationListMessagesSelector = conversationListSelector + " > div";
const folderDropdownButtonSelector = "button[aria-describedby='msgw-folderDropdownGroup']";
const messageSelector = "a.msgw-ConversationListItem";
const overflowMenuButtonSelector = "div.msg-OverflowMenu > button[id^='menu-button']";
const archiveButtonSelector = "div[data-valuetext='Archive'].msg-OverflowMenuItem > div[data-cy='conv-action-Archive']";
const noMessageSelectedSelector = "div.msgw-NoticeCard";
const archiveAllButtonClassname = "archiveAllButton";

// FUNCTIONS

function hideElementBasedOnInnerText(innerText, elementToCheck, elementToHide) {
    if (elementToCheck && elementToCheck.innerText == innerText) elementToHide.style.display = "";
    else elementToHide.style.display = "none";
}

// code via https://stackoverflow.com/a/52549234/7312536
function simulateMouseClick(targetNode) {
    function triggerMouseEvent(targetNode, eventType) {
        var clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent(eventType, true, true);
        targetNode.dispatchEvent(clickEvent);
    }
    ["mouseover", "mousedown", "mouseup", "click"].forEach(function (eventType) {
        triggerMouseEvent(targetNode, eventType);
    });
}

// VARIABLES (these need to stay global)

var readyForNextMessage = true;
var waitingForMessage = null; // used to set new instances of archive all
var folderDropdownButton; // has to be checked first before showing button
var conversationList, conversationListMessages; // has to be checked after each message delete
var message; // needs to be set for each message clear

// MAIN

// for stylizing archive all button
GM_addStyle("." + archiveAllButtonClassname + "{box-shadow:inset 0 1px 0 0 #fff;background-color:#fff;border-radius:6px;border:1px solid #dcdcdc;display:inline-block;cursor:pointer;color:#666;font-family:Arial;font-size:15px;padding:4px;margin-left:auto;margin-right:0;text-decoration:none;text-shadow:0 1px 0 #fff}." + archiveAllButtonClassname + ":disabled{box-shadow:none;background-color:#f6f6f6;color:#bababa;text-shadow:none}." + archiveAllButtonClassname + ":not([disabled]):hover{background-color:#f6f6f6}." + archiveAllButtonClassname + ":not([disabled]):active{position:relative;top:1px}");

// need to create archive all button
let archiveAllButton = document.createElement("button");
archiveAllButton.setAttribute("disabled", "");
archiveAllButton.classList.add(archiveAllButtonClassname);
archiveAllButton.innerText = "Archive All";
archiveAllButton.onclick = function () {
    let waitingForMessages = setInterval(function () {
        message = document.querySelector(messageSelector);

        // need to wait to click until async operation is done
        if (readyForNextMessage && message) {
            readyForNextMessage = false;
            archiveAllButton.setAttribute("disabled", "");
            simulateMouseClick(message);

            // need to wait for the overflow menu button to show up so it can be clicked to archive message
            let waitForOverflowMenuButton = setInterval(function () {
                let overflowMenuButton = document.querySelector(overflowMenuButtonSelector);
                if (overflowMenuButton) {
                    clearInterval(waitForOverflowMenuButton);

                    let waitForArchiveButton = setInterval(function () {
                        simulateMouseClick(overflowMenuButton);
                        let archiveButton = document.querySelector(archiveButtonSelector);
                        if (archiveButton && !(((((archiveButton.parentElement).parentElement).parentElement).parentElement).parentElement).hasAttribute('hidden')) {
                            clearInterval(waitForArchiveButton);

                            let waitForMessageClear = setInterval(function () {
                                simulateMouseClick(archiveButton);
                                let noMessageSelected = document.querySelector(noMessageSelectedSelector);
                                if (noMessageSelected) {
                                    clearInterval(waitForMessageClear);

                                    setTimeout(function () { readyForNextMessage = true }, loopDelay);
                                }
                            }, loopDelay);
                        }
                    }, loopDelay);
                }
            }, loopDelay);
        } else if (!message) {
            clearInterval(waitingForMessages);
            let waitForNewInboxMessages = setInterval(function () {
                message = document.querySelector(messageSelector);
                folderDropdownButton = document.querySelector(folderDropdownButtonSelector);
                // only check if there are new messages, when we are in the inbox
                if (folderDropdownButton && folderDropdownButton.innerText == "Inbox" && message) {
                    clearInterval(waitForNewInboxMessages);

                    archiveAllButton.removeAttribute("disabled");
                }
            }, slowLoopDelay);
        }
    }, loopDelay);
};

// MUTATION OBSERVERS

// monitor messages in list, to disable button as needed
var conversationListMessagesObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type === "childList") {
            setTimeout(function () {
                message = document.querySelector(messageSelector);
                if (!message) archiveAllButton.setAttribute("disabled", "");
            }, slowLoopDelay);
        }
    });
});

// monitor clicks on folderDropdownGroup, to hide button as needed
var folderDropdownObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        if (mutation.type === "attributes") {
            setTimeout(function () {
                hideElementBasedOnInnerText("Inbox", folderDropdownButton, archiveAllButton);
                // need to also check if there are messages in case of a needed re-enable
                message = document.querySelector(messageSelector);
                if (message) archiveAllButton.removeAttribute("disabled");
                else archiveAllButton.setAttribute("disabled", "");
            }, slowLoopDelay);
        }
    });
});

// wait for React to load
let waitForReact = setInterval(function () {
    if (document.readyState === "complete") {
        clearInterval(waitForReact);

        // if button ever disappears, put back into page, but must wait for header
        let foundArchiveAllButton = null;
        let checkingArchiveButton = false;
        let readdButtonAsNeeded = setInterval(function () {
            if (!checkingArchiveButton) {
                checkingArchiveButton = true;
                let listHeader = document.querySelector(listHeaderSelector);
                foundArchiveAllButton = document.querySelector("button." + archiveAllButtonClassname);
                folderDropdownButton = document.querySelector(folderDropdownButtonSelector);
                conversationList = document.querySelector(conversationListSelector);
                conversationListMessages = document.querySelector(conversationListMessagesSelector);
                let folderDropdownText = folderDropdownButton
                if (!foundArchiveAllButton && listHeader && folderDropdownButton) {
                    listHeader.appendChild(archiveAllButton);
                    if (document.querySelector(messageSelector)) archiveAllButton.removeAttribute("disabled");
                    hideElementBasedOnInnerText("Inbox", folderDropdownButton, archiveAllButton);
                    // also change display when switching groups
                    folderDropdownObserver.observe(folderDropdownButton, {
                        attributes: true
                    });
                    // also change disabled when no more messages are left
                    conversationListMessagesObserver.observe(conversationList, {
                        childList: true
                    });
                    conversationListMessagesObserver.observe(conversationListMessages, {
                        childList: true
                    });
                }
                checkingArchiveButton = false;
            }
        }, loopDelay);
    }
}, loopDelay);