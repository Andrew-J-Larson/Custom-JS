// ==UserScript==
// @name         Multiplayer Piano - User Ping
// @namespace    https://andrew-j-larson.github.io/
// @version      0.9.95
// @description  Sounds off a notification when the user of script gets a ping!
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        *://*.multiplayerpiano.org/*
// @match        *://*.multiplayerpiano.dev/*
// @match        *://*.multiplayerpiano.net/*
// @match        *://*.singleplayerpiano.com/*
// @match        *://mpp.hri7566.info/*
// @match        *://mppclone.hri7566.info/*
// @match        *://mpp.autoplayer.xyz/*
// @match        *://mpp.lapishusky.dev/*
// @match        *://mpp.yourfriend.lv/*
// @match        *://mpp.l3m0ncao.wtf/*
// @match        *://mpp.terrium.net/*
// @match        *://mpp.hyye.tk/*
// @match        *://mpp.totalh.net/*
// @match        *://mpp.meowbin.com/*
// @match        *://mppfork.netlify.app/*
// @match        *://better.mppclone.me/*
// @match        *://*.openmpp.tk/*
// @match        *://*.mppkinda.com/*
// @match        *://*.augustberchelmann.com/piano/*
// @match        *://piano.ourworldofpixels.com/*
// @match        *://beta-mpp.csys64.com/*
// @match        *://fleetway-mpp.glitch.me/*
// @match        *://*.multiplayerpiano.com/*
// @match        *://*.mppclone.com/*
// @supportURL   https://github.com/Andrew-J-Larson/Custom-JS/tree/main/!-User-Scripts/Multiplayer%20Piano/User-Ping
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Ping/User-Ping.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Ping/User-Ping.user.js
// @icon         https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Ping/iconscout.com/notification-1765818-1505607.png
// @grant        GM_info
// @run-at       document-end
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (andrew.j.larson18+github@gmail.com)

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

/* globals MPP */

// =============================================== SCRIPT CONSTANTS

const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;
const SUPPORT_URL = SCRIPT.supportURL;
const UPDATE_URL = SCRIPT.updateURL;

// =============================================== Files

let latestVersion = null;
let updateURL = UPDATE_URL + '?' + Date.now();
let requestVersion = new XMLHttpRequest();
requestVersion.open('GET', updateURL, false);
requestVersion.send(null);
if (requestVersion.status === 200) {
    let type = requestVersion.getResponseHeader('Content-Type');
    if (type.indexOf("text") !== 1) {
        let responseTextVersion = requestVersion.responseText;
        let textLineVersion = responseTextVersion.split('\n');
        let currentTextLineVersion = 0;
        let findLatestVersion = setInterval(function () {
            if (latestVersion) clearInterval(findLatestVersion);
            else {
                let line = textLineVersion[currentTextLineVersion];
                if (line.startsWith("// @version")) {
                    let lineSplitSpaces = line.split(' ');
                    latestVersion = lineSplitSpaces[lineSplitSpaces.length - 1];
                }
                currentTextLineVersion++;
            }
        }, 1);
    }
} else {
    latestVersion = -1;
    console.warning('[' + NAME + "] failed to find latest script version from " + UPDATE_URL);
    console.warning('[' + NAME + "] skipping version check");
}

// =============================================== CONSTANTS

// Time constants (in milliseconds)
const SECOND = 1000;
const HALF_SECOND = SECOND / 2;
const TENTH_OF_SECOND = SECOND / 10; // mainly for repeating loops
const CHAT_DELAY = HALF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = SECOND * 2; // when you are not the owner, your chat quota is lowered
const NOTIFICATION_DURATION = SECOND * 15; // how long it takes for notifications to disappear

// Audio
const AUDIO_BASE_URL = "https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Ping/freesound.org/";
const PING_SOUND_URL = AUDIO_BASE_URL + "level-up-01.mp3";

// URLs
const GITHUB_REPO = 'https://github.com/Andrew-J-Larson/Custom-JS/';
const GITHUB_ISSUE_TITLE = '[Feedback] ' + NAME + ' ' + VERSION;
const GITHUB_ISSUE_BODY = '<!-- Please write your feedback below this line. -->';
const FEEDBACK_URL = GITHUB_REPO + 'issues/new?title=' + encodeURIComponent(GITHUB_ISSUE_TITLE) + '&body=' + encodeURIComponent(GITHUB_ISSUE_BODY);

