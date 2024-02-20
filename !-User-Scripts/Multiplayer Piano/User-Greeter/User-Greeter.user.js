// ==UserScript==
// @name         Multiplayer Piano - User Greeter
// @namespace    https://andrew-larson.dev/
// @version      0.4.8
// @description  Greets users who join the room with a custom message!
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
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Greeter/User-Greeter.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Greeter/User-Greeter.user.js
// @icon         https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/User-Greeter/pixabay.com/chat-1873543_960_720.png
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

/* globals jQuery, MPP, Color */

// =============================================== CONSTANTS

// Script constants
const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;
const DOWNLOAD_URL = SCRIPT.downloadURL;

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered

// URLs
const githubRepo = 'https://github.com/Andrew-J-Larson/Custom-JS/';
const githubIssueTitle = '[Feedback] ' + NAME + ' ' + VERSION;
const githubIssueBody = '<!-- Please write your feedback below this line. -->';
const FEEDBACK_URL = githubRepo + 'issues/new?title=' + encodeURIComponent(githubIssueTitle) + '&body=' + encodeURIComponent(githubIssueBody);

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)

// Bot custom constants
const GREET_HI = 0;
const GREET_BYE = 1;
const GREET_ID = "$ID";
const GREET_NAME = "$NAME";
const GREET_COLOR = "$COLOR";
const GREET_PLAYER = '"' + GREET_NAME + '" (' + GREET_ID + ') [' + GREET_COLOR + ']';
const PREFIX = "!";
const PREFIX_LENGTH = PREFIX.length;
const BOT_NAME = "User Greeter";
const BOT_USERNAME = BOT_NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const BASE_COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["feedback", "shows link to send feedback about the bot to the developer"]
];
const BOT_COMMANDS = [
    ["hi [message]", "sets the welcome message for users; " + GREET_NAME + " = username, " + GREET_ID + " = user ID, " + GREET_COLOR + " = user color"],
    ["hi_[choice]", "turns the welcome message on or off; e.g. " + PREFIX + "hi_on"],
    ["bye [message]", "sets the goodbye message for users; " + GREET_NAME + " = username, " + GREET_ID + " = user ID, " + GREET_COLOR + " = user color"],
    ["bye_[choice]", "turns the goodbye message on or off e.g. " + PREFIX + "bye_on"]
];
const BOT_OWNER_COMMANDS = [
    ["active", "toggles the public bot commands on or off"]
];
const PRE_MSG = BOT_NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_HI = PRE_MSG + "[Hi]";
const PRE_BYE = PRE_MSG + "[Bye]";
const PRE_LIMITED = PRE_MSG + "Limited!";
const PRE_ERROR = PRE_MSG + "Error!";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";

// =============================================== VARIABLES

var active = true; // turn off the bot if needed
var pinging = false; // helps aid in getting response time
var pingTime = 0; // changes after each ping
var currentRoom = null; // updates when it connects to room
var chatDelay = CHAT_DELAY; // for how long to wait until posting another message
var endDelay; // used in multiline chats send commands

var hiOn = true;
var byeOn = true;
var hiMessage = "Hi " + GREET_PLAYER + "!"; // user joined
var byeMessage = "Bye " + GREET_PLAYER + "!"; // user left
var currentPlayers = null; // fills up upon joining new rooms and updates when people join/leave

// =============================================== PAGE VISIBILITY

var pageVisible = true;
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        pageVisible = false;
    } else {
        pageVisible = true;
    }
});

// =============================================== FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function (element) {
    if (typeof (element) != "undefined" && element != null) return true;
    return false;
}

// Puts quotes around string
var quoteString = function (string) {
    var newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
}

// Set the bot on or off (only from bot)
var setActive = function (args, userId, yourId) {
    if (userId != yourId) return;
    var choice = args[0];
    var newActive = null;
    switch (choice.toLowerCase()) {
        case "false": case "off": case "no": case "0": newActive = false; break;
        case "true": case "on": case "yes": case "1": newActive = true; break;
        default: console.log("Invalid choice. Bot wasn't turned off or on.");
    }
    if (exists(newActive)) {
        active = newActive;
        console.log("Bot was turned " + (newActive ? "on" : "off") + '.');
    }
}

