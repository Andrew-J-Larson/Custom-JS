// ==UserScript==
// @name         Fishing Bot
// @namespace    https://thealiendrew.github.io/
// @version      1.4
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Multiplayer%20Piano/MPP-Fishing-Bot.user.js
// @description  Fishes for new colors!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
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
var timer = ONE_MINUTE;

MPP.client.on('a', function (msg) {
    if (!ready) return;
    // get the message as string
    var input = msg.a.trim();
    var userId = msg.p._id;
    var selfId = MPP.client.user._id;
    // check commands not sent by self
    if (!fishing && !waiting) {
        MPP.chat.send("/fish");
        timer = ONE_MINUTE;
        waiting = true;
    }
    if (exists(input)) {
        if(userId != selfId) {
            var selfname = MPP.client.user.name;
            var prefixPhrase = "Our good friend " + selfname;
            if (input.startsWith(prefixPhrase + " casts") || input.startsWith("Friend " + selfname + ": Your lure")) fishing = true;
            else if (input.startsWith(prefixPhrase + " caught")) {
                waiting = false;
                fishing = false;
            }
        } else if (input == "/fishingbot") MPP.chat.send("https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Multiplayer%20Piano/MPP-Fishing-Bot.user.js");
    }
});

// Check to make sure variable is initialized with something
var exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
}

// Automatically turns off the sound warning (loading the bot)
var clearSoundWarning = setInterval(function() {
    var playButton = document.querySelector("#sound-warning button");
    if (exists(playButton)) {
        clearInterval(clearSoundWarning);
        playButton.click();
        // wait for the client to come online
        var waitForMPP = setInterval(function() {
            if (exists(MPP) && exists(MPP.client) && exists(MPP.client.channel) && exists(MPP.client.channel._id)) {
                clearInterval(waitForMPP);
                ready = true;

                // makes sure to wait before fishing again (prevents multiple fish commands)
                setInterval(function() {
                    if (waiting) {
                        if (timer > 0) timer -= ONE_SECOND;
                        else waiting = false;
                    }
                }, ONE_SECOND);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
