// ==UserScript==
// @name         Multiplayer Piano - Room Color Changer
// @namespace    https://thealiendrew.github.io/
// @version      0.2.3
// @description  Advanced room color changing!
// @author       AlienDrew
// @license      GPL-3.0-or-later
// @match        *://*.multiplayerpiano.org/*
// @match        *://*.multiplayerpiano.dev/*
// @match        *://*.multiplayerpiano.net/*
// @match        *://mpp.hri7566.info/*
// @match        *://mpp.autoplayer.xyz/*
// @match        *://mpp.lapishusky.dev/*
// @match        *://mpp.yourfriend.lv/*
// @match        *://mpp.l3m0ncao.live/*
// @match        *://mpp.terrium.net/*
// @match        *://mpp.hyye.tk/*
// @match        *://mppfork.netlify.app/*
// @match        *://*.mppkinda.com/*
// @match        *://*.augustberchelmann.com/piano/*
// @match        *://piano.ourworldofpixels.com/*
// @match        *://beta-mpp.csys64.com/*
// @match        *://fleetway-mpp.glitch.me/*
// @match        *://*.multiplayerpiano.com/*
// @match        *://*.mppclone.com/*
// @updateURL    https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/Room-Color-Changer/Room-Color-Changer.user.js
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/Room-Color-Changer/Room-Color-Changer.user.js
// @icon         https://raw.githubusercontent.com/TheAlienDrew/Custom-JS/master/!-User-Scripts/Multiplayer%20Piano/Room-Color-Changer/iconarchive.com/color-palette-icon.png
// @grant        GM_info
// @run-at       document-end
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

/* globals MPP */

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
const githubRepo = 'https://github.com/TheAlienDrew/Custom-JS/';
const githubIssueTitle = '[Feedback] ' + NAME + ' ' + VERSION;
const githubIssueBody = '<!-- Please write your feedback below this line. -->';
const FEEDBACK_URL = githubRepo + 'issues/new?title=' + encodeURIComponent(githubIssueTitle) + '&body=' + encodeURIComponent(githubIssueBody);

// MPP Constants (these are not meant to be changed); roomcolor arrays: [0] = inner, [1] = outer
const MPP_DEFAULT_ROOMCOLORS = ["rgb(59, 80, 84)", "rgb(0, 16, 20)"];
const MPP_LOBBY_ROOMCOLORS = ["rgb(115, 179, 204)", "rgb(39, 53, 70)"];

// Bot constants
const INNER_ROOM_COLOR = 0; // used in room color settings (DON'T CHANGE)
const OUTER_ROOM_COLOR = 1; // used in room color settings (DON'T CHANGE)

// Bot constant settings
const PREFIX = "!";
const PREFIX_LENGTH = PREFIX.length;
const BOT_NAME = "Room Color Changer";
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const BOT_ROOM_COLORS = ["#000000", "#046307"]; // these are the colors the bot will set the room to by default
const BASE_COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["feedback", "shows link to send feedback about the bot to the developer"]
];
const BOT_COMMANDS = [
    ["roomcolor (command)", "displays info about room color command, but no command shows the room color commands and special color options"]
];
const ROOMCOLOR_OPTIONS = "Options: normal [bot set room color(s)], default [the MPP general room color(s)], lobby [the MPP lobby room color(s)], but entering nothing shows the current color(s)";
const ROOMCOLOR_COMMANDS = [
    ["roomcolor1 (option/color)", "sets the inner room color"],
    ["roomcolor2 (option/color)", "sets the outer room color"],
    ["roomcolors (option/color)", "sets both the inner and outer room colors (one color)"],
    ["roomcolors ([color1] [color2])", "sets both the inner and outer room colors (separate colors)"]
];
const PRE_MSG = BOT_NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_ROOMCOLOR = PRE_MSG + "[Roomcolor]";
const PRE_ERROR = PRE_MSG + "Error!";
const NOT_OWNER = "The bot isn't the owner of the room";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";

// =============================================== VARIABLES

var active = true; // turn off the bot if needed
var chatDelay = CHAT_DELAY; // for how long to wait until posting another message

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
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Puts quotes around string
var quoteString = function(string) {
    var newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
}

// Makes all commands into one string
var formattedCommands = function(commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    var commands = '';
    var i;
    for(i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' ' : '') + prefix + commandsArray[i][0];
    }
    return commands;
}

// Gets 1 command and info about it into a string
var formatCommandInfo = function(commandsArray, commandIndex) {
    return LIST_BULLET + PREFIX + commandsArray[commandIndex][0] + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
}

// Send messages without worrying about timing
var mppChatSend = function(str, delay) {
    setTimeout(function(){MPP.chat.send(str)}, (exists(delay) ? delay : 0));
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    var error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (active) mppChatSend(error);
    else console.log(error);
}

