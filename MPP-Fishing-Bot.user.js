// ==UserScript==
// @name         Fishing Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.1.4
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

const ONE_MINUTE = 60000; // milliseconds
const ONE_SECOND = 1000; // milliseconds
const TENTH_OF_SECOND = 100; // milliseconds
var ready = false;
var waiting = false;
var fishing = false;
var fishTimer = ONE_MINUTE;

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Main
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
            if (!fishing && !waiting) {
                MPP.chat.send("/fish");
                fishTimer = ONE_MINUTE;
                waiting = true;
            }
            var selfname = MPP.client.user.name;
            if (username == "fishing") {
            if (input.startsWith(input.includes(selfname + " casts")) || input.includes(selfname + ": Your lure")) fishing = true;
                else if (input.includes(selfname + " caught")) {
                    waiting = false;
                    fishing = false;
                }
            }
        } else if (input == "/reel") MPP.chat.send("/pick");
        if (input == "/help") MPP.chat.send("https://github.com/TheAlienDrew/Tampermonkey-Scripts/blob/master/Multiplayer%20Piano/MPP-Fishing-Bot.user.js");
    }
});

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
                }, ONE_MINUTE);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
