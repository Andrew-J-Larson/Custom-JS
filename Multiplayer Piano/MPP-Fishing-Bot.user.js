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
