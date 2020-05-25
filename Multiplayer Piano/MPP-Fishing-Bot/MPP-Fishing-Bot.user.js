// ==UserScript==
// @name         Fishing Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.8.5
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Multiplayer%20Piano/MPP-Fishing-Bot/MPP-Fishing-Bot.user.js
// @description  Fishes for new colors!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @icon         https://icons.iconarchive.com/icons/fasticon/fish-toys/256/Green-Fish-icon.png
// @grant        GM_info
// @run-at       document-end
// @noframes
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

/* globals MPP, Color */

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
const MINUTE = 60 * SECOND;
const FIVE_MINUTES = 5 * MINUTE;

// URLs
const FEEDBACK_URL = "https://forms.gle/YJRWFTvh7sFZBuDCA";
const USER_COLORS_URL = "https://thealiendrew.github.io/mpp/colors/";

// Bot custom constants
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey, and thanks to grimmdude for the MIDIPlayerJS library."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_COLORS = PRE_MSG + "[Colors]";
const PRE_KEK_TAKE = PRE_MSG + "[Kek Take]";
const PRE_KEK_EAT = PRE_MSG + "[Kek Eat]";
const PRE_AUDIO = PRE_MSG + "[Audio]";
const PRE_ERROR = PRE_MSG + "Error!";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
// `fishing` specific constants
const FISHING_BOT_ID = "565887aa860ba601611b7615";
const FISH_INTERVAL = FIVE_MINUTES;
const CMD_PREFIX = '/';
const CMD_CAST = ["cast", "fish"];
const CMD_REEL = "reel";
const CMD_SACK = ["sack", "caught"];
// const CMD_COUNT_FISH = "count_fish";
const CMD_EAT = "eat";
//const CMD_GIVE = ["give", "bestow"];
const CMD_PICK = "pick";
const CMD_TAKE = "take";
const CMD_YEET = "yeet";
// const CMD_TREE = "tree";
const CMD_LOOK = "look";
// const CMD_COLOR = "color";
const CMD_TREE = "tree";
const BASE_COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["link", "get the download link for this bot"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["colors", "shows link that has all the possible player colors, and their HEX codes"]
];
const BOT_OWNER_COMMANDS = [
    ["kektake", "toggles the kek auto taking on or off"],
    ["kekeat", "toggles the kek auto eating on or off"],
    ["audio", "toggles the audio on or off"]
];
const FRUIT = "kek";
const NON_EDIBLES = ["Can"];
const INV_BULLET = "◍";
const CAUGHT = "caught";
const ATE = "ate";
const TOOK = "took";
const COLORED = "made him/her turn";
const NOT_REALLY = "Upon looking in a mirror he/she finds it didn't actually do so, though.";
const BITTEN = "is getting a bite";
const LOST = "Some of the fish were lost in the disaster...";
const FRUIT_FALL = "A kekklefruit was knocked to the ground.";
const SAW_ITEMS = "An island where there's water and fishing going on.  And that stuff on the ground. There's ";
const FRUIT_PICK = "picked";
const BOOST = "fishing boost.";

// Audio
const AUDIO_BASE_URL = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-Fishing-Bot/freesound.org/";
const AUDIO_EXENSION = "mp3";

// =============================================== OBJECT INITIALIZERS

// Create new audio objects prefixed with URL and postfixed with extension
var newAudio = function(name) {
    return new Audio(AUDIO_BASE_URL + name + '.' + AUDIO_EXENSION);
}

// =============================================== AUDIO

var castedSound = newAudio("fishingreel-throw");
var reeledSound = newAudio("fishing-reel");
var pickedSound = newAudio("item-sound");
var caughtSound = newAudio("water-splash");
var bittenSound = newAudio("angel-fly-fish-reel-fast-wind-1");
var lostSound = newAudio("wood-break");
var gotFruitSound = newAudio("61-low-bongo");
var fruitFellSound = newAudio("thud-dry");
var boostSound = newAudio("video-game-sfx-positive-action-long-tail");
var coloredSound = newAudio("powerup2");

// =============================================== VARIABLES