// Mod constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const PING_PREFIX = '@'; // MPP uses this for mentions already (DON'T CHANGE)
const ALLOWED_BEFORE_AFTER_CHARS = [
    ' ', '~', '!', '(', ')', '_', '+', '{', '}', '|', ':', '"',
    '<', '>', '?', '-', '=', '[', ']', '\\', ';', '\'', ',', '.', '/'
]

// Mod custom constants
const PREFIX = 'p!';
const PREFIX_LENGTH = PREFIX.length;
const MOD_DISPLAYNAME = "User Ping";
const MOD_USERNAME = MOD_DISPLAYNAME + " (`" + PREFIX + "help`)";
const PRE_MSG = MOD_USERNAME;
const PRE_HELP = PRE_MSG + " [Help]";
const PRE_LINK = PRE_MSG + " [Link]";
const PRE_FEEDBACK = PRE_MSG + " [Feedback]";
const HELP_DESC = "To ping everyone: `" + PING_PREFIX + "all`, `" + PING_PREFIX + "online`, or `" + PING_PREFIX + "everyone` | To ping a specific user: `" + PING_PREFIX + "A Username Here` or `" + PING_PREFIX + "a user id here` | Misc: `" + PREFIX + "link` to get mod download URL, `" + PREFIX + "feedback` to submit feedback, or `" + PREFIX + "test` to hear the ping sound";
const LIST_BULLET = "• ";

// Mod variables
let matches = null;
let matchesIndex = 0;
let matchValid = false;

// =============================================== VARIABLES

let chatDelay = CHAT_DELAY; // for how long to wait until posting another message

// =============================================== OBJECTS

// Create new audio objects prefixed with URL and postfixed with extension
let newAudio = function (name) {
    return new Audio(AUDIO_BASE_URL + name);
}
let pingSound = newAudio("level-up-01.mp3");

// =============================================== PAGE VISIBILITY

let pageVisible = true;
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        pageVisible = false;
    } else {
        pageVisible = true;
    }
});

// =============================================== FUNCTIONS

// Check to make sure letiable is initialized with something
let exists = function (element) {
    if (typeof (element) != "undefined" && element != null) return true;
    return false;
}

// Send messages without worrying about timing
let mppChatSend = function (str, delay) {
    setTimeout(function () { MPP.chat.send(str) }, (exists(delay) ? delay : 0));
};

// Send multiline chats, and return final delay to make things easier for timings
let mppChatMultiSend = function (strArray, optionalPrefix, initialDelay) {
    if (!exists(optionalPrefix)) optionalPrefix = '';
    let newDelay = 0;
    for (let i = 0; i < strArray.length; ++i) {
        let currentString = strArray[i];
        if (currentString != "") {
            ++newDelay;
            mppChatSend(optionalPrefix + strArray[i], chatDelay * newDelay);
        }
    }
    return chatDelay * newDelay;
};

// Sends MPP a notification
let mppNotificationSend = function (notificationObject) {
    // Contents of a notification
    /*
      let notificationObject = {
          id: "Notification-" + Math.random(),
          title: "",
          text: "",
          html: "",
          target: "#piano",
          duration: 30000, // ms, or 30 seconds
          class: "classic"
      };
    */
    // Behaviors of a notification
    /*
     - the text property (if present) overrides the html property
     - the "short" class value shows only the text/html (removes title line separator too)
     - using a value of "-1" on duration causes the notification to be sticky (never disappears)
     - all notification ids are prefixed with "Notification-" even if you give it one
     - it's better to use single quotes around entire html
     - all properties are technically optional
    */

    // send notification
    if (exists(MPP.Notification)) {
        return new MPP.Notification(notificationObject);
    }
    if (notificationObject.title) console.log(notificationObject.title);
    if (notificationObject.text) console.log(notificationObject.text);
    else if (notificationObject.html) {
        // TODO: need a better way to convert HTML to console output
        let htmlObject = document.createElement("div");
        htmlObject.innerHTML = notificationObject.html ? (notificationObject.html).replaceAll('<br>', '\n') : '';
        let htmlToText = (htmlObject.textContent || htmlObject.innerText);
        if (htmlToText) console.log(htmlToText);
        // else, no text in html to display???
    }
    return null;
};

