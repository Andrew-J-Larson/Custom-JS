// ==UserScript==
// @name         Fishing Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.5.9
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
const PICK_INTERVAL = FIVE_MINUTES;
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_LINK = PRE_MSG + "[Link]";
const PRE_AUDIO = PRE_MSG + "[Audio]";
// `fishing` bot specific strings
const CMD_PREFIX = '/';
const CMD_HELP = "help";
const CMD_LINK = "link";
const CMD_CAST = ["cast", "fish"];
const CMD_REEL = "reel";
//const CMD_SACK = ["sack", "caught", "count_fish"];
const CMD_EAT = "eat";
//const CMD_GIVE = ["give", "bestow"];
const CMD_PICK = "pick";
// const CMD_TREE = "tree";
// const CMD_COLOR = "color";
const CMD_TREE = "tree";
const CMD_BOT_AUDIO_TOGGLER = "audio";
const CMD_BOT_FEEDBACK = "feedback";
const HELP_DESC = "The only command is " + CMD_PREFIX + "audio - toggles the audio on/off";
const CAUGHT = "caught";
const ATE = "ate";
const COLORED = "made him/her turn";
const NOT_REALLY = "Upon looking in a mirror he/she finds it didn't actually do so, though.";
const BITTEN = "is getting a bite";
const LOST = "Some of the fish were lost in the disaster...";
const FRUITFUL = "picked";
const BOOST = "fishing boost.";
const FRUIT = "kekklefruit";

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
var fruitfulSound = newAudio("Coin");
var boostSound = newAudio("Powerup");
var coloredSound = newAudio("Item");

// =============================================== VARIABLES

var active = true; // turn off the bot if needed
var audioEnabled = true; // allows user to turn off sound
var currentRoom = null; // updates when it connects to a room
var fishTimer = 0; // changes while rod is cast
// The following variables are used in command execution detection
var casted = false;
var losing = false;
var picked = false;
var fruit = false;

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
var eat = function(item) {
    chatSend(CMD_PREFIX + CMD_EAT + ' ' + item);
}
var pick = function() {
    chatSend(CMD_PREFIX + CMD_PICK);
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
        else if (command == CMD_LINK) MPP.chat.send(PRE_LINK + ' ' + DOWNLOAD_URL);
        else if (userId == yourId) { // if you sent something
            // check `fishing` commands
            if (command == CMD_CAST[0] || command == CMD_CAST[1]) {
                fishTimer = FISH_INTERVAL;
                casted = true;
                audioPlay(castedSound);
            } else if (command == CMD_REEL) { //DECIDE TO KEEP!
                casted = false;
                audioPlay(reeledSound);
            } else if (command == CMD_PICK) {
                picked = true;
                audioPlay(pickedSound);
            }
            else if (command == CMD_BOT_AUDIO_TOGGLER) audioToggler();
            else if (command == CMD_BOT_FEEDBACK) MPP.chat.send(PRE_MSG + FEEDBACK_URL);
        }
    } // check for `fishing` bot response
    else if (userId == FISHING_BOT_ID) {
        // if the `fishing` bot sent something
        if (input.includes(yourUsername + ' ' + CAUGHT)) {
            casted = false;
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
                fruit = false;
                if (input.includes(' ' + BOOST)) audioPlay(boostSound);
            } else if (input.includes(' ' + COLORED) && !input.includes(' ' + NOT_REALLY)) audioPlay(coloredSound);
        } else if (input.includes(yourUsername + ' ' + FRUITFUL)) {
            fruit = true;
            audioPlay(fruitfulSound);
        }
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
        else if (casted) reel();
        if (!casted) cast();
        if (!picked) pick();
        if (fruit) eat(FRUIT);
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

                checkMessages();

                // make sure to wait before picking fruit again
                setInterval(function() {
                    if (active) picked = false;
                }, PICK_INTERVAL);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);