// Validates colors
var isColor = function(strColor){
    // no need to test if color exists
    var s = new Option().style;
    s.color = strColor;
    var result = s.color != "";
    if (!result) {
        var output = "Invalid color";
        if (exists(strColor) && strColor != "") console.log(output + ": " + strColor);
        else console.log(output + '.');
    }
    return result;
}

// Checks to see if HEX color is valid
var isHexColor = function(strColor) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(strColor);
}

// Convert HSL to HEX color
var HSLToHex = function(hsl) {
    let sep = hsl.indexOf(",") > -1 ? "," : " ";
    hsl = hsl.substr(4).split(")")[0].split(sep);

    let h = hsl[0],
        s = hsl[1].substr(0,hsl[1].length - 1) / 100,
        l = hsl[2].substr(0,hsl[2].length - 1) / 100,
        c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    // Having obtained RGB, convert channels to hex
    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    // Prepend 0s, if necessary
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
}

// Convert RGB to HEX color
var RGBToHex = function(rgb) {
    // Choose correct separator
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    // Turn "rgb(r,g,b)" into [r,g,b]
    rgb = rgb.substr(4).split(")")[0].split(sep);

    let r = (+rgb[0]).toString(16),
        g = (+rgb[1]).toString(16),
        b = (+rgb[2]).toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    return "#" + r + g + b;
}

// Get CSS color name as HEX color
var colorToHEX = function(strColor) {
    if (!isColor(strColor)) return null;
    strColor = strColor.toLowerCase();
    if (isHexColor(strColor)) {
        // must convert hex to full 6 hexadecimal value
        if (strColor.length == 4) {
            var r = strColor.substring(1, 2);
            var g = strColor.substring(2, 3);
            var b = strColor.substring(3, 4);

            strColor = '#' + r + r + g + g + b + b;
        }
        return strColor;
    }

    // Create fake div
    let fakeDiv = document.createElement("div");
    fakeDiv.style.color = strColor;
    document.body.appendChild(fakeDiv);

    // Get color of div
    let cs = window.getComputedStyle(fakeDiv),
        pv = cs.getPropertyValue("color");

    // Remove div after obtaining desired color value
    document.body.removeChild(fakeDiv);

    // Convert to hex now that we have color values
    pv = pv.toLowerCase();
    if (pv.indexOf("rgb") == 0) pv = RGBToHex(pv);
    else if (pv.indexOf("hsl") == 0) pv = HSLToHex(pv);
    // else it must be HEX now

    return pv;
}

