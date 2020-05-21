// ==UserScript==
// @name         Fishing Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.7.3
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Multiplayer%20Piano/MPP-Fishing-Bot/MPP-Fishing-Bot.user.js
// @description  Fishes for new colors!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @icon         https://icons.iconarchive.com/icons/fasticon/fish-toys/256/Green-Fish-icon.png
// @grant        GM_info
// @run-at       document-end
// @noframes
// ==/UserScript==

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
const MINUTE = 60 * SECOND;
const FIVE_MINUTES = 5 * MINUTE;

// URLs
const FEEDBACK_URL = "https://forms.gle/YJRWFTvh7sFZBuDCA";

// Bot custom constants
const FISHING_BOT_ID = "565887aa860ba601611b7615";
const FISH_INTERVAL = FIVE_MINUTES;
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_AUDIO = PRE_MSG + "[Audio]";
// `fishing` bot specific strings
const CMD_PREFIX = '/';
const CMD_HELP = "help";
const CMD_LINK = "link";
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
const CMD_BOT_AUDIO_TOGGLER = "audio";
const CMD_BOT_FEEDBACK = "feedback";
const HELP_DESC = "The only commands are: • " + CMD_PREFIX + "help - shows the commands • " + CMD_PREFIX + "link - get the download link for this bot • " + CMD_PREFIX + "audio - toggles the audio on/off";
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
const AUDIO_BASE_URL = "https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/Multiplayer%20Piano/MPP-Fishing-Bot/smb_audio/";
const AUDIO_EXENSION = "mp3";

// =============================================== OBJECT INITIALIZERS

// Create new audio objects prefixed with URL and postfixed with extension
var newAudio = function(name) {
    return new Audio(AUDIO_BASE_URL + name + '.' + AUDIO_EXENSION);
}

// =============================================== AUDIO

var castedSound = newAudio("Jump");
var reeledSound = newAudio("Skid");
var pickedSound = newAudio("Big Jump");
var caughtSound = newAudio("1up");
var bittenSound = newAudio("Thwomp");
var lostSound = newAudio("Die");
var gotFruitSound = newAudio("Coin");
var fruitFellSound = newAudio("Break");
var boostSound = newAudio("Powerup");
var coloredSound = newAudio("Item");

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

// =============================================== COMMANDS

// From MPP
var chatSend = function(message) {
    MPP.chat.send(message);
}

// For `fishing` bot
var cast = function() {
    chatSend(CMD_PREFIX + CMD_CAST[0]);
}
var reel = function() {
    chatSend(CMD_PREFIX + CMD_REEL);
}
var sack = function() {
    chatSend(CMD_PREFIX + CMD_SACK[0]);
}
var eat = function(item) {
    chatSend(CMD_PREFIX + CMD_EAT + ' ' + item);
}
var pick = function() {
    chatSend(CMD_PREFIX + CMD_PICK);
}
var take = function(item) {
    chatSend(CMD_PREFIX + CMD_TAKE + ' ' + item);
}
var yeet = function(item) {
    chatSend(CMD_PREFIX + CMD_YEET + ' ' + item.toLowerCase());
}
var look = function() {
    chatSend(CMD_PREFIX + CMD_LOOK);
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

// For this bot
var audioToggler = function() {
    // toggles audio on/off
    audioEnabled = !audioEnabled;
    console.log(PRE_MSG + "Audio is " + (audioEnabled ? "on" : "off"));
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
    var checkCommand = input.split()[0];
    var participant = msg.p;
    var userId = participant._id;
    if (checkCommand.indexOf(CMD_PREFIX) == 0) {
        var command = checkCommand.substring(CMD_PREFIX.length);
        // if anyone sent anything
        if (command == CMD_HELP) MPP.chat.send(PRE_HELP + ' ' + HELP_DESC);
        else if (command == CMD_LINK) MPP.chat.send(PRE_LINK + " You can download this bot from " + DOWNLOAD_URL);
        else if (userId == yourId) { // if you sent something
            // check `fishing` commands
            if (command == CMD_CAST[0] || command == CMD_CAST[1]) {
                fishTimer = FISH_INTERVAL;
                casted = true;
                audioPlay(castedSound);
            } else if (command == CMD_REEL) {
                casted = false;
                audioPlay(reeledSound);
            } else if (command == CMD_PICK) {
                picked = true;
                audioPlay(pickedSound);
            } else if (command.indexOf(CMD_YEET) == 0) {
                tooMuchCarried = false; // this doesn't garentee that you're not carrying too much
                notYeeted = false;
                // get rid of the nonEdible we yeeted if we did yeet one
                var invNonEdiblesLength = invNonEdibles.length;
                var toYeet = command.length > CMD_YEET.length ? command.substring(CMD_YEET.length + 1).trim().toLowerCase() : null;
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
            } else if (command == CMD_SACK[0] || command == CMD_SACK[1]) {
                invSack = false;
                checkingSack = true;
            } else if (command.indexOf(CMD_EAT) == 0) tooMuchCarried = false; // this doesn't garentee that you're not carrying too much
            else if (command == CMD_LOOK) seen = true;
            // other commands not by the `fishing` bot
            else if (command == CMD_BOT_AUDIO_TOGGLER) audioToggler();
            else if (command == CMD_BOT_FEEDBACK) MPP.chat.send(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
        }
    } // check for `fishing` bot response
    else if (userId == FISHING_BOT_ID) {
        // if the `fishing` bot sent something
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
        if (fruitFell) take(FRUIT);
        if (gotFruit) eat(FRUIT);
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