var active = true; // turn off the bot if needed
var audioEnabled = true; // allows user to turn off sound
var currentRoom = null; // updates when it connects to a room
var fishTimer = 0; // changes while rod is cast
var invNonEdibles = []; // changes when we get a nonedible item, used in yeeting at tree
var tooMuchCarried = false;
// The following variables are used in command execution detection
var casted = false;
var losing = false;
var picked = false;
var fruitFell = false;
var gotFruit = false;
var notYeeted = false;
var seen = false;
var checkingSack = false;
var invSack = true;
var takeNonEdible = ""; // changes to item it can take when available
var kekTakeOption = false; // this allows for auto taking the fruit when it drops
var kekEatOption = false; // this allows for auto eating the fruit when you get it

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

// Plays audio only when enabled
var audioPlay = function(audioObj) {
    if (audioEnabled) audioObj.play();
}

// =============================================== FUNCTIONS

// Send messages without worrying about timing
var mppChatSend = function(str, delay) {
    setTimeout(function(){MPP.chat.send(str)}, (exists(delay) ? delay : 0));
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
    return LIST_BULLET + CMD_PREFIX + commandsArray[commandIndex][0] + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
}

// Commands for `fishing`
var cast = function() {
    mppChatSend(CMD_PREFIX + CMD_CAST[0]);
}
var reel = function() {
    mppChatSend(CMD_PREFIX + CMD_REEL);
}
var sack = function() {
    mppChatSend(CMD_PREFIX + CMD_SACK[0]);
}
var eat = function(item) {
    mppChatSend(CMD_PREFIX + CMD_EAT + ' ' + item);
}
var pick = function() {
    mppChatSend(CMD_PREFIX + CMD_PICK);
}
var take = function(item) {
    mppChatSend(CMD_PREFIX + CMD_TAKE + ' ' + item);
}
var yeet = function(item) {
    mppChatSend(CMD_PREFIX + CMD_YEET + ' ' + item.toLowerCase());
}
var look = function() {
    mppChatSend(CMD_PREFIX + CMD_LOOK);
}
// Format strings for when ...
var noTook = function(username, item) {
    // you can't take an item
    return "Friend " + username + ": You can't take " + item + " from outside.";
}
var sackContents = function(username) {
    // you're looking at your sack of items
    return "Contents of " + username + "'s fish sack: ";
}
var carryingTooMuch = function(username) {
    // can't take anything when carrying too much
    return "Friend " + username + " is carrying too much.";
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    var error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (active) mppChatSend(error);
    else console.log(error);
}

