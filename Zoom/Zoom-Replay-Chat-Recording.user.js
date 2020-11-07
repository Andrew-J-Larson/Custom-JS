// ==UserScript==
// @name         Zoom Replay Chat Recording
// @namespace    https://thealiendrew.github.io/
// @version      1.0.3
// @description  Moves the chat history in real time against the recording's current time.
// @author       AlienDrew
// @match        https://*.zoom.us/rec/play/*
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Zoom/Zoom-Replay-Chat-Recording.user.js
// @icon         data:image/png;base64,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
// @grant        none
// ==/UserScript==

/* Copyright (C) 2020  Andrew Larson (thealiendrew@gmail.com)

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

const PRE_EMPTY_TIME = "00:";
const TIME_RANGE_CURRENT_CLASS = '.vjs-time-range-current';

let waitForTimeRangeCurrent = setInterval(function() {
  // contains current time
  let timeRangeCurrent = document.querySelector(TIME_RANGE_CURRENT_CLASS);
  if (timeRangeCurrent && timeRangeCurrent.innerText != "") {
    clearInterval(waitForTimeRangeCurrent);

    // where the scroll box is controlled
    let zmScrollbarWrap = document.querySelector('.zm-scrollbar__wrap');
    // the chat that contains all chat items
    let chatList = document.querySelector('.chat-list');
    // array of all chats
    let chatListItems = document.querySelectorAll('.chat-list-item');
    let chatListItemCount = chatListItems.length;

    // need an array of the chat times
    let chatListItemTimes = new Array(chatListItemCount);
    for (let i = 0; i < chatListItemCount; i++) {
      chatListItemTimes[i] = chatListItems[i].querySelector('.chat-time').innerText;
    }

    // need mutation observer to watch for timeRangeCurrent
    let observer = new MutationObserver(mutations => {
      // watch the current time and scroll to chat
      for(let mutation of mutations) {
        let currentTime = mutation.target.textContent;

        // remove all `00:` from beginnings
        while(currentTime.indexOf(PRE_EMPTY_TIME) == 0) {
          currentTime = currentTime.substring(3);
        }

        // check chat time array for matching time
        let foundIndex = -1;
        let i = chatListItemCount - 1;
        while(i > -1 && foundIndex == -1) {
          if (chatListItemTimes[i] == currentTime) foundIndex = i;
          i--;
        }

        if (foundIndex >= 0) chatListItems[foundIndex].scrollIntoViewIfNeeded(false);
      }
    });

    // configuration of the observer:
    let config = { childList: true, characterData: true, subtree: true };

    // pass in the target node, as well as the observer options
    observer.observe(timeRangeCurrent, config);
  }
}, 100);