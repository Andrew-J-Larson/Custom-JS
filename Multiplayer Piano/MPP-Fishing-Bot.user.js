// ==UserScript==
// @name         Fishing Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.1.6
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Multiplayer%20Piano/MPP-Fishing-Bot.user.js
// @description  Fishes for new colors!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com/test%2Ffishing$/
// @icon         https://icons.iconarchive.com/icons/fasticon/fish-toys/256/Green-Fish-icon.png
// @grant        GM_info
// @run-at       document-end
// @noframes
// ==/UserScript==

/* globals MPP */

// =============================================== CONSTANTS

// Script constants
const NAME = SCRIPT.name;
const VERSION = SCRIPT.version;

const TENTH_OF_SECOND = 100; // milliseconds
const ONE_SECOND = 1000; // milliseconds
const ONE_MINUTE = 60 * ONE_SECOND; // milliseconds
const FIVE_MINUTES = 5 * ONE_MINUTE; // milliseconds

const PRE_MSG = NAME + " (v" + VERSION + "): ";

// =============================================== VARIABLES

var ready = false;
var waiting = false;
var fishing = false;
var fishTimer = FIVE_MINUTES;

// =============================================== FUNCTIONS

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Sets variables for fishing while executing command
var goFish = function() {
    if (!fishing && !waiting) {
        MPP.chat.send("/fish");
        fishTimer = FIVE_MINUTES;
        waiting = true;
    }
}

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    if (!ready) return;
    // get the message as string
    var input = msg.a.trim();
    var username = msg.p.name;
    var userId = msg.p._id;
    var selfId = MPP.client.user._id;
    // sometimes it's null
    if (exists(input)) {
        // check commands not sent by self
        if(userId != selfId) {
            goFish();
            var selfname = MPP.client.user.name;
            if (username == "fishing") {
            if (input.startsWith(input.includes(selfname + " casts")) || input.includes(selfname + ": Your lure")) fishing = true;
                else if (input.includes(selfname + " caught")) {
                    waiting = false;
                    fishing = false;
                }
            }
        } else if (input == "/reel") MPP.chat.send("/fish");
        if (input == "/help") MPP.chat.send(PRE_MSG + "https://github.com/TheAlienDrew/Tampermonkey-Scripts/blob/master/Multiplayer%20Piano/MPP-Fishing-Bot.user.js");
    }
});

// =============================================== INTERVALS

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
                ready = true;

                // run commands at least once
                goFish();
                MPP.chat.send("/pick");

                // makes sure to wait before fishing again (prevents multiple commands)
                setInterval(function() {
                    if (waiting) {
                        if (fishTimer > 0) fishTimer -= ONE_SECOND;
                        else {
                            waiting = false;
                            fishing = false;
                        }
                    }
                }, ONE_SECOND);
                // make sure to wait before picking fruit again
                setInterval(function() {
                    MPP.chat.send("/pick");
                }, FIVE_MINUTES);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