// Change the room colors
var roomColorAreaToString = function(area) {
    // send string value from room color area number value
    switch(area) {
        case INNER_ROOM_COLOR: return "inner"; break;
        case OUTER_ROOM_COLOR: return "outer"; break;
        default: return "unknown"; break; // shouldn't ever get here
    }
}
var currentRoomColor = function(area) {
    // shows the current color of ths choosen room area
    var color = null;

    if (area == INNER_ROOM_COLOR) {
        color = MPP.client.channel.settings.color;
    } else if (area == OUTER_ROOM_COLOR) {
        color = MPP.client.channel.settings.color2;
    }

    // backup solution in the case of colors not set in the room setting
    if (!exists(color)) {
        var background = document.body.style.background;
        var rgb1StartIndex = background.indexOf("rgb(");
        var rgb1EndIndex = background.indexOf(')', rgb1StartIndex + 4) + 1;
        if (area == INNER_ROOM_COLOR) {
            color = background.substring(rgb1StartIndex, rgb1EndIndex);
        } else if (area == OUTER_ROOM_COLOR) {
            var rgb2StartIndex = background.indexOf("rgb(", rgb1EndIndex);
            var rgb2EndIndex = background.indexOf(')', rgb2StartIndex + 4) + 1;
            color = background.substring(rgb2StartIndex, rgb2EndIndex);
        }
    }

    return color;
}
var getRoomColorArea = function(area) {
    // get area we are setting a color to
    var valid = null;
    if (exists(area)) { // don't continue if value is already correct
        switch(area) {
            case INNER_ROOM_COLOR:
            case OUTER_ROOM_COLOR: return area; break;
        }
        // fix string if not value
        if (area != "") valid = area.toLowerCase();
    }
    var result = null;
    var output = "";

    switch(valid) {
        case "inner": case "inside": case "center": case "1": result = INNER_ROOM_COLOR; break;
        case "outer": case "outside": case "outskirts": case "2": result = OUTER_ROOM_COLOR; break;
        default: console.log("Invalid area: " + quoteString(area)); break;
    }

    if (valid != null) console.log(output + '.'); return null;
    return result;
}
var getRoomColorSet = function(area, color) {
    // get the set we need to change area color
    var validArea = getRoomColorArea(area);
    var validColor = colorToHEX(color);
    var result = null;
    var output = null;

    switch(validArea) {
        case INNER_ROOM_COLOR:
        case OUTER_ROOM_COLOR: output = roomColorAreaToString(validArea); break;
    }
    switch(validArea) {
        case INNER_ROOM_COLOR: result = {color: validColor, color2: colorToHEX(currentRoomColor(OUTER_ROOM_COLOR))}; break; // second color gets reset without setting it with first color
        case OUTER_ROOM_COLOR: result = {color2: validColor}; break;
    }

    if (output != null) {
        output = output.charAt(0).toUpperCase() + output.slice(1);
        output += " color will be set to: " + color;
        console.log(output);
    }
    return result;
}
var getRoomColorsSet = function(color1, color2) {
    // get the set we need to change colors
    var validColor1 = colorToHEX(color1);
    var validColor2 = colorToHEX(color2);
    var result = null;
    var output = null;

    if (validColor1 != null && validColor2 != null) result = {color: validColor1, color2: validColor2};
    else if (validColor1 != null) result = {color: validColor1, color2: colorToHEX(currentRoomColor(OUTER_ROOM_COLOR))}; // second color gets reset without setting it with first color
    else if (validColor2 != null) result = {color2: validColor2};

    if (validColor1 != null) output = "Room " + roomColorAreaToString(INNER_ROOM_COLOR) + " color will be set to: " + color1;
    if (validColor2 != null) output += (output == null ? "" : "\n") + "Room " + roomColorAreaToString(OUTER_ROOM_COLOR) + " color will be set to: " + color2;

    if (output != null) console.log(output);
    return result;
}
var setRoomColor = function(area, color) {
    // set color based on inner or outer area
    var isOwner = MPP.client.isOwner();

    var set = getRoomColorSet(area, color);
    if (isOwner && set != null) {
        MPP.client.sendArray([{m: "chset", set: set}]);
        return true;
    } else { // room ownership (other errors are logged from other functions)
        if (!isOwner) console.log(NOT_OWNER);
        return false;
    }
}
var setRoomColors = function(color1, color2) {
    // set both inner and outer colors
    var isOwner = MPP.client.isOwner();

    var set = getRoomColorsSet(color1, color2);
    if (isOwner && set != null) {
        MPP.client.sendArray([{m: "chset", set: set}]);
        return true;
    } else { // room ownership (other errors are logged from other functions)
        if (!isOwner) console.log(NOT_OWNER);
        return false;
    }
}
var mppRoomColorSend = function(area, color, delay) { // area is the INNER or OUTER constant
    // check the color string for defaults or show color
    if (exists(color) && color != "") {
        var checkColor = (color != "") ? color.toLowerCase() : "normal";
        switch(checkColor) {
            case "normal": color = BOT_ROOM_COLORS[area]; break;
            case "default": case "mpp": color = MPP_DEFAULT_ROOMCOLORS[area]; break;
            case "lobby": case "test": color = MPP_LOBBY_ROOMCOLORS[area]; break;
        }

        if (!setRoomColor(area, color)) mppChatSend(PRE_ERROR + " (roomcolor" + (area + 1) + ") Invalid " + roomColorAreaToString(area) + " room color", delay);
    } else {
        color = currentRoomColor(area);
        mppChatSend(PRE_ROOMCOLOR + " The " + roomColorAreaToString(area) + " room color is currently set to " + color, delay);
    }
}