// Makes all commands into one string
var formattedCommands = function (commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    var commands = '';
    var i;
    for (i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' ' : '') + prefix + commandsArray[i][0];
    }
    return commands;
}

// Gets 1 command and info about it into a string
var formatCommandInfo = function (commandsArray, commandIndex) {
    return LIST_BULLET + PREFIX + commandsArray[commandIndex][0] + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
}

// Send messages without worrying about timing
var mppChatSend = function (str, delay) {
    setTimeout(function () { MPP.chat.send(str) }, (exists(delay) ? delay : 0));
}

// Send multiline chats, and return final delay to make things easier for timings
var mppChatMultiSend = function (strArray, optionalPrefix, initialDelay) {
    if (!exists(optionalPrefix)) optionalPrefix = '';
    var newDelay = 0;
    var i;
    for (i = 0; i < strArray.length; ++i) {
        var currentString = strArray[i];
        if (currentString != "") {
            ++newDelay;
            mppChatSend(optionalPrefix + strArray[i], chatDelay * newDelay);
        }
    }
    return chatDelay * newDelay;
}

// Gets the MPP color name for users color
var mppGetUserColorName = function (hexColor) {
    return (new Color(hexColor)).getName().replace("A shade of ", "");
}

// Send command info to user
var mppCmdSend = function (commandsArray, cmdSubstring, delay) {
    var commandIndex = null;
    // get command index
    var i;
    for (i = 0; i < commandsArray.length; ++i) {
        if (commandsArray[i][0].indexOf(cmdSubstring) == 0) {
            commandIndex = i;
        }
    }
    // display info on command
    mppChatSend(formatCommandInfo(commandsArray, commandIndex), delay);
}

// When there is an incorrect command, show this error
var cmdNotFound = function (cmd) {
    var error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (active) mppChatSend(error);
    else console.log(error);
}

