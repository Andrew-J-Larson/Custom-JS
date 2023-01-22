// ==UserScript==
// @name         Zoom - Replay Chat Recording
// @namespace    https://thealiendrew.github.io/
// @version      1.1.0
// @description  Moves the chat history in "real time" against the recording's current time.
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        https://*.zoom.us/rec/play/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Zoom/Replay-Chat-Recording.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Zoom/Replay-Chat-Recording.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=zoom.us
// @grant        none
// ==/UserScript==

/* Copyright (C) 2023  Andrew Larson (thealiendrew@gmail.com)

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