// Commands
var help = function(command, userId, yourId) {
    var isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        var publicCommands = formattedCommands(BOT_COMMANDS, LIST_BULLET + PREFIX, true);
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, LIST_BULLET + PREFIX, true)
                             + publicCommands);
    } else {
        var valid = null;
        var commandIndex = null;
        var commandArray = null;
        command = command.toLowerCase();
        // check commands arrays
        var i;
        for(i = 0; i < BASE_COMMANDS.length; i++) {
            if (BASE_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BASE_COMMANDS;
                commandIndex = i;
            }
        }
        var j;
        for(j = 0; j < BOT_COMMANDS.length; j++) {
            if (BOT_COMMANDS[j][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BOT_COMMANDS;
                commandIndex = j;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(commandArray, commandIndex),);
        else cmdNotFound(command);
    }
}
var about = function() {
    mppChatSend(PRE_ABOUT + ' ' + BOT_DESCRIPTION + ' ' + BOT_AUTHOR + ' ' + BOT_NAMESPACE);
}
var link = function() {
    mppChatSend(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
}
var feedback = function() {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
}
var roomcolor = function(command) {
    if (!exists(command) || command == "") {
        mppChatSend(PRE_ROOMCOLOR + ' ' + ROOMCOLOR_OPTIONS, 0);
        mppChatSend("Commands: " + formattedCommands(ROOMCOLOR_COMMANDS, LIST_BULLET + PREFIX, true), 0);
    } else {
        var valid = null;
        var commandIndex = null;
        command = command.toLowerCase();
        // check commands array
        var i;
        for(i = 0; i < ROOMCOLOR_COMMANDS.length; ++i) {
            if (ROOMCOLOR_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandIndex = i;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(ROOMCOLOR_COMMANDS, commandIndex), 0);
        else cmdNotFound(command);
    }
}
var roomcolor1 = function(color) {
    mppRoomColorSend(INNER_ROOM_COLOR, color, 0);
}
var roomcolor2 = function(color) {
    mppRoomColorSend(OUTER_ROOM_COLOR, color, 0);
}
var roomcolors = function(argsColors) {
    // check the arguments for color string defaults or show colors
    var color1 = currentRoomColor(INNER_ROOM_COLOR);
    var color2 = currentRoomColor(OUTER_ROOM_COLOR);
    if (exists(argsColors) && argsColors.length > 0) {
        var error = PRE_ERROR + " (roomcolors)";
        // make sure extra spaces aren't being used (will show up as extra arguments)
        if (argsColors.length <= 2) {
            // get color1
            var newColor1 = argsColors[INNER_ROOM_COLOR].toLowerCase();
            switch(newColor1) {
                case "normal": color1 = BOT_ROOM_COLORS[INNER_ROOM_COLOR]; break;
                case "default": case "mpp": color1 = MPP_DEFAULT_ROOMCOLORS[INNER_ROOM_COLOR]; break;
                case "lobby": case "test": color1 = MPP_LOBBY_ROOMCOLORS[INNER_ROOM_COLOR]; break;
                default: color1 = newColor1;
            }

            // get color2
            var newColor2 = newColor1;
            if (argsColors.length > 1) newColor2 = argsColors[OUTER_ROOM_COLOR].toLowerCase();
            switch(newColor2) {
                case "normal": color2 = BOT_ROOM_COLORS[OUTER_ROOM_COLOR]; break;
                case "default": case "mpp": color2 = MPP_DEFAULT_ROOMCOLORS[OUTER_ROOM_COLOR]; break;
                case "lobby": case "test": color2 = MPP_LOBBY_ROOMCOLORS[OUTER_ROOM_COLOR]; break;
                default: color2 = newColor2;
            }

            if (!setRoomColors(color1, color2)) mppChatSend(error + ' ' + (MPP.client.isOwner() ? "Invalid room color(s)" : NOT_OWNER), 0);
        } else mppChatSend(error + "Too many arguments (are you sure you removed spaces from the color values?)", 0);
    } // show the room colors
    else mppChatSend(PRE_ROOMCOLOR + " The room colors are currently set to: " + roomColorAreaToString(INNER_ROOM_COLOR) + " = " + color1 + ", " + roomColorAreaToString(OUTER_ROOM_COLOR) + " = " + color2, 0);
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
    if (input.startsWith(PREFIX)) {
        // evaluate input into command and possible arguments
        var message = input.substring(PREFIX_LENGTH).trim();
        var hasArgs = message.indexOf(' ');
        var command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        var argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1) : null;
        var arguments = (hasArgs != -1) ? argumentsString.split(' ') : null;
        // look through commands
        switch (command.toLowerCase()) {
            case "help": case "h": if (active) help(argumentsString, userId, yourId); break;
            case "about": case "ab": if (active) about(); break;
            case "link": case "li": if (active) link(); break;
            case "feedback": case "fb": if (active) feedback(); break;
            case "roomcolor": case "rc": if (active) roomcolor(argumentsString); break;
            case "roomcolor1": case "rc1": if (active) roomcolor1(argumentsString); break;
            case "roomcolor2": case "rc2": if (active) roomcolor2(argumentsString); break;
            case "roomcolors": case "rcs": if (active) roomcolors(arguments); break;
        }
    }
});
MPP.client.on("ch", function(msg) {
    // set new chat delay based on room ownership after changing rooms
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
});

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. repeat)
var slowRepeatingTasks = setInterval(function() {
    // do background tab fix
    if (!pageVisible) {
        var note = MPP.piano.keys["a-1"].note;
        var participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SECOND);

// Automatically turns off the sound warning (mainly for autoplay)
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);
        playButton.click();
        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id) && MPP.client.channel._id != "") {
                clearInterval(waitForMPP);

                console.log(PRE_MSG + " Online!");
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
