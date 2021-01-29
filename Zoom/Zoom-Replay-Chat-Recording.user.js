// ==UserScript==
// @name         Zoom Replay Chat Recording
// @namespace    https://thealiendrew.github.io/
// @version      1.0.7
// @description  Moves the chat history in real time against the recording's current time.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://*.zoom.us/rec/play/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Zoom/Zoom-Replay-Chat-Recording.user.js
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

// converts string time of format HH:MM:SS to only seconds
function timeToSeconds(timeString) {
  // times in seconds, where a second is 1
  const MINUTE = 60;
  const HOUR = 60 * MINUTE;

  let hours, minutes, seconds;
  let stringLength = timeString.length;

  if (stringLength == 8) {
    // get hours, minutes, seconds
    hours = parseInt(timeString.substring(0, 2));
    minutes = parseInt(timeString.substring(3, 5));
    seconds = parseInt(timeString.substring(6));
  } else if (stringLength == 5) {
    // get minutes, seconds
    hours = 0;
    minutes = parseInt(timeString.substring(0, 2));
    seconds = parseInt(timeString.substring(3));
  } else if (stringLength == 2) {
    // get seconds
    hours = minutes = 0;
    seconds = parseInt(timeString);
  } else {
    // no seconds at all
    hours = minutes = seconds = 0;
  }

  return (hours*HOUR)+(minutes*MINUTE)+seconds;
}

let waitForTimeRangeCurrent = setInterval(function() {
  // contains current time
  let timeRangeCurrent = document.querySelector('.vjs-time-range-current');
  if (timeRangeCurrent && timeRangeCurrent.innerText != "") {
    clearInterval(waitForTimeRangeCurrent);

    // contains end video time
    let timeRangeDuration = document.querySelector('.vjs-time-range-duration');
    // where the scroll box is controlled
    let zmScrollbarWrap = document.querySelector('.zm-scrollbar__wrap');
    // the chat that contains all chat items
    let chatList = document.querySelector('.chat-list');
    // array of all chats
    let chatListItems = document.querySelectorAll('.chat-list-item');
    let chatListItemCount = chatListItems.length;

    // need times in seconds
    let endListTime = chatListItems[chatListItemCount-1].querySelector('.chat-time').innerText;
    let endTimeInChat = timeToSeconds(endListTime);
    let endTimeInVideo = timeToSeconds(timeRangeDuration.innerText);
    let chatTimeDiff = endTimeInChat - endTimeInVideo; // positive or negative values acceptable and possible

    // needed for roughly estimating chatTimeDiff better (almost magic numbers)
    // * we're getting leftover seconds in chatTimeDiff (no minutes),
    //   then subtracting the last chatItem's leftover seconds (no minutes),
    //   and finally the most magic number part is multiplying that value by 23/60.
    // * 23/60 was found by taking a few videos and finding a good multiplier between
    //   them all that made all videos sync up to the chat the most.
    let lastChatRemainderSeconds = parseInt(endListTime.substring(endListTime.length-2));
    let appoxSecondsFix = Math.round(23*((((chatTimeDiff/60)%1)*60)-lastChatRemainderSeconds)/60);
    chatTimeDiff -= appoxSecondsFix;

    // need an array of the chat times in seconds
    let chatListItemTimes = new Array(chatListItemCount);
    for (let i = 0; i < chatListItemCount; i++) {
      let timeInSeconds = timeToSeconds(chatListItems[i].querySelector('.chat-time').innerText);
      chatListItemTimes[i] = timeInSeconds - chatTimeDiff;
    }

    // need mutation observer to watch for timeRangeCurrent
    let observer = new MutationObserver(mutations => {
      // watch the current time and scroll to chat
      for(let mutation of mutations) {
        let currentTime = timeToSeconds(mutation.target.textContent);

        // check chat time array for matching time
        let foundIndex = -1;
        let i = chatListItemCount - 1;
        while(i > -1 && foundIndex == -1) {
          if (chatListItemTimes[i] == currentTime) foundIndex = i;
          i--;
        }

        // go to last chat matching the current time (shows up at bottom just like a live chat)
        if (foundIndex >= 0) chatListItems[foundIndex].scrollIntoViewIfNeeded(false);
      }
    });

    // configuration of the observer:
    let config = { childList: true, characterData: true, subtree: true };

    // pass in the target node, as well as the observer options
    observer.observe(timeRangeCurrent, config);
  }
}, 100);