// Commands for this bot
var help = function(command, userId, yourId) {
    var isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, LIST_BULLET + CMD_PREFIX, true)
                             + (userId == yourId ? " | Bot Owner Commands: " + formattedCommands(BOT_OWNER_COMMANDS, LIST_BULLET + CMD_PREFIX, true) : ''));
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
        var k;
        for(k = 0; k < BOT_OWNER_COMMANDS.length; k++) {
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
var about = function() {
    mppChatSend(PRE_ABOUT + ' ' + BOT_DESCRIPTION + ' ' + BOT_AUTHOR + ' ' + BOT_NAMESPACE);
}
var link = function() {
    mppChatSend(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
}
var feedback = function() {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
}
var didCast = function() {
    fishTimer = FISH_INTERVAL;
    casted = true;
    audioPlay(castedSound);
}
var didReel = function() {
    casted = false;
    audioPlay(reeledSound);
}
var didPick = function() {
    picked = true;
    audioPlay(pickedSound);
}
var didYeet = function(argsString) {
    tooMuchCarried = false; // this doesn't garentee that you're not carrying too much
    notYeeted = false;
    // get rid of the nonEdible we yeeted if we did yeet one
    var invNonEdiblesLength = invNonEdibles.length;
    var toYeet = (exists(argsString) && argsString != "") ? argsString.toLowerCase() : null;
    if (invNonEdiblesLength > 0) {
        var haveYeet = false;
        var n = 0;
        while (!haveYeet && n < invNonEdiblesLength) {
            var checkNonEdible = invNonEdibles[n].toLowerCase();
            if (checkNonEdible.includes(toYeet)) {
                haveYeet = true;
                invNonEdibles.splice(n,1);
            }
            n++;
        }
    }
}
var didSack = function() {
    invSack = false;
    checkingSack = true;
}
var didEat = function() {
    tooMuchCarried = false; // this doesn't garentee that you're not carrying too much
}
var didLook = function() {
    seen = true;
}
var colors = function() {
    mppChatSend(PRE_COLORS + " You can find all possible colors at: " + USER_COLORS_URL);
}
var kekTake = function() {
    // toggles auto taking of kek on/off
    kekTakeOption = !kekTakeOption;
    mppChatSend(PRE_KEK_TAKE + " Kek auto taking is " + (kekTakeOption ? "on" : "off"));
}
var kekEat = function() {
    // toggles auto eating of kek on/off
    kekEatOption = !kekEatOption;
    mppChatSend(PRE_KEK_EAT + " Kek auto eating is " + (kekEatOption ? "on" : "off"));
}
var audioToggler = function() {
    // toggles audio on/off
    audioEnabled = !audioEnabled;
    mppChatSend(PRE_AUDIO + " Audio is " + (audioEnabled ? "on" : "off"));
}

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    if (!active) return;
    // if user switches to VPN, these need to update
    var yourParticipant = MPP.client.getOwnParticipant();
    var yourId = yourParticipant._id;
    var yourUsername = yourParticipant.name;
    // get the message as string
    var input = msg.a.trim();
    var participant = msg.p;
    var userId = participant._id;
    if (input.indexOf(CMD_PREFIX) == 0) {
        var message = input.substring(CMD_PREFIX.length).trim();
        var hasArgs = message.indexOf(' ');
        var command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        var argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1).trim() : null;
        // look through commands
        switch(command.toLowerCase()) {
            case "help": case "h": help(argumentsString, userId, yourId); break;
            case "about": case "ab": about(); break;
            case "link": case "li": link(); break;
            case "feedback": case "fb": feedback(); break;
            case "colors": case "cs": colors(); break;
            case "kektake": case "kt": if (userId == yourId) kekTake(); break;
            case "kekeat": case "ke": if (userId == yourId) kekEat(); break;
            case "audio": case "au": if (userId == yourId) audioToggler(); break;
            // check `fishing` commands
            case CMD_CAST[0]: case CMD_CAST[1]: if (userId == yourId) didCast(); break;
            case CMD_REEL: if (userId == yourId) didReel(); break;
            case CMD_PICK: if (userId == yourId) didPick(); break;
            case CMD_YEET: if (userId == yourId) didYeet(argumentsString); break;
            case CMD_SACK[0]: case CMD_SACK[1]: if (userId == yourId) didSack(); break;
            case CMD_EAT: if (userId == yourId) didEat(); break;
            case CMD_LOOK: if (userId == yourId) didLook(); break;
        }
    } // check for `fishing` response
    else if (userId == FISHING_BOT_ID) {
        // if the `fishing` sent something
        if (input.includes(yourUsername + ' ' + CAUGHT)) {
            casted = false;
            var i;
            for(i = 0; i < NON_EDIBLES.length; i++) {
                if (input.includes(NON_EDIBLES[i])) invNonEdibles.push(NON_EDIBLES[i]);
            }
            audioPlay(caughtSound);
        } else if (input.includes(yourUsername + ' ' + BITTEN)) {
            losing = true;
            audioPlay(bittenSound);
        } else if (losing && input == LOST) {
            casted = false;
            losing = false;
            audioPlay(lostSound);
        } else if (input.includes(yourUsername + ' ' + ATE)) {
            if (input.includes(' ' + FRUIT)) {
                gotFruit = false;
                invSack = true;
                if (input.includes(' ' + BOOST)) audioPlay(boostSound);
            } else if (input.includes(' ' + COLORED) && !input.includes(' ' + NOT_REALLY)) audioPlay(coloredSound);
        } else if (input.includes(yourUsername + ' ' + FRUIT_PICK)) {
            gotFruit = true;
            audioPlay(gotFruitSound);
        } else if (input.includes(' ' + FRUIT_FALL)) {
            fruitFell = true;
            audioPlay(fruitFellSound);
        } else if (!tooMuchCarried && input.indexOf(SAW_ITEMS) == 0) {
            // pick up any fruit if any is on the ground
            if (input.includes(FRUIT)) fruitFell = true;
            // pick up noneditables if we need them to throw at tree
            if (invNonEdibles.length < 1) {
                var inputLC = input.toLowerCase();
                // check if a nonedible is found
                var j;
                for(j = 0; j < NON_EDIBLES.length; j++) {
                    var currentNonEdible = NON_EDIBLES[j].toLowerCase();
                    if (takeNonEdible == "" && inputLC.includes(currentNonEdible)) {
                        takeNonEdible = currentNonEdible;
                    }
                }
            }
        } else if (input.includes(yourUsername + ' ' + TOOK)) {
            // check if we took a nonedible
            if (input.includes(FRUIT)) {
                fruitFell = false;
                gotFruit = true;
                audioPlay(gotFruitSound);
            } else if (takeNonEdible != "" && input.includes(takeNonEdible)) {
                var taken = takeNonEdible;
                takeNonEdible = "";
                invNonEdibles.push(taken);
            }
        } else if (input.indexOf(sackContents(yourUsername)) == 0) {
            if (input.includes(FRUIT)) gotFruit = true;
            // put all nonEdibles into inventory
            if (checkingSack) {
                checkingSack = false;
                var k;
                for(k = 0; k < NON_EDIBLES.length; k++) {
                    var theNonEdible = NON_EDIBLES[k];
                    var finding = INV_BULLET + theNonEdible + " x";
                    var found = input.toLowerCase().indexOf(finding.toLowerCase()) + finding.length;
                    var inputEnd = input.length - 1;
                    if (found != -1) {
                        // get how many there is
                        var foundEnd = found + 1;
                        // find last digit
                        var checkingDigit = true;
                        while (foundEnd < inputEnd && checkingDigit) {
                            var character = input.substring(foundEnd, foundEnd + 1);
                            if (character >= '0' && character <= '9') {
                                foundEnd++;
                            } checkingDigit = false;
                        }
                        var amount = parseInt(input.substring(found, foundEnd));
                        // now add that amount to the inventory
                        var m;
                        for(m = 0; m < amount; m++) {
                            invNonEdibles.push(theNonEdible);
                            notYeeted = true;
                        }
                    }
                }
            }
        } else if (input == noTook(yourUsername, takeNonEdible.toLowerCase())) takeNonEdible = "";
        else if (input == noTook(yourUsername, FRUIT)) fruitFell = false;
        else if (input == carryingTooMuch(yourUsername)) tooMuchCarried = true;
    }
});
MPP.client.on("ch", function(msg) {
    // update current room info
    currentRoom = MPP.client.channel._id;
    if (currentRoom == "test/fishing") active = true;
    else active = false;
});

// =============================================== INTERVALS

// constantly check if a command executes when run, and exectute if not already
var checkMessages = function() {
    if (active) {
        if (fishTimer > 0) fishTimer -= SECOND;
        else if (casted) {
            // things we should check after not catching anything for a while
            picked = false;
            invSack = true;
            reel();
        }
        if (!casted) cast();
        if (!picked) pick();
        if (invSack) sack();
        if (kekTakeOption && !tooMuchCarried && fruitFell) take(FRUIT);
        if (kekEatOption && gotFruit) eat(FRUIT);
        if (!tooMuchCarried && notYeeted && invNonEdibles.length > 0) {
            // yeet the nonEdible hopefully hitting the tree
            yeet(invNonEdibles[0]);
        }
        if (!tooMuchCarried && takeNonEdible != "") take(takeNonEdible);
        if (!seen) look();
    }
    setTimeout(checkMessages, SECOND);
}

// Automatically turns off the sound warning (loading the bot)
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);
        playButton.click();
        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id) && MPP.client.channel._id != "") {
                clearInterval(waitForMPP);
                console.log(PRE_MSG + "Online!");

                // start repeating checks
                checkMessages();
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);