// converts string you want to search for to regex
let stringToRegex = function (string) {
    return new RegExp(string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g");
};

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    // if user switches to VPN, these need to update
    let yourParticipant = MPP.client.getOwnParticipant();
    let yourId = yourParticipant._id;
    let yourUsername = yourParticipant.name;
    // get the message as string
    let input = msg.a.trim();
    let inputLowerCase = input.toLowerCase();
    let participant = msg.p;
    let username = participant.name;
    let userId = participant._id;
    // to check for ping from MPP's built in reply/mention feature
    let isReply = exists(msg.r) ? document.getElementById("msg-" + msg.r) : null;
    let replyNameElement = isReply ? isReply.querySelector('span.name') : null;
    let replyName = replyNameElement ? replyNameElement.innerText : null;
    let pinged = replyName && (yourUsername == replyName.substring(0, replyName.length - 1));

    // check if input contains a command or ping
    let helpActivated = false;
    if (userId == yourId) {
        // make sure the start of the input matches prefix
        if (input.startsWith(PREFIX)) {
            // evaluate input into command and possible arguments
            let message = input.substring(PREFIX_LENGTH).trim();
            let hasArgs = message.indexOf(' ');
            let command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
            let argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1).trim() : null;
            // look through commands
            switch (command.toLowerCase()) {
                case "help": case "h": mppChatSend(PRE_HELP + ' ' + HELP_DESC); break;
                case "link": case "l": mppChatSend(PRE_LINK + " You can download this mod from " + SUPPORT_URL); break;
                case "feedback": case "f": mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback."); break;
                case "test": case "t": pingSound.play(); break;
            }
        }
    } else if (pinged) pingSound.play(); // got an MPP mention
    else if (input.indexOf(PING_PREFIX + yourId) != -1 ||
        input.indexOf(PING_PREFIX + yourUsername) != -1 ||
        inputLowerCase.indexOf(PING_PREFIX + "all") ||
        inputLowerCase.indexOf(PING_PREFIX + "online") ||
        inputLowerCase.indexOf(PING_PREFIX + "everyone")) {
        // check for pings
        matches = [];
        let pingsToMatch = [yourId, yourUsername];
        for (let stringIndex = 0; stringIndex < pingsToMatch.length; stringIndex++) {
            let re = stringToRegex(PING_PREFIX + pingsToMatch[stringIndex]);
            let match = null;
            while ((match = re.exec(input)) != null) {
                matches.push(match);
            }
        }
        let pingsToMatchCaseInsensitive = ["all", "online", "everyone"];
        for (let stringIndex = 0; stringIndex < pingsToMatchCaseInsensitive.length; stringIndex++) {
            let re = stringToRegex(PING_PREFIX + pingsToMatchCaseInsensitive[stringIndex]);
            let match = null;
            while ((match = re.exec(inputLowerCase)) != null) {
                matches.push(match);
            }
        }
        let checkMatches = setInterval(function () {
            if (!matchValid && matches && matches.length > 0 && (matchesIndex < matches.length)) {
                let tempMatch = matches[matchesIndex];
                let tempInputString = tempMatch.input;
                let tempMatchString = tempMatch[0];
                let tempMatchIndex = tempMatch.index;
                let tempMatchEndCharIndex = tempMatch.index + (tempMatchString.length - 1);
                // compare match to determine ping
                let isMatch = true;
                if (tempMatchIndex != 0) {
                    // DON'T MATCH: if a character (before match) is not allowed
                    if (!ALLOWED_BEFORE_AFTER_CHARS.includes(tempInputString[tempMatchIndex - 1])) {
                        isMatch = false;
                    }
                }
                // if index + match length != last index in string
                if (tempMatchEndCharIndex != (tempInputString.length - 1)) {
                    // DON'T MATCH: if a character (after match) is not allowed
                    if (!ALLOWED_BEFORE_AFTER_CHARS.includes(tempInputString[tempMatchEndCharIndex + 1])) {
                        isMatch = false;
                    }
                }

                // if matched, set matchValid and shortly end loop
                if (isMatch) matchValid = true;

                matchesIndex++;
            } else if (matchValid || !matches || (matches && matchesIndex == matches.length)) {
                clearInterval(checkMatches);
                matches = null;
                matchesIndex = 0;
                if (matchValid) {
                    matchValid = false;
                    pingSound.play();
                }
            }
        }, 1);
    }
});
MPP.client.on('dm', function (msg) { // on: any direct message
    let yourParticipant = MPP.client.getOwnParticipant();
    let yourId = yourParticipant._id;
    // you got a direct message
    if (yourId == msg.recipient._id) pingSound.play();
});
MPP.client.on('nq', function (msg) { // on: note quota change
    // changes to note quota also reflect changes to room ownership or switching

    // set new chat delay
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
});

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. repeat)
let slowRepeatingTasks = setInterval(function () {
    // do background tab fix
    if (!pageVisible) {
        let note = MPP.piano.keys["a-1"].note;
        let participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SECOND);

// wait for the client to come online
let waitForMPP = setInterval(function () {
    let MPP_Fully_Loaded = exists(MPP) && exists(MPP.client);
    if (MPP_Fully_Loaded) {
        clearInterval(waitForMPP);

        console.log(PRE_MSG + " Online!");

        // notice for those using the AD riddled website
        let mppcloneOfficialMain = "mppclone.com";
        let mppcloneOfficialMirror = "www.multiplayerpiano.org";
        let mppAdsWebsite = "multiplayerpiano.com";
        let mppAdsWebsiteNotice = '';
        if (window.location.hostname == mppAdsWebsite) {
            mppAdsWebsiteNotice = "It looks like you're on `" + mppAdsWebsite + "`, please consider switching over to one of the official, AD-free websites below:<br>" +
                ` ${LIST_BULLET} <a href="https://${mppcloneOfficialMain}/">${mppcloneOfficialMain}</a> (main website)<br>` +
                ` ${LIST_BULLET} <a href="https://${mppcloneOfficialMirror}/">${mppcloneOfficialMirror}</a> (mirror website)<br><br>`;
        }

        // check if there's an update available
        let latestVersionFound = setInterval(function () {
            if (latestVersion) {
                clearInterval(latestVersionFound);

                let starterNotificationDuration = NOTIFICATION_DURATION;
                let newVersionAvailable = '';
                if (latestVersion != -1) {
                    if (latestVersion != VERSION) {
                        // make sure latestVersion is newer (prevent old updates from sending out false notification about an update available)
                        let versionRegex = /[0-9.]+/g; // this will not display a notification if a beta was to ever be published
                        let latestVersionInt = parseInt((latestVersion.match(versionRegex))[0].replaceAll('.', ''));
                        let currentVersionInt = parseInt((VERSION.match(versionRegex))[0].replaceAll('.', ''));
                        if (latestVersionInt > currentVersionInt) {
                            starterNotificationDuration = -1; // making sticky so user will for sure know that there's a new update
                            newVersionAvailable = `New version available: <code class="markdown" style="color: #0F0 !important">v${latestVersion}</code><br>` +
                                `<br>` +
                                `Please check the website!<br>` +
                                `<a target="_blank" href="${SUPPORT_URL}">` + SUPPORT_URL + '</a><br><br>';
                        }
                    }
                }

                // send notification with basic instructions, and if there's an update include info on that too
                let starterNotificationSetup = {
                    target: "#piano",
                    title: MOD_DISPLAYNAME + " [v" + VERSION + "]",
                    html: mppAdsWebsiteNotice + newVersionAvailable + `Mod created by <a target="_blank" href="${NAMESPACE}">${AUTHOR}</a>, thanks for using it!<br>` +
                        `<br>` +
                        `If you need any help using the mod, try using the command:<br>` +
                        ` ${LIST_BULLET} <code class="markdown" style="color: #0F0 !important">${PREFIX}help</code>`,
                    duration: starterNotificationDuration
                };
                let starterNotification = mppNotificationSend(starterNotificationSetup);
                // need a little delay to wait for toggler button to position itself, to correctly position notifications with it
                setTimeout(function () {
                    starterNotification.position();
                }, TENTH_OF_SECOND);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