// Commands
var help = function (command, userId, yourId) {
    var isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, LIST_BULLET + PREFIX, true)
            + (active ? ' ' + formattedCommands(BOT_COMMANDS, LIST_BULLET + PREFIX, true) : '')
            + (userId == yourId ? " | Bot Owner Commands: " + formattedCommands(BOT_OWNER_COMMANDS, LIST_BULLET + PREFIX, true) : ''));
    } else {
        var valid = null;
        var commandIndex = null;
        var commandArray = null;
        command = command.toLowerCase();
        // check commands arrays
        var i;
        for (i = 0; i < BASE_COMMANDS.length; i++) {
            if (BASE_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BASE_COMMANDS;
                commandIndex = i;
            }
        }
        var j;
        for (j = 0; j < BOT_COMMANDS.length; j++) {
            if (BOT_COMMANDS[j][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BOT_COMMANDS;
                commandIndex = j;
            }
        }
        var k;
        for (k = 0; k < BOT_OWNER_COMMANDS.length; k++) {
            if (BOT_OWNER_COMMANDS[k][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BOT_OWNER_COMMANDS;
                commandIndex = k;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(commandArray, commandIndex),);
        else cmdNotFound(command);
    }
}
var about = function () {
    mppChatSend(PRE_ABOUT + ' ' + BOT_DESCRIPTION + ' ' + BOT_AUTHOR + ' ' + BOT_NAMESPACE);
}
var link = function () {
    mppChatSend(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
}
var feedback = function () {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
}
var greetMsgSet = function (cmd, intGreet, msg) {
    var greet = "The ";
    var title;
    if (intGreet == GREET_HI) title = PRE_HI;
    else if (intGreet == GREET_BYE) title = PRE_BYE;
    if (!exists(msg)) mppCmdSend(BOT_COMMANDS, cmd + ' ');
    else {
        var sameMsg = false;
        switch (intGreet) {
            case GREET_HI: greet += "welcome"; hiMessage == msg ? sameMsg = true : hiMessage = msg; break;
            case GREET_BYE: greet += "goodbye"; byeMessage == msg ? sameMsg = true : byeMessage = msg; break;
        }
        if (sameMsg) mppChatSend(title + ' ' + greet + " message wasn't changed");
        else mppChatSend(title + ' ' + greet + " message was set to: " + msg.replace(GREET_NAME, "[username here]").replace(GREET_ID, "[user ID here]").replace(GREET_COLOR, "[user color here]"));
    }
}
var greetToggle = function (cmd, intGreet, boolChoice) {
    // check greet, then check current bool, lastly set it if not already
    var greet = "The ";
    var alreadySet = false;
    if (intGreet == GREET_HI) {
        greet += "welcome";
        switch (hiOn) {
            case true: boolChoice ? alreadySet = true : hiOn = false; break;
            case false: boolChoice ? hiOn = true : alreadySet = true; break;
        }
    } else if (intGreet == GREET_BYE) {
        greet += "goodbye";
        switch (byeOn) {
            case true: boolChoice ? alreadySet = true : byeOn = false; break;
            case false: boolChoice ? byeOn = true : alreadySet = true; break;
        }
    }

    // display message
    var title = PRE_MSG + '[' + cmd + ']';
    if (alreadySet) mppChatSend(title + ' ' + greet + " message is already turned " + (boolChoice ? "on" : "off"));
    else mppChatSend(title + ' ' + greet + " message has been turned " + (boolChoice ? "on" : "off"));
}

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    // if user switches to VPN, these need to update
    var yourParticipant = MPP.client.getOwnParticipant();
    var yourId = yourParticipant._id;
    var yourUsername = yourParticipant.name;
    // get the message as string
    var input = msg.a.trim();
    var participant = msg.p;
    var username = participant.name;
    var userId = participant._id;
    // make sure the start of the input matches prefix
    if (userId == yourId && input.startsWith(PREFIX)) {
        console.log('testing?');
        // evaluate input into command and possible arguments
        var message = input.substring(PREFIX_LENGTH).trim();
        var hasArgs = message.indexOf(' ');
        var command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        var argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1) : null;
        var arguments = (hasArgs != -1) ? argumentsString.split(' ') : null;
        // look through commands
        switch (command.toLowerCase()) {
            case "help": case "h": if (active) help(argumentsString); break;
            case "about": case "ab": if (active) about(); break;
            case "link": case "li": if (active) link(); break;
            case "feedback": case "fb": if (active) feedback(); break;
            case "hi": if (active) greetMsgSet(command.toLowerCase(), GREET_HI, argumentsString); break;
            case "bye": if (active) greetMsgSet(command.toLowerCase(), GREET_BYE, argumentsString); break;
            case "hi_on": if (active) greetToggle(command.toLowerCase(), GREET_HI, true); break;
            case "hi_off": if (active) greetToggle(command.toLowerCase(), GREET_HI, false); break;
            case "bye_on": if (active) greetToggle(command.toLowerCase(), GREET_BYE, true); break;
            case "bye_off": if (active) greetToggle(command.toLowerCase(), GREET_BYE, false); break;
            case "active": case "a": setActive(arguments, userId); break;
        }
    }
});
MPP.client.on("ch", function (msg) {
    // set new chat delay based on room ownership after changing rooms
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
    // greeting messages
    if (currentRoom != MPP.client.channel._id) currentPlayers = null;
    var ppl = msg.ppl;
    if (exists(ppl)) { // if list of users is updated
        // clear current players list when changing rooms
        if (currentRoom != MPP.client.channel._id) currentPlayers = null;
        // greet new members not in list
        var updatedPlayers = ppl.map(a => [a._id, a.name, a.color]);
        if (currentPlayers != null) { // if users changed after joining the room, check for new users
            var new_ids = updatedPlayers.slice().map(a => a[0]);
            var old_ids = currentPlayers.slice().map(a => a[0]);
            var i = 0;

            // check players joined
            if (hiOn) {
                var added_ids = [];
                jQuery.grep(new_ids, function (_id) {
                    if (jQuery.inArray(_id, old_ids) == -1) added_ids.push(_id);
                    i++;
                });
                // if we have gained users, welcome them in
                if (exists(added_ids) && added_ids.length > 0) {
                    var j;
                    for (j = 0; j < added_ids.length; j++) {
                        var k;
                        for (k = 0; k < updatedPlayers.length; k++) {
                            // if added _id matches in updatedPlayers, then get name and show hiMessage
                            if (added_ids[j] == updatedPlayers[k][0]) {
                                mppChatSend(PRE_MSG + hiMessage.replace(GREET_NAME, updatedPlayers[k][1])
                                    .replace(GREET_ID, updatedPlayers[k][0])
                                    .replace(GREET_COLOR, mppGetUserColorName(updatedPlayers[k][2])));
                            }
                        }
                    }
                }
            }

            // check players left
            if (byeOn) {
                var removed_ids = [];
                jQuery.grep(old_ids, function (_id) {
                    if (jQuery.inArray(_id, new_ids) == -1) removed_ids.push(_id);
                    i++;
                });
                // if we have lost users, goodbye to them
                if (exists(removed_ids) && removed_ids.length > 0) {
                    var l;
                    for (l = 0; l < removed_ids.length; l++) {
                        var m;
                        for (m = 0; m < currentPlayers.length; m++) {
                            // if removed _id matches in currentPlayers, then get name and show byeMessage
                            if (removed_ids[l] == currentPlayers[m][0]) {
                                mppChatSend(PRE_MSG + byeMessage.replace(GREET_NAME, currentPlayers[m][1])
                                    .replace(GREET_ID, updatedPlayers[m][0])
                                    .replace(GREET_COLOR, mppGetUserColorName(currentPlayers[m][2])));
                            }
                        }
                    }
                }
            }
        }
        currentPlayers = updatedPlayers;
    }
    // update current room info
    currentRoom = MPP.client.channel._id;
});

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. repeat)
var slowRepeatingTasks = setInterval(function () {
    // do background tab fix
    if (!pageVisible) {
        var note = MPP.piano.keys["a-1"].note;
        var participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SECOND);


// Automatically turns off the sound warning (mainly for autoplay)
let triedClickingPlayButton = false;
let playButtonMaxAttempts = 10; // it'll try to find the button this many times, before continuing anyways
let playButtonCheckCounter = 0;
let clearSoundWarning = setInterval(function () {
    let playButton = document.querySelector('#motd > button[i18next-orgval-0="PLAY"]') || document.querySelector("#sound-warning button");
    let playButtonStyle = exists(playButton) ? window.getComputedStyle(playButton) : null;
    let playButtonClickable = exists(playButtonStyle) ? (
        // confirming the play button is clickable is just a little harder in newer MPP versions
        playButtonStyle.display == "block" && playButtonStyle.height != "auto"
    ) : false;
    if (playButtonClickable || playButtonCheckCounter >= playButtonMaxAttempts) {
        clearInterval(clearSoundWarning);

        // only turn off sound warning if it hasn't already been turned off
        if (exists(playButton)) {
            if (playButtonStyle.display == "block" && playButtonStyle.opacity == "1") {
                playButton.click();
                setTimeout(function () {
                    // delay by a little bit to let click register
                    triedClickingPlayButton = true;
                }, HALF_SECOND);
            }
        }
    } else playButtonCheckCounter++;
}, 250);


// Automatically turns off the sound warning (mainly for autoplay)
let triedClickingPlayButton = false;
let playButtonMaxAttempts = 10; // it'll try to find the button this many times, before continuing anyways
let playButtonCheckCounter = 0;
let clearSoundWarning = setInterval(function () {
    let playButton = document.querySelector('#motd > button[i18next-orgval-0="PLAY"]') || document.querySelector("#sound-warning button");
    let playButtonStyle = exists(playButton) ? window.getComputedStyle(playButton) : null;
    let playButtonClickable = exists(playButtonStyle) ? (
        // confirming the play button is clickable is just a little harder in newer MPP versions
        playButtonStyle.display == "block" && playButtonStyle.height != "auto"
    ) : false;
    if (playButtonClickable || playButtonCheckCounter >= playButtonMaxAttempts) {
        clearInterval(clearSoundWarning);

        // only turn off sound warning if it hasn't already been turned off
        if (exists(playButton)) {
            if (playButtonStyle.display == "block" && playButtonStyle.opacity == "1") {
                playButton.click();
                setTimeout(function () {
                    // delay by a little bit to let click register
                    triedClickingPlayButton = true;
                }, HALF_SECOND);
            }
        }

        // wait for the client to come online
        let waitForMPP = setInterval(function () {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id) && MPP.client.channel._id != "") {
                clearInterval(waitForMPP);

                active = true;
                currentRoom = MPP.client.channel._id;
                if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
                console.log(PRE_MSG + " Online!");
            }
        }, TENTH_OF_SECOND);
    } else playButtonCheckCounter++;
}, 250);
