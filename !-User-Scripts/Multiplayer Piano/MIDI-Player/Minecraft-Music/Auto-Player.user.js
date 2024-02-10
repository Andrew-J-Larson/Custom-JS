// ==UserScript==
// @name         Multiplayer Piano - Minecraft Music Auto Player
// @namespace    https://andrew-j-larson.github.io/
// @version      3.9.992
// @description  Plays Minecraft music!
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        *://*.multiplayerpiano.org/*
// @match        *://*.multiplayerpiano.dev/*
// @match        *://*.multiplayerpiano.net/*
// @match        *://mpp*.hri7566.info/*
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
// @supportURL   https://github.com/Andrew-J-Larson/Custom-JS/tree/main/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/Minecraft-Music
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/Minecraft-Music/Auto-Player.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/Minecraft-Music/Auto-Player.user.js
// @icon         https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/!-User-Scripts/Multiplayer%20Piano/MIDI-Player/Minecraft-Music/favicon.png
// @grant        GM_info
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     LatestMIDIPlayerJS https://api.github.com/repos/grimmdude/MidiPlayerJS/releases/latest
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

// ============================================================================================================== TODO: NEED MODAL BOX FOR SONG SELECTION BEFORE ADDING BUTTONS
// ============================================================================================================== (with pages that show 10 songs at a time)
// ============================================================================================================== https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_modal

/* globals $, MPP, EventEmitter, mixin, MidiPlayer */

// =============================================== SCRIPT CONSTANTS

const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;
const SUPPORT_URL = SCRIPT.supportURL;
const UPDATE_URL = SCRIPT.updateURL;

// =============================================== VERSION CHECK

// midiplayer.js via https://github.com/grimmdude/MidiPlayerJS
// (but I should maybe switch to https://github.com/mudcube/MIDI.js OR https://github.com/Tonejs/Midi)
let stringLatestMIDIPlayerJS = GM_getResourceText("LatestMIDIPlayerJS");
if (!stringLatestMIDIPlayerJS) {
    throw new Error('[' + NAME + "] failed to find latest MidiPlayerJS release from " + GM_getResourceURL("LatestMIDIPlayerJS"));
}
let jsonLatestMIDIPlayerJS = JSON.parse(stringLatestMIDIPlayerJS);
let LatestMIDIPlayerJS_VERSION = jsonLatestMIDIPlayerJS.name;
let MIDIPlayerJS_URL = "https://raw.githubusercontent.com/grimmdude/MidiPlayerJS/" + LatestMIDIPlayerJS_VERSION + "/browser/midiplayer.js"
let requestMPJS = new XMLHttpRequest();
requestMPJS.open('GET', MIDIPlayerJS_URL, false);
requestMPJS.send(null);
if (requestMPJS.status === 200) {
    let type = requestMPJS.getResponseHeader('Content-Type');
    if (type.indexOf("text") !== 1) {
        let stringMIDIPlayerJS = requestMPJS.responseText;
        let scriptMIDIPlayerJS = document.createElement("script");
        scriptMIDIPlayerJS.type = 'text/javascript';
        scriptMIDIPlayerJS.appendChild(document.createTextNode(stringMIDIPlayerJS));
        (document.body || document.head || document.documentElement).appendChild(scriptMIDIPlayerJS);
    }
} else {
    throw new Error(GM_info.script + " failed to load MidiPlayerJS from " + MIDIPlayerJS_URL);
}
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
const REPEAT_DELAY = HALF_SECOND; // makes transitioning songs in repeat feel better
const SLOW_DELAY = HALF_SECOND; // keeps midi playing in background, preventing scrambled notes
const SONG_NAME_TIMEOUT = SECOND * 10; // if a file doesn't play, then forget about showing the song name it after this time
const NOTIFICATION_DURATION = SECOND * 15; // how long it takes for notifications to disappear

// URLs
const GITHUB_REPO = 'https://github.com/Andrew-J-Larson/Custom-JS/';
const GITHUB_ISSUE_TITLE = '[Feedback] ' + NAME + ' ' + VERSION;
const GITHUB_ISSUE_BODY = '<!-- Please write your feedback below this line. -->';
const FEEDBACK_URL = GITHUB_REPO + 'issues/new?title=' + encodeURIComponent(GITHUB_ISSUE_TITLE) + '&body=' + encodeURIComponent(GITHUB_ISSUE_BODY);

// Players listed by IDs (these are the _id strings)
const BANNED_PLAYERS = []; // empty for now
const LIMITED_PLAYERS = []; // empty for now

// Mod constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)
const INNER_ROOM_COLOR = 0; // used in room color settings (DON'T CHANGE)
const OUTER_ROOM_COLOR = 1; // used in room color settings (DON'T CHANGE)
const PERCUSSION_CHANNELS = [10/*, 11*/]; // (DON'T CHANGE) TODO: figure out how General MIDI Level 2 works with channel 11

// Mod constant settings
const MOD_ROOM_COLORS = ["#44673B", "#18110b"]; // these are the colors the mod will set the room to by default
const MOD_SOLO_PLAY = true; // sets what play mode when the mod boots up on an owned room

// Mod custom constants
const PREFIX = "mc!";
const PREFIX_LENGTH = PREFIX.length;
const ART_CHOICES = "cow, pig, carved pumpkin, villager, iron golem, enderman, spider, creeper, ghast, skeleton, slime, zombie, wither, grass, cobblestone, or tnt";
const ADDITIONAL_FEEDBACK_INFO = ", including links to other Minecraft songs as MIDIs or sheet music"; // must keep the comma
const MOD_KEYWORD = "MINECRAFT"; // this is used for auto enabling the public commands in a room that contains the keyword (character case doesn't matter)
const MOD_DISPLAYNAME = "Minecraft Music Auto Player";
const MOD_USERNAME = MOD_DISPLAYNAME + " (`" + PREFIX + "help`)";
const MOD_NAMESPACE = '( ' + NAMESPACE + ' )';
const MOD_DESCRIPTION = "[v" + VERSION + "] " + DESCRIPTION + " Made by a nerd in javascript. Special thanks to grimmdude for https://github.com/grimmdude/MidiPlayerJS " + ((MidiPlayer && MidiPlayer.Constants && MidiPlayer.Constants.VERSION) ? ('(v' + MidiPlayer.Constants.VERSION + ') ') : '') + "library."
const MOD_MUSIC_CREDIT_URL = "https://c418.bandcamp.com/album/minecraft-volume-alpha";
const MOD_MUSIC_CREDIT = "Music is by C418 from his Minecraft Volume Alpha album: ";
const MOD_MIDI_CREDIT_URL = "https://www.google.com/books/edition/_/ywHUngEACAAJ";
const MOD_MIDI_CREDIT = "All songs here are from MIDIs I professionally transcribed from the official sheet music book: ";
const MOD_AUTHOR = "Created by " + AUTHOR + '.';
const BASE_COMMANDS = [
    ["help [command]", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this mod"],
    ["link", "get the download link for this mod"],
    ["feedback", "shows link to send feedback about the mod to the developer"],
    ["ping", "gets the milliseconds response time"]
];
const MOD_COMMANDS = [
    ["play (song)", "plays a specific song by name or number, no entry plays a random song"],
    ["skip", "skips the current song (if autoplay is on)"],
    ["stop", "stops all music from playing (this stops autoplay too)"],
    ["pause", "pauses the music at that moment in the song"],
    ["resume", "plays music right where pause left off"],
    ["song", "shows the current song playing and at what moment in time"],
    ["repeat", "toggles repeating current song on or off"],
    ["sustain", "toggles how sustain is controlled via either MIDI or by MPP"],
    ["percussion", "toggles the percussion instruments on or off (off by default since it makes most MIDIs sound bad)"],
    ["autoplay (choice)", "your choices are off, random, or ordered, no entry shows current setting"],
    ["album", "shows the list of available songs"],
    ["art (choice)", "displays ascii art, no choice shows the choices"]
];
const MOD_OWNER_COMMANDS = [
    ["public", "toggles the public mod commands on or off"]
];
const PRE_MSG = MOD_USERNAME;
const PRE_HELP = PRE_MSG + " [Help]";
const PRE_ABOUT = PRE_MSG + " [About]";
const PRE_LINK = PRE_MSG + " [Link]";
const PRE_FEEDBACK = PRE_MSG + " [Feedback]";
const PRE_PING = PRE_MSG + " Pong!";
const PRE_SKIP = PRE_MSG + " [Skip]";
const PRE_SETTINGS = PRE_MSG + " [Settings]";
const PRE_ALBUM = PRE_MSG + " [Album]";
const PRE_ART = PRE_MSG + " [Art]";
const PRE_LIMITED = PRE_MSG + " Limited!";
const PRE_ERROR = PRE_MSG + " Error!";
const BAR_LEFT = '「';
const BAR_RIGHT = '」';
const BAR_BLOCK_FILL = '▩';
const BAR_BLOCK_EMPTY = '▢';
const BAR_ARROW_RIGHT = '—➤';
const BAR_NOW_PLAYING = BAR_LEFT + "   Now playing   " + BAR_RIGHT;
const BAR_PLAYING = BAR_LEFT + "     Playing     " + BAR_RIGHT;
const BAR_DONE_PLAYING = BAR_LEFT + "  Done playing   " + BAR_RIGHT;
const BAR_PAUSED = BAR_LEFT + "     Paused      " + BAR_RIGHT;
const BAR_STILL_PAUSED = BAR_LEFT + "  Still paused   " + BAR_RIGHT;
const BAR_RESUMED = BAR_LEFT + "     Resumed     " + BAR_RIGHT;
const BAR_STILL_RESUMED = BAR_LEFT + "  Still resumed  " + BAR_RIGHT;
const BAR_STOPPED = BAR_LEFT + "     Stopped     " + BAR_RIGHT;
const NOT_OWNER = "The mod isn't the owner of the room";
const NO_SONG = "Not currently playing anything";
const PROGRESS_BAR_BLOCK_SIZE = 26;
const AUTOPLAY_OFF = 0;
const AUTOPLAY_RANDOM = 1;
const AUTOPLAY_ORDERED = 2;
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";
const CONSOLE_IMPORTANT_STYLE = "background-color: red; color: white; font-weight: bold";

// Element constants
//const PRE_ELEMENT_ID = ([AUTHOR, MOD_DISPLAYNAME].join(' ')).toLowerCase().replace(/[^a-z0-9 ]/gi, '').replaceAll(' ','-') + '-mod';
//const TOGGLER_ELEMENT_ID = PRE_ELEMENT_ID + "-toggler";
//const QUERY_BOTTOM_UGLY_BTNS = `#bottom > div > .ugly-button:not([id^=${PRE_ELEMENT_ID}])`;

// Songs: names, and MIDIs as base64 URIs
const SONG_NAMES = ["01: Key - C418",
    "02: Door - C418",
    "03: Subwoofer Lullaby - C418",
    "04: Death - C418",
    "05: Living Mice - C418",
    "06: Moog City - C418",
    "07: Haggstrom - C418",
    "08: Minecraft - C418",
    "", // 09: Oxygene - C418 (NOT INCLUDED)
    "10: Equinoxe - C418",
    "11: Mice on Venus - C418",
    "12: Dry Hands - C418",
    "13: Wet Hands - C418",
    "14: Clark - C418",
    "15: Chris - C418",
    "", // 16: Thirteen - C418 (NOT INCLUDED)
    "17: Excuse - C418",
    "18: Sweden - C418",
    "", // 19: Cat - C418 (NOT INCLUDED)
    "", // 20: Dog - C418 (NOT INCLUDED)
    "21: Danny - C418",
    "22: Beginning - C418",
    "23: Droopy Likes Ricochet - C418",
    "" // 24: Droopy Likes Your Face - C418 (NOT INCLUDED)
];
const SONG_MIDIS = ["", // 01: Key - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 02: Door - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 03: Subwoofer Lullaby - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 04: Death - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 05: Living Mice - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 06: Moog City - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 07: Haggstrom - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 08: Minecraft - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 09: Oxygene - C418 (NOT INCLUDED)
    "", // 10: Equinoxe - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 11: Mice on Venus - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 12: Dry Hands - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 13: Wet Hands - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 14: Clark - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 15: Chris - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 16: Thirteen - C418 (NOT INCLUDED)
    "", // 17: Excuse - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 18: Sweden - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 19: Cat - C418 (NOT INCLUDED)
    "", // 20: Dog - C418 (NOT INCLUDED)
    "", // 21: Danny - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 22: Beginning - C418 (DATAURI REMOVED FOR GITHUB)
    "", // 23: Droopy Likes Ricochet - C418 (DATAURI REMOVED FOR GITHUB)
    "" // 24: Droopy Likes Your Face - C418 (NOT INCLUDED)
];
const SONG_LENGTH = SONG_MIDIS.length;

// Art
const cowArt = ["░░░░░░▓▓▓▓▓▓▓▓░░",
    "░░░░░░▓▓▓▓▓▓░░░░",
    "▓▓▓▓░░▓▓▓▓░░▓▓▓▓",
    "▏▕██░░▓▓░░░░██▏▕",
    "░░░░░░░░░░░░░░░░",
    "░░░░▓▓▓▓▓▓▓▓░░░░",
    "░░▓▓▏▕▒▒▒▒▏▕▓▓░░",
    "░░▓▓▒▒░░░░▒▒▓▓░░"];
const pigArt = ["▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▏▕██▒▒▒▒▒▒▒▒██▏▕",
    "▒▒▒▒▓▓▓▓▓▓▓▓▒▒▒▒",
    "▒▒▒▒░░▒▒▒▒░░▒▒▒▒",
    "▒▒▒▒▓▓▓▓▓▓▓▓▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒"];
const carvedPumpkinArt = ["▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒▒▒▓▓▓▓▓▓▒▒▒▒▓▓▒▒",
    "██████▒▒▓▓████▓▓▒▒████▓▓▒▒████▒▒",
    "▓▓████▒▒▔▔▔▔▓▓██▒▒▓▓▔▔██▒▒▓▓██▒▒",
    "▒▒████▒▒▏▕▔▔▏▕██▒▒▔▔▔▔▔▔▓▓▒▒██▓▓",
    "▒▒████▏▕▔▔▔▔▔▔██▒▒▏▕▔▔▔▔▏▕▒▒██▓▓",
    "▒▒████▏▕▔▔▔▔▔▔██▒▒▏▕▔▔▔▔▔▔▒▒████",
    "▒▒████▏▕▔▔▔▔▔▔▓▓▒▒▏▕▔▔▔▔▔▔▔▔████",
    "▒▒██████▔▔▔▔██▓▓▒▒██▔▔▔▔▔▔▔▔████",
    "▒▒██████████▓▓██▓▓██████████████",
    "▒▒████▔▔▒▒▔▔▓▓██▔▔▓▓▓▓▔▔▒▒▔▔████",
    "▒▒██▔▔▁▁▁▁▁▁▏▕▁▁▁▁▏▕▁▁▁▁▏▕▁▁████",
    "▒▒██▏▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
    "▒▒▓▓██▏▕▁▁██▁▁▁▁▓▓▁▁▁▁▁▁▓▓▁▁▁▁▓▓",
    "▒▒▓▓██▁▁████▁▁██▒▒████▁▁░░████▒▒",
    "░░▒▒▓▓░░▓▓▓▓▒▒▒▒▒▒▓▓▒▒▒▒░░▒▒▓▓░░",
    "░░▒▒▒▒░░▒▒▓▓▒▒▒▒░░▒▒▒▒░░░░▒▒▒▒░░"];
const villagerArt = ["▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▔▔▔▔▔▔▔▔▔▔▔▔▓▓",
    "▓▓██░░▓▓▓▓░░██▓▓",
    "░░▓▓▓▓░░░░▓▓▓▓░░",
    "░░▓▓▒▒░░░░▒▒▓▓░░",
    "░░▓▓▓▓░░░░▓▓▓▓░░",
    "▔▔▔▔▔▔░░░░▔▔▔▔▔▔"];
const ironGolemArt = ["████████████████",
    "████████████████",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "██▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "██▔▔▔▔██▓▓▔▔▔▔██",
    "██░░▏▕████▏▕░░██",
    "██▒▒▒▒▓▓▓▓▒▒▒▒██",
    "██████▓▓▓▓▓▓▓▓██",
    "██████▓▓▒▒██████",
    "▔▔▔▔▔▔▒▒▒▒▔▔▔▔▔▔"];
const endermanArt = ["░░▒▒░░░░░░░░▒▒░░",
    "░░▒▒▒▒░░░░▒▒▒▒░░",
    "▒▒░░▒▒▒▒▒▒▒▒░░▒▒",
    "░░░░▒▒▒▒▒▒▒▒░░░░",
    "██▓▓██▒▒▒▒██▓▓██",
    "▒▒░░░░▒▒▒▒░░░░▒▒",
    "░░▒▒▒▒░░░░▒▒▒▒░░",
    "░░░░░░░░░░░░░░░░"];
const spiderArt = ["░░░░▒▒▒▒▒▒▒▒▔▔░░",
    "▒▒▒▒▏▕▒▒▒▒░░▒▒▒▒",
    "░░▒▒▒▒▒▒▒▒▒▒▒▒██",
    "▏▕▒▒██░░██░░▒▒░░",
    "▒▒▒▒░░▁▁▒▒▁▁▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▓▓▏▕▒▒▒▒▏▕▓▓▒▒",
    "▏▕▓▓▏▕▒▒▒▒▏▕▓▓▏▕"];
const creeperArt = ["▓▓▒▒▓▓▓▓██▓▓▓▓▒▒",
    "▒▒▓▓▓▓▓▓▒▒▓▓▓▓██",
    "▓▓░░░░▓▓▒▒░░░░██",
    "▓▓░░▏▕▓▓▓▓▏▕░░▓▓",
    "▓▓▓▓▓▓░░░░██▒▒▓▓",
    "▓▓▒▒░░▔▔▔▔░░▓▓██",
    "██▒▒▁▁▁▁▁▁▁▁▓▓▒▒",
    "▓▓▓▓░░▓▓▓▓░░▒▒▓▓"];
const ghastArt = ["██████████▓▓▓▓▓▓████▓▓▓▓▓▓██████",
    "██▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓██",
    "██▓▓▓▓░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▓▓▓▓██",
    "██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▓▓░░▁▁▁▁▁▁▒▒▓▓▓▓▒▒▁▁▁▁▁▁░░▓▓▓▓",
    "██▓▓▓▓▓▓░░░░██▓▓▓▓██░░░░▓▓▓▓▓▓██",
    "██▓▓▓▓▓▓░░▓▓██▓▓▓▓██▓▓░░▓▓▓▓▓▓▓▓",
    "██▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██",
    "░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░▓▓░░░░░░",
    "████▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓████",
    "░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░",
    "██▓▓▓▓▓▓▓▓▓▓▒▒▁▁▁▁▒▒▓▓▓▓▓▓▓▓▓▓██",
    "░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "██████████▓▓████████▓▓██████████"];
const skeletonArt = ["▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓",
    "▓▓████░░██████▓▓",
    "██████▓▓████████",
    "████████████████",
    "██▁▁▁▁████▁▁▁▁██",
    "▓▓▓▓██░░░░▓▓▓▓▓▓",
    "░░▁▁▁▁▁▁▁▁▁▁▁▁░░",
    "▓▓▓▓████████▓▓▓▓"];
const slimeArt = ["▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓",
    "▓▓░░░░▒▒▒▒░░░░▓▓",
    "▓▓░░▏▕▒▒▒▒▏▕░░▓▓",
    "▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓",
    "▓▓▒▒▒▒▒▒▏▕▒▒▒▒▓▓",
    "▓▓▒▒▒▒▒▒▒▒▒▒▒▒▓▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"];
const zombieArt = ["░░░░░░░░░░░░░░░░",
    "░░░░░░▒▒▒▒░░░░░░",
    "░░▒▒▒▒▒▒▒▒▒▒▒▒░░",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▁▁▁▁▒▒▒▒▁▁▁▁▒▒",
    "░░▒▒▒▒▔▔▔▔▒▒▒▒░░",
    "░░░░▏▕░░░░▏▕░░░░",
    "░░░░▁▁▁▁▁▁▁▁░░░░"];
const witherArt = ["░░░░░░▏▕▔▔▏▕░░░░",
    "░░░░░░░░▒▒▒▒░░░░",
    "░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▔▔▔▔▔▔▒▒▒▒▔▔▔▔▔▔",
    "▒▒████▒▒▒▒████▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▏▕",
    "▒▒▏▕████████▏▕▏▕",
    "▁▁▔▔▁▁▁▁▏▕▁▁▔▔▁▁"];
const grassArt = ["██▓▓▓▓▓▓██▓▓██▓▓▓▓▓▓██▓▓██▓▓▓▓▓▓",
    "██▓▓██▓▓██▏▕██▓▓██▓▓██▓▓██▓▓██▓▓",
    "▓▓▏▕██▓▓██▏▕▓▓▏▕████▓▓██▏▕▓▓▓▓▏▕",
    "▏▕▒▒▁▁▁▁▓▓▁▁▁▁▁▁▓▓▏▕▓▓▏▕░░▁▁▔▔░░",
    "▒▒░░▒▒▓▓▏▕▒▒░░░░▔▔▁▁▔▔▒▒░░▒▒▏▕░░",
    "░░▏▕▒▒▒▒░░▒▒▁▁▁▁▁▁░░░░▏▕░░░░░░▓▓",
    "▓▓░░░░░░▓▓░░░░▓▓▓▓░░▓▓▓▓░░▒▒░░▒▒",
    "░░░░▓▓▓▓▒▒▒▒░░░░▒▒▏▕▒▒▒▒░░░░▒▒▒▒",
    "▒▒░░░░▒▒░░▒▒░░▏▕░░▒▒▒▒░░░░░░▏▕░░",
    "░░▒▒▏▕░░░░▁▁▁▁░░░░░░░░░░▓▓▓▓░░▒▒",
    "░░▒▒░░▓▓▓▓░░▓▓▒▒▏▕▓▓▓▓▏▕▒▒▒▒▓▓░░",
    "▒▒░░░░▒▒▒▒▓▓░░▒▒▒▒▒▒▒▒░░▏▕▒▒░░▏▕",
    "░░▏▕▒▒░░▒▒▒▒▓▓░░░░░░░░░░░░░░▓▓▓▓",
    "░░▒▒░░░░░░░░▒▒▒▒░░▏▕▓▓▏▕░░▓▓▒▒▒▒",
    "▒▒░░▏▕▓▓░░▏▕░░▏▕▓▓▓▓░░▒▒░░░░▒▒▒▒",
    "▒▒░░▓▓▒▒▒▒░░▓▓░░▒▒▒▒░░░░▒▒▒▒░░▏▕"];
const cobblestoneArt = ["░░▔▔▓▓██▔▔▔▔▔▔▓▓██▓▓▒▒▔▔▒▒██▓▓▒▒",
    "▏▕▓▓██▒▒▒▒▏▕████▓▓▒▒▒▒▏▕▔▔▒▒░░▒▒",
    "▏▕▓▓▒▒▓▓░░▏▕▓▓▒▒▒▒▓▓░░▁▁▁▁▁▁▒▒░░",
    "▏▕▔▔▒▒░░▁▁▁▁▒▒░░▒▒░░▏▕▒▒▓▓▒▒▔▔▏▕",
    "▏▕░░▏▕▒▒██▓▓▏▕▒▒▔▔▔▔██▓▓▓▓▓▓▒▒▏▕",
    "██░░▓▓██▒▒▒▒░░▔▔▏▕▒▒▒▒██▓▓▒▒░░▒▒",
    "▓▓▒▒▏▕▒▒▓▓▒▒▒▒░░▁▁▁▁░░▓▓▒▒░░▏▕██",
    "▒▒▒▒░░░░▒▒▒▒░░▏▕▒▒██▓▓▏▕░░▒▒▏▕▒▒",
    "░░▏▕██▓▓░░░░▏▕▒▒██▒▒▒▒▒▒▔▔▔▔▁▁░░",
    "▏▕██▓▓▒▒░░▒▒░░░░▒▒▒▒▏▕░░▏▕▒▒▓▓▏▕",
    "▒▒░░▒▒░░▒▒▔▔▔▔▔▔▔▔░░░░▔▔▁▁▓▓▓▓██",
    "▒▒░░░░▁▁▁▁░░▒▒██▓▓▁▁▁▁▏▕▒▒████▒▒",
    "░░▒▒██▓▓░░▏▕██▓▓▒▒▓▓░░▏▕▒▒▒▒░░▒▒",
    "▏▕██▓▓▒▒▒▒▏▕▓▓▒▒░░▒▒▒▒░░▁▁▁▁▒▒░░",
    "▓▓▓▓▒▒░░▒▒░░▏▕░░▒▒▒▒░░▏▕▓▓▒▒▔▔▔▔",
    "▏▕▒▒▁▁▁▁░░▒▒░░▁▁░░▁▁▁▁▒▒██▓▓▒▒░░"];
const tntArt = ["▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒▓▓▓▓▓▓▒▒",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "████████████████████████████████",
    "████▔▔▔▔▔▔██▏▕████▏▕██▔▔▔▔▔▔████",
    "██████▏▕████▏▕▔▔██▏▕████▏▕██████",
    "██████▏▕████▏▕██▁▁▏▕████▏▕██████",
    "██████▏▕████▏▕████▏▕████▏▕██████",
    "████████████████████████████████",
    "▒▒▒▒░░░░▒▒▒▒░░░░▒▒▒▒░░░░▒▒▒▒░░░░",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░▓▓▓▓▒▒░░",
    "▒▒▒▒▒▒░░▒▒▒▒▒▒░░▒▒▒▒▒▒░░▒▒▒▒▒▒░░"];
const cowArtInverted = ["██████▓▓▓▓▓▓▓▓██",
    "██████▓▓▓▓▓▓████",
    "▓▓▓▓██▓▓▓▓██▓▓▓▓",
    "▏▕▒▒██▓▓████▒▒▏▕",
    "████████████████",
    "████▓▓▓▓▓▓▓▓████",
    "██▓▓▏▕░░░░▏▕▓▓██",
    "██▓▓░░████░░▓▓██"];
const pigArtInverted = ["░░░░░░░░░░░░░░░░",
    "░░░░░░░░░░░░░░░░",
    "░░░░░░░░░░░░░░░░",
    "▏▕▒▒░░░░░░░░▒▒▏▕",
    "░░░░▓▓▓▓▓▓▓▓░░░░",
    "░░░░██░░░░██░░░░",
    "░░░░▓▓▓▓▓▓▓▓░░░░",
    "░░░░░░░░░░░░░░░░"];
const carvedPumpkinArtInverted = ["▓▓▓▓▓▓░░▓▓▓▓▓▓░░░░▓▓▓▓▓▓░░░░▓▓░░",
    "▒▒▒▒▒▒░░▓▓▒▒▒▒▓▓░░▒▒▒▒▓▓░░▒▒▒▒░░",
    "▓▓▒▒▒▒░░▔▔▔▔▓▓▒▒░░▓▓▔▔▒▒░░▓▓▒▒░░",
    "░░▒▒▒▒░░▏▕▔▔▏▕▒▒░░▔▔▔▔▔▔▓▓░░▒▒▓▓",
    "░░▒▒▒▒▏▕▔▔▔▔▔▔▒▒░░▏▕▔▔▔▔▏▕░░▒▒▓▓",
    "░░▒▒▒▒▏▕▔▔▔▔▔▔▒▒░░▏▕▔▔▔▔▔▔░░▒▒▒▒",
    "░░▒▒▒▒▏▕▔▔▔▔▔▔▓▓░░▏▕▔▔▔▔▔▔▔▔▒▒▒▒",
    "░░▒▒▒▒▒▒▔▔▔▔▒▒▓▓░░▒▒▔▔▔▔▔▔▔▔▒▒▒▒",
    "░░▒▒▒▒▒▒▒▒▒▒▓▓▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "░░▒▒▒▒▔▔░░▔▔▓▓▒▒▔▔▓▓▓▓▔▔░░▔▔▒▒▒▒",
    "░░▒▒▔▔▁▁▁▁▁▁▏▕▁▁▁▁▏▕▁▁▁▁▏▕▁▁▒▒▒▒",
    "░░▒▒▏▕▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▒▒",
    "░░▓▓▒▒▏▕▁▁▒▒▁▁▁▁▓▓▁▁▁▁▁▁▓▓▁▁▁▁▓▓",
    "░░▓▓▒▒▁▁▒▒▒▒▁▁▒▒░░▒▒▒▒▁▁██▒▒▒▒░░",
    "██░░▓▓██▓▓▓▓░░░░░░▓▓░░░░██░░▓▓██",
    "██░░░░██░░▓▓░░░░██░░░░████░░░░██"];
const villagerArtInverted = ["░░░░░░░░░░░░░░░░",
    "░░░░░░░░░░░░░░░░",
    "░░░░░░░░░░░░░░░░",
    "░░░░░░░░░░░░░░░░",
    "░░░░░░░░░░░░░░░░",
    "░░▔▔▔▔▔▔▔▔▔▔▔▔░░",
    "░░▒▒▓▓░░░░▓▓▒▒░░",
    "▓▓░░░░▓▓▓▓░░░░▓▓",
    "▓▓░░██▓▓▓▓██░░▓▓",
    "▓▓░░░░▓▓▓▓░░░░▓▓",
    "▔▔▔▔▔▔▓▓▓▓▔▔▔▔▔▔"];
const ironGolemArtInverted = ["▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "████████████████",
    "▒▒▔▔▔▔▒▒▓▓▔▔▔▔▒▒",
    "▒▒░░▏▕▒▒▒▒▏▕░░▒▒",
    "▒▒████▓▓▓▓████▒▒",
    "▒▒▒▒▒▒▓▓▓▓▓▓▓▓▒▒",
    "▒▒▒▒▒▒▓▓██▒▒▒▒▒▒",
    "▔▔▔▔▔▔████▔▔▔▔▔▔"];
const endermanArtInverted = ["██░░████████░░██",
    "██░░░░████░░░░██",
    "░░██░░░░░░░░██░░",
    "████░░░░░░░░████",
    "▒▒▓▓▒▒░░░░▒▒▓▓▒▒",
    "░░████░░░░████░░",
    "██░░░░████░░░░██",
    "████████████████"];
const spiderArtInverted = ["████░░░░░░░░▔▔██",
    "░░░░▏▕░░░░██░░░░",
    "██░░░░░░░░░░░░▒▒",
    "▏▕░░▒▒██▒▒██░░██",
    "░░░░██▁▁░░▁▁░░░░",
    "░░░░░░░░░░░░░░░░",
    "░░▓▓▏▕░░░░▏▕▓▓░░",
    "▏▕▓▓▏▕░░░░▏▕▓▓▏▕"];
const creeperArtInverted = ["▓▓░░▓▓▓▓▒▒▓▓▓▓░░",
    "░░▓▓▓▓▓▓░░▓▓▓▓▒▒",
    "▓▓████▓▓░░████▒▒",
    "▓▓██▏▕▓▓▓▓▏▕██▓▓",
    "▓▓▓▓▓▓████▒▒░░▓▓",
    "▓▓░░██▔▔▔▔██▓▓▒▒",
    "▒▒░░▁▁▁▁▁▁▁▁▓▓░░",
    "▓▓▓▓██▓▓▓▓██░░▓▓"];
const ghastArtInverted = ["▓▓▓▓▓▓▓▓▓▓░░░░░░▓▓▓▓░░░░░░▓▓▓▓▓▓",
    "▓▓░░░░░░░░██░░░░░░░░██░░░░░░░░▓▓",
    "▓▓░░░░████░░░░░░░░░░░░████░░░░▓▓",
    "▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓▓",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
    "░░░░██▁▁▁▁▁▁▒▒░░░░▒▒▁▁▁▁▁▁██░░░░",
    "▓▓░░░░░░████▓▓░░░░▓▓████░░░░░░▓▓",
    "▓▓░░░░░░██░░▓▓░░░░▓▓░░██░░░░░░░░",
    "▓▓░░░░░░██░░░░░░░░░░░░░░░░░░░░▓▓",
    "██████░░░░░░░░░░░░░░░░██░░██████",
    "▓▓▓▓░░░░██░░░░░░░░░░░░░░░░░░▓▓▓▓",
    "████░░░░░░░░░░░░░░░░░░░░░░░░████",
    "▓▓░░░░░░░░░░▒▒▁▁▁▁▒▒░░░░░░░░░░▓▓",
    "██░░░░░░░░░░░░░░░░░░░░░░░░░░░░██",
    "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
    "▓▓▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓░░▓▓▓▓▓▓▓▓▓▓"];
const skeletonArtInverted = ["░░░░▓▓░░░░░░░░░░",
    "░░▒▒▒▒▓▓▒▒▒▒▒▒░░",
    "▒▒▒▒▒▒░░▒▒▒▒▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▁▁▁▁▒▒▒▒▁▁▁▁▒▒",
    "░░░░▒▒▓▓▓▓░░░░░░",
    "▓▓▁▁▁▁▁▁▁▁▁▁▁▁▓▓",
    "░░░░▒▒▒▒▒▒▒▒░░░░"];
const slimeArtInverted = ["▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓",
    "▓▓░░░░░░░░░░░░▓▓",
    "▓▓████░░░░████▓▓",
    "▓▓██▏▕░░░░▏▕██▓▓",
    "▓▓░░░░░░░░░░░░▓▓",
    "▓▓░░░░░░▏▕░░░░▓▓",
    "▓▓░░░░░░░░░░░░▓▓",
    "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"];
const zombieArtInverted = ["████████████████",
    "██████░░░░██████",
    "██░░░░░░░░░░░░██",
    "░░░░░░░░░░░░░░░░",
    "░░▁▁▁▁░░░░▁▁▁▁░░",
    "██░░░░▔▔▔▔░░░░██",
    "████▏▕████▏▕████",
    "████▁▁▁▁▁▁▁▁████"];
const witherArtInverted = ["██████▏▕▔▔▏▕████",
    "████████░░░░████",
    "██░░░░░░░░░░░░░░",
    "▔▔▔▔▔▔░░░░▔▔▔▔▔▔",
    "░░▒▒▒▒░░░░▒▒▒▒░░",
    "░░░░░░░░░░░░░░▏▕",
    "░░▏▕▒▒▒▒▒▒▒▒▏▕▏▕",
    "▁▁▔▔▁▁▁▁▏▕▁▁▔▔▁▁"];
const grassArtInverted = ["░░▒▒▒▒▒▒░░▒▒░░▒▒▒▒▒▒░░▒▒░░▒▒▒▒▒▒",
    "░░▒▒░░▒▒░░▏▕░░▒▒░░▒▒░░▒▒░░▒▒░░▒▒",
    "▒▒▏▕░░▒▒░░▏▕▒▒▏▕░░░░▒▒░░▏▕▒▒▒▒▏▕",
    "▏▕▓▓▁▁▁▁▒▒▁▁▁▁▁▁▒▒▏▕▒▒▏▕██▁▁▔▔██",
    "▓▓██▓▓▒▒▏▕▓▓████▔▔▁▁▔▔▓▓██▓▓▏▕██",
    "██▏▕▓▓▓▓██▓▓▁▁▁▁▁▁████▏▕██████▒▒",
    "▒▒██████▒▒████▒▒▒▒██▒▒▒▒██▓▓██▓▓",
    "████▒▒▒▒▓▓▓▓████▓▓▏▕▓▓▓▓████▓▓▓▓",
    "▓▓████▓▓██▓▓██▏▕██▓▓▓▓██████▏▕██",
    "██▓▓▏▕████▁▁▁▁██████████▒▒▒▒██▓▓",
    "██▓▓██▒▒▒▒██▒▒▓▓▏▕▒▒▒▒▏▕▓▓▓▓▒▒██",
    "▓▓████▓▓▓▓▒▒██▓▓▓▓▓▓▓▓██▏▕▓▓██▏▕",
    "██▏▕▓▓██▓▓▓▓▒▒██████████████▒▒▒▒",
    "██▓▓████████▓▓▓▓██▏▕▒▒▏▕██▒▒▓▓▓▓",
    "▓▓██▏▕▒▒██▏▕██▏▕▒▒▒▒██▓▓████▓▓▓▓",
    "▓▓██▒▒▓▓▓▓██▒▒██▓▓▓▓████▓▓▓▓██▏▕"];
const cobblestoneArtInverted = ["██▔▔▒▒░░▔▔▔▔▔▔▒▒░░▒▒▓▓▔▔▓▓░░▒▒▓▓",
    "▏▕▒▒░░▓▓▓▓▏▕░░░░▒▒▓▓▓▓▏▕▔▔▓▓██▓▓",
    "▏▕▒▒▓▓▒▒██▏▕▒▒▓▓▓▓▒▒██▁▁▁▁▁▁▓▓██",
    "▏▕▔▔▓▓██▁▁▁▁▓▓██▓▓██▏▕▓▓▒▒▓▓▔▔▏▕",
    "▏▕██▏▕▓▓░░▒▒▏▕▓▓▔▔▔▔░░▒▒▒▒▒▒▓▓▏▕",
    "░░██▒▒░░▓▓▓▓██▔▔▏▕▓▓▓▓░░▒▒▓▓██▓▓",
    "▒▒▓▓▏▕▓▓▒▒▓▓▓▓██▁▁▁▁██▒▒▓▓██▏▕░░",
    "▓▓▓▓████▓▓▓▓██▏▕▓▓░░▒▒▏▕██▓▓▏▕▓▓",
    "██▏▕░░▒▒████▏▕▓▓░░▓▓▓▓▓▓▔▔▔▔▁▁██",
    "▏▕░░▒▒▓▓██▓▓████▓▓▓▓▏▕██▏▕▓▓▒▒▏▕",
    "▓▓██▓▓██▓▓▔▔▔▔▔▔▔▔████▔▔▁▁▒▒▒▒░░",
    "▓▓████▁▁▁▁██▓▓░░▒▒▁▁▁▁▏▕▓▓░░░░▓▓",
    "██▓▓░░▒▒██▏▕░░▒▒▓▓▒▒██▏▕▓▓▓▓██▓▓",
    "▏▕░░▒▒▓▓▓▓▏▕▒▒▓▓██▓▓▓▓██▁▁▁▁▓▓██",
    "▒▒▒▒▓▓██▓▓██▏▕██▓▓▓▓██▏▕▒▒▓▓▔▔▔▔",
    "▏▕▓▓▁▁▁▁██▓▓██▁▁██▁▁▁▁▓▓░░▒▒▓▓██"];
const tntArtInverted = ["░░░░░░▓▓░░░░░░▓▓░░░░░░▓▓░░░░░░▓▓",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▒▒▒▒▔▔▔▔▔▔▒▒▏▕▒▒▒▒▏▕▒▒▔▔▔▔▔▔▒▒▒▒",
    "▒▒▒▒▒▒▏▕▒▒▒▒▏▕▔▔▒▒▏▕▒▒▒▒▏▕▒▒▒▒▒▒",
    "▒▒▒▒▒▒▏▕▒▒▒▒▏▕▒▒▁▁▏▕▒▒▒▒▏▕▒▒▒▒▒▒",
    "▒▒▒▒▒▒▏▕▒▒▒▒▏▕▒▒▒▒▏▕▒▒▒▒▏▕▒▒▒▒▒▒",
    "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒",
    "▓▓▓▓████▓▓▓▓████▓▓▓▓████▓▓▓▓████",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "░░░░▓▓██░░░░▓▓██░░░░▓▓██░░░░▓▓██",
    "▓▓▓▓▓▓██▓▓▓▓▓▓██▓▓▓▓▓▓██▓▓▓▓▓▓██"];

// =============================================== VARIABLES

let publicOption = false; // turn off the public mod commands if needed
let pinging = false; // helps aid in getting response time
let pingTime = 0; // changes after each ping
let currentRoom = null; // updates when it connects to room
let chatDelay = CHAT_DELAY; // for how long to wait until posting another message
let endDelay; // used in multiline chats send commands

let mppPianoNotes = null; // will eventually become an array of the available notes, once MPP loads
let mppNoteBank = null; // this will be an array of integers tracking note presses/releases to fix overlapping notes on the same key
let sustainState = { // needed for sustain tracking
    on: false,
    turnBackOn: false
};

let finishedSongName = null; // only checked when not on repeat, for end/done playing message
let ended = true;
let stopped = false;
let paused = false;
let currentSongProgress = -1; // gets updated while a song plays
let currentSongEventsPlayed = 0; // gets updated while a song plays
let currentSongTotalEvents = 0; // gets updated as soon as a song is loaded
let currentSongIndex = null;
let currentSongName = null; // extracted from the file name/end of URL
let previousSongIndex = null; // grabs current when changing successfully
let autoplayActive = false;
let autoplayOption = AUTOPLAY_OFF;
let repeatOption = false; // allows for repeat of one song
let sustainOption = true; // makes notes end according to the midi file
let percussionOption = false; // turning on percussion makes a lot of MIDIs sound bad
let artDisplaying = false;

let elapsingProgressNotification = null; // used for closing elapsing notification sooner

// =============================================== PAGE VISIBILITY

let pageVisible = true;
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        pageVisible = false;
    } else {
        pageVisible = true;
    }
});

// =============================================== OBJECTS

// The MIDIPlayer
const Player = new MidiPlayer.Player();

// =============================================== FUNCTIONS

// Get visual elapsing progress (e.g. numBlocks = size of loading bar, think of it like a loading screen bar)
let getElapsedProgressInt = function (numBlocks, intElapsed, intTotal) {
    return Math.round((intElapsed / intTotal) * numBlocks);
};
let getElapsingProgress = function (numBlocks, intElapsed, intTotal) {
    let elapsedProgress = getElapsedProgressInt(numBlocks, intElapsed, intTotal);
    let progressMade = "";
    for (let i = 0; i < elapsedProgress; i++) {
        progressMade += BAR_BLOCK_FILL;
    }
    for (let j = 0; j < (numBlocks - elapsedProgress); j++) {
        progressMade += BAR_BLOCK_EMPTY;
    }
    return progressMade;
};

// Check to make sure variable is initialized with something
let exists = function (element) {
    if (typeof (element) != "undefined" && element != null) return true;
    return false;
};

// Format time to HH:MM:SS from seconds
/* let secondsToHms = function(d) {
    d = Number(d);

    let h, m, s;
    let hDisplay = "00";
    let mDisplay = hDisplay;
    let sDisplay = hDisplay;

    if (d != null && d > 0) {
        h = Math.floor(d / 3600);
        m = Math.floor((d % 3600) / 60);
        s = Math.floor((d % 3600) % 60);

        hDisplay = (h < 10 ? "0" : "") + h;
        mDisplay = (m < 10 ? "0" : "") + m;
        sDisplay = (s < 10 ? "0" : "") + s;
    }

    return hDisplay + ':' + mDisplay + ':' + sDisplay;
}; */

// Takes formatted time and removed preceeding zeros (only before minutes)
/* let timeClearZeros = function(formattedHms) {
    let newTime = formattedHms;
    while (newTime.length > 5 && newTime.indexOf("00:") == 0) {
        newTime = newTime.substring(3);
    }
    return newTime;
}; */

// Resizes a formatted HH:MM:SS time to the second formatted time
/* let timeSizeFormat = function(timeCurrent, timeEnd) {
    let newTimeFormat = timeCurrent;
    let timeCurrentLength = timeCurrent.length;
    let timeEndLength = timeEnd.length;
    // lose or add 00's
    if (timeCurrentLength > timeEndLength) newTimeFormat = timeCurrent.substring(timeCurrentLength - timeEndLength);
    while (newTimeFormat.length < timeEndLength) {
        newTimeFormat = "00:" + newTimeFormat;
    }
    return newTimeFormat;
}; */

// Generate a random number
let randomNumber = function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Puts quotes around string
let quoteString = function (string) {
    let newString = string;
    if (exists(string) && string != "") newString = '"' + string + '"';
    return newString
};

// Check if the color is light or dark
let getContrast = function (hexcolor) {

    // If a leading # is provided, remove it
    if (hexcolor.slice(0, 1) === '#') {
        hexcolor = hexcolor.slice(1);
    }

    // If a three-character hexcode, make six-character
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(function (hex) {
            return hex + hex;
        }).join('');
    }

    // Convert to RGB value
    let r = parseInt(hexcolor.substr(0, 2), 16);
    let g = parseInt(hexcolor.substr(2, 2), 16);
    let b = parseInt(hexcolor.substr(4, 2), 16);

    // Get YIQ ratio
    let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Check contrast
    //return (yiq >= 128) ? 'black' : 'white';
    // tweaked for correct visibility on MPP
    return (yiq >= (255 / 9) * 5) ? 'black' : 'white';

};

// Makes all commands into one string
let formattedCommands = function (commandsArray, prefix, spacing) { // needs to be 2D array with commands before descriptions
    if (!exists(prefix)) prefix = '';
    let commands = '';
    for (let i = 0; i < commandsArray.length; ++i) {
        commands += (spacing ? ' `' : '`') + prefix + commandsArray[i][0] + '`' + (i < (commandsArray.length - 1) ? ',' : '');
    }
    return commands;
};

// Gets 1 command and info about it into a string
let formatCommandInfo = function (commandsArray, commandIndex) {
    return '`' + PREFIX + commandsArray[commandIndex][0] + '`' + DESCRIPTION_SEPARATOR + commandsArray[commandIndex][1];
};

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

// Sends art and tracks art being displayed
let mppArtSend = function (strArray, initialDelay) {
    artDisplaying = true;
    let newDelay = mppChatMultiSend(strArray, null, 0);
    setTimeout(function () { artDisplaying = false }, newDelay);
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

let playerStop = function (manualStop = false) {
    ended = true; // TODO: temporary, until a real play button is implemented
    paused = false;
    stopped = manualStop ? manualStop : stopped;
    if (!stopped) finishedSongName = currentSongName;
    if (!repeatOption) {
        currentSongIndex = null;
        currentSongName = null;
    }
    currentSongEventsPlayed = 0;
    currentSongProgress = -1;
    // don't forget to reset the note key bank
    for (let i = 0; i < mppNoteBank.length; i++) {
        mppNoteBank[i] = 0;
    }
};

let playerPlay = function (loop = false) {
    if (loop) {
        // Need to do something???
    }
    ended = stopped = paused = false;
};

let playerPause = function () {
    if (ended || stopped) {
        // Need to do something???
        return;
    }
    paused = true;
};

// Stops song in player, or at least stops all notes
let stopSong = function (fullStop) {
    if (fullStop) {
        if (elapsingProgressNotification) {
            elapsingProgressNotification.close();
            elapsingProgressNotification = null;
        }
        Player.stop();
        playerStop(true);
    }
    // need to first release sustain, if it's on
    if (sustainState.on) {
        MPP.releaseSustain();
        sustainState.on = false;
        if (fullStop) sustainState.turnBackOn = false;
        else sustainState.turnBackOn = true;
    }
    // need to release all keys that are playing at the moment
    Object.values(mppPianoNotes).forEach(note => {
        MPP.release(note);
    });
};

// Opens song in player
let openSong = function (songIndex) {
    if (!ended) stopSong(true); // MUST STAY HERE, or else can cause browser to crash
    try {
        Player.loadDataUri(SONG_MIDIS[songIndex]);
    } catch (error) {
        // reload the previous working file if there is one
        if (previousSongIndex != null) Player.loadDataUri(previousSongIndex);
        mppChatSend(PRE_ERROR + " (open) " + error);
        return false;
    }
    return true;
};

// Plays song in player
let playSong = function (songIndex) {
    if (openSong(songIndex)) {
        // play song
        Player.play();
        playerPlay();
        let timeoutRecorder = 0;
        let showSongName = setInterval(function () {
            if (Player.isPlaying()) {
                clearInterval(showSongName);

                // changes song
                previousSongIndex = currentSongIndex;
                currentSongIndex = songIndex;
                currentSongName = SONG_NAMES[songIndex];
                currentSongEventsPlayed = Player.eventsPlayed();
                currentSongTotalEvents = Player.getTotalEvents();

                mppChatSend(PRE_MSG + ' `' + BAR_NOW_PLAYING + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
            } else if (timeoutRecorder == SONG_NAME_TIMEOUT) {
                clearInterval(showSongName);
            } else timeoutRecorder++;
        }, 1);
    }
};

// Plays a random song, but not the same song twice in a row
let playRandom = function () {
    let newSongIndex = currentSongIndex;
    // ignore empty elements
    let findNewSong = setInterval(function () {
        if (newSongIndex != currentSongIndex && SONG_NAMES[newSongIndex]) {
            clearInterval(findNewSong);

            playSong(newSongIndex);
        } else {
            if (autoplayOption == AUTOPLAY_RANDOM || autoplayOption == AUTOPLAY_OFF) newSongIndex = randomNumber(0, SONG_LENGTH - 1);
            else if (autoplayOption == AUTOPLAY_ORDERED) {
                if (newSongIndex == null) newSongIndex = -1;
                newSongIndex++;
                if (newSongIndex == SONG_LENGTH) newSongIndex = 0;
            }
        }
    }, 1);
};

// Get the string/value to the autoplay option
let getAutoplayString = function (choice) {
    let typeString;
    switch (choice) {
        case AUTOPLAY_OFF: typeString = "off"; break;
        case AUTOPLAY_RANDOM: typeString = "random"; break;
        case AUTOPLAY_ORDERED: typeString = "ordered"; break;
        default: typeString = "unknown"; break; // shouldn't ever get here
    }
    return typeString;
};
let getAutoplayValue = function (choice) {
    let valid = null;
    switch (choice.toLowerCase()) {
        case "false": case "off": case "no": case "0": valid = 0; break;
        case "random": case "1": valid = 1; break;
        case "ordered": case "2": valid = 2; break;
        default: valid = -1; break;
    }
    return valid;
};

// Turns autoplay onto certain modes
let toggleAutoplay = function (choice) {
    // need to set different intervals for different types
    if (choice == AUTOPLAY_RANDOM || choice == AUTOPLAY_ORDERED) autoplayActive = true;
    else autoplayActive = false;
    autoplayOption = choice;
};

// Makes the mod the only one to play or turns it off
let setOwnerOnlyPlay = function (choice) {
    let isOwner = MPP.client.isOwner();
    if (isOwner && exists(choice) && (choice == true || choice == false)) {
        let set = { crownsolo: choice };
        MPP.client.sendArray([{ m: "chset", set: set }]);
        console.log("Solo play set to: " + choice.toString());
        return true;
    } else {
        if (!isOwner) console.log(NOT_OWNER);
        else console.log("Invalid choice was entered. Solo play wasn't set.");
        return false;
    }
};

// Shows limited message for user
let playerLimited = function (username) {
    // displays message with their name about being limited
    mppChatSend(PRE_LIMITED + " You must of done something to earn this " + quoteString(username) + " as you are no longer allowed to use the mod");
};

// When there is an incorrect command, show this error
let cmdNotFound = function (cmd) {
    let error = PRE_ERROR + " Invalid command, " + quoteString(cmd) + " doesn't exist";
    if (publicOption) mppChatSend(error);
    else console.log(error);
};

// Commands
let help = function (command, userId, yourId) {
    let isOwner = MPP.client.isOwner();
    if (!exists(command) || command == "") {
        let publicCommands = formattedCommands(MOD_COMMANDS, PREFIX, true);
        mppChatSend(PRE_HELP + " Commands: " + formattedCommands(BASE_COMMANDS, PREFIX, true)
            + (publicOption ? ', ' + publicCommands : '')
            + (userId == yourId ? " | Mod Owner Commands: " + (publicOption ? '' : publicCommands + ', ')
                + formattedCommands(MOD_OWNER_COMMANDS, PREFIX, true) : ''));
    } else {
        let valid = null;
        let commandIndex = null;
        let commandArray = null;
        command = command.toLowerCase();
        // check commands arrays
        for (let i = 0; i < BASE_COMMANDS.length; i++) {
            if (BASE_COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandArray = BASE_COMMANDS;
                commandIndex = i;
            }
        }
        for (let j = 0; j < MOD_COMMANDS.length; j++) {
            if (MOD_COMMANDS[j][0].indexOf(command) == 0) {
                valid = command;
                commandArray = MOD_COMMANDS;
                commandIndex = j;
            }
        }
        for (let k = 0; k < MOD_OWNER_COMMANDS.length; k++) {
            if (MOD_OWNER_COMMANDS[k][0].indexOf(command) == 0) {
                valid = command;
                commandArray = MOD_OWNER_COMMANDS;
                commandIndex = k;
            }
        }
        // display info on command if it exists
        if (exists(valid)) mppChatSend(PRE_HELP + ' ' + formatCommandInfo(commandArray, commandIndex),);
        else cmdNotFound(command);
    }
};
let about = function () {
    mppChatSend(PRE_ABOUT + ' ' + MOD_DESCRIPTION + ' ' + MOD_AUTHOR + ' ' + MOD_NAMESPACE);
    mppChatMultiSend([(MOD_MUSIC_CREDIT + MOD_MUSIC_CREDIT_URL), (MOD_MIDI_CREDIT + MOD_MIDI_CREDIT_URL)], null, chatDelay);
};
let link = function () {
    mppChatSend(PRE_LINK + " You can get this mod from " + SUPPORT_URL);
};
let feedback = function () {
    mppChatSend(PRE_FEEDBACK + " Please go to " + FEEDBACK_URL + " in order to submit feedback.");
};
let ping = function () {
    // get a response back in milliseconds
    pinging = true;
    pingTime = Date.now();
    mppChatSend(PRE_PING);
};
let play = function (args, argsString) {
    let error = PRE_ERROR + " (play)";
    // args should contain one number related to a song
    if (args == null || args == "") {
        if (autoplayOption == AUTOPLAY_OFF) playRandom();
        else mppChatSend(error + " No song entered");
    } else {
        let valid = null;
        // check which song was picked, and validate it
        let choice = args[0];
        switch (argsString.toLowerCase()) {
            case "key": choice = "1"; break;
            case "door": choice = "2"; break;
            case "subwoofer": case "lullaby": case "subwoofer lullaby": choice = "3"; break;
            case "death": choice = "4"; break;
            case "living": case "living mice": choice = "5"; break;
            case "moog": case "city": case "moog city": choice = "6"; break;
            case "haggstrom": choice = "7"; break;
            case "mine": case "craft": case "minecraft": choice = "8"; break;
            case "equinoxe": choice = "10"; break;
            case "on": case "venus": case "mice on": case "on venus": case "mice on venus": choice = "11"; break;
            case "dry": case "dry hands": choice = "12"; break;
            case "wet": case "wet hands": choice = "13"; break;
            case "clark": choice = "14"; break;
            case "chris": choice = "15"; break;
            case "excuse": choice = "17"; break;
            case "sweden": choice = "18"; break;
            case "danny": choice = "21"; break;
            case "beginning": choice = "22"; break;
            case "droopy": case "likes": case "ricochet": case "droopy likes": case "likes ricochet": case "droopy likes ricochet": choice = "23"; break;
        }
        switch (choice) {
            case "1": case "01":
            case "2": case "02":
            case "3": case "03":
            case "4": case "04":
            case "5": case "05":
            case "6": case "06":
            case "7": case "07":
            case "8": case "08":
            case "10":
            case "11":
            case "12":
            case "13":
            case "14":
            case "15":
            case "17":
            case "18":
            case "21":
            case "22":
            case "23": valid = parseInt(choice); playSong(valid - 1); break;
            default: mppChatSend(error + " Invalid song selection"); break;
        }
    }
};
let skip = function () {
    // skips the current song if on autoplay
    if (autoplayOption != AUTOPLAY_OFF) {
        if (ended) mppChatSend(NO_SONG);
        else {
            playRandom();
        }
    } else mppChatSend(PRE_ERROR + " (skip) Need to be on random or ordered autoplay mode");
};
let stop = function () {
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        // stops the current song
        let tempSongName = currentSongName;
        stopSong(true);
        mppChatSend(PRE_MSG + ' `' + BAR_STOPPED + '` ' + BAR_ARROW_RIGHT + ' `' + tempSongName + '`');
    }
};
let pause = function (exceedsNoteQuota) {
    // pauses the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        let title = PRE_MSG + ' `';
        if (paused) title += BAR_STILL_PAUSED;
        else {
            Player.pause();
            playerPause();
            stopSong();
            title += BAR_PAUSED;
        }
        let reason = exceedsNoteQuota ? ' Reason: Note quota was drained.' : '';
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`' + reason);
    }
};
let resume = function () {
    // resumes the current song
    if (ended) mppChatSend(PRE_MSG + ' ' + NO_SONG);
    else {
        let title = PRE_MSG + ' `';
        if (paused) {
            // must turn back to original sustain state if needed
            if (sustainState.turnBackOn) {
                MPP.pressSustain();
                sustainState.on = true;
                sustainState.turnBackOn = false;
            }
            // then we can continue playing
            Player.play();
            playerPlay();
            title += BAR_RESUMED;
        } else title += BAR_STILL_RESUMED;
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
    }
};
let song = function () {
    // shows current song playing
    if (exists(currentSongName) && currentSongName != "") {
        let title = PRE_MSG + ' `' + (paused ? BAR_PAUSED : BAR_PLAYING);
        mppChatSend(title + '` ' + BAR_ARROW_RIGHT + ' `' + currentSongName + '`');
    } else mppChatSend(PRE_MSG + ' ' + NO_SONG);
};
let album = function () {
    // show list of songs available
    let songNamesMonospace = [];
    // need to create new array first
    let index = 0;
    let modifySongNames = setInterval(function () {
        if (index < SONG_NAMES.length) {
            let song = SONG_NAMES[index]
            if (SONG_NAMES[index]) {
                songNamesMonospace.push(PRE_MSG + ' `' + song + '`');
            }
            index++;
        } else {
            clearInterval(modifySongNames);

            mppChatSend(PRE_ALBUM);
            mppChatMultiSend(songNamesMonospace, null, chatDelay);
        }
    }, 1);
};
let repeat = function () {
    // turns on or off repeat
    repeatOption = !repeatOption;

    mppChatSend(PRE_SETTINGS + " Repeat set to " + (repeatOption ? "" : "not") + " repeating");
};
let sustain = function () {
    // turns on or off sustain
    sustainOption = !sustainOption;

    mppChatSend(PRE_SETTINGS + " Sustain set to " + (sustainOption ? "MIDI controlled" : "MPP controlled"));
};
let percussion = function () {
    // turns on or off percussion instruments
    percussionOption = !percussionOption;

    mppChatSend(PRE_SETTINGS + ' ' + (percussionOption ? "En" : "Dis") + "abled percussion instruments");
};
let autoplay = function (choice) {
    // changes the type of autoplay
    let currentAutoplay = getAutoplayString(autoplayOption);

    if (!exists(choice) || choice == "") mppChatSend(PRE_SETTINGS + " Autoplay is currently set to " + currentAutoplay);
    else if (getAutoplayValue(choice) == autoplayOption) mppChatSend(PRE_SETTINGS + " Autoplay is already set to " + currentAutoplay);
    else {
        let valid = getAutoplayValue(choice);
        if (valid > -1) {
            stopped = false;
            toggleAutoplay(valid);
            mppChatSend(PRE_SETTINGS + " Autoplay set to " + getAutoplayString(valid));
        } else mppChatSend(PRE_ERROR + " (autoplay) Invalid autoplay choice");
    }
};
let art = function (name, yourParticipant) {
    // sends Minecraft mob ASCII art, when some isn't already being displayed
    if (exists(name) && !artDisplaying) {
        // depending on color, show normal or inverted art
        let userColor = yourParticipant.color;
        let colorIsDark = getContrast(userColor) == 'black';
        switch (name.toLowerCase()) {
            case "cow": mppArtSend(colorIsDark ? cowArt : cowArtInverted, 0); break;
            case "pig": mppArtSend(colorIsDark ? pigArt : pigArtInverted, 0); break;
            case "carved": case "pumpkin": case "carved pumpkin": mppArtSend(colorIsDark ? carvedPumpkinArt : carvedPumpkinArtInverted, 0); break;
            case "villager": mppArtSend(colorIsDark ? villagerArt : villagerArtInverted, 0); break;
            case "iron": case "golem": case "iron golem": mppArtSend(colorIsDark ? ironGolemArt : ironGolemArtInverted, 0); break;
            case "ender": case "enderman": mppArtSend(colorIsDark ? endermanArt : endermanArtInverted, 0); break;
            case "spider": mppArtSend(colorIsDark ? spiderArt : spiderArtInverted, 0); break;
            case "creep": case "creeper": mppArtSend(colorIsDark ? creeperArt : creeperArtInverted, 0); break;
            case "ghast": mppArtSend(colorIsDark ? ghastArt : ghastArtInverted, 0); break;
            case "skele": case "skeleton": mppArtSend(colorIsDark ? skeletonArt : skeletonArtInverted, 0); break;
            case "slime": mppArtSend(colorIsDark ? slimeArt : slimeArtInverted, 0); break;
            case "zombie": mppArtSend(colorIsDark ? zombieArt : zombieArtInverted, 0); break;
            case "wither": mppArtSend(colorIsDark ? witherArt : witherArtInverted, 0); break;
            case "grass": case "dirt": mppArtSend(colorIsDark ? grassArt : grassArtInverted, 0); break;
            case "cobble": case "stone": case "cobblestone": mppArtSend(colorIsDark ? cobblestoneArt : cobblestoneArtInverted, 0); break;
            case "tnt": mppArtSend(colorIsDark ? tntArt : tntArtInverted, 0); break;
            default: mppChatSend(PRE_ERROR + " (art) There is no art for " + quoteString(name)); break;
        }
    } else if (!artDisplaying) mppChatSend(PRE_ART + " Your choices are " + ART_CHOICES, 0);
};
let publicCommands = function (userId, yourId) {
    // only let the mod owner set if public mod commands should be on or not
    if (userId != yourId) return;
    publicOption = !publicOption;
    mppChatSend(PRE_SETTINGS + " Public mod commands were turned " + (publicOption ? "on" : "off"));
};
let mppGetRoom = function () {
    if (MPP && MPP.client && MPP.client.channel && MPP.client.channel._id) {
        return MPP.client.channel._id;
    } else if (MPP && MPP.client && MPP.client.desiredChannelId) {
        return MPP.client.desiredChannelId;
    } else return null;
};

// =============================================== MAIN

// bug fix: see https://github.com/grimmdude/MidiPlayerJS/issues/25
Player.sampleRate = 0; // 1 ms is official MIDI spec, but can cause EOF to not be triggered, so set to 0 instead

Player.on('fileLoaded', function () {
    // Do something when file is loaded
});

Player.on('playing', function (currentTick) {
    // Do something while player is playing
    // (this is repeatedly triggered within the play loop)
    currentSongEventsPlayed = Player.eventsPlayed();
    if (paused || stopped) return;
    if (MPP.client.preventsPlaying()) pause();
});

Player.on('midiEvent', function (event) {
    // Do something when a MIDI event is fired.
    // (this is the same as passing a function to MidiPlayer.Player() when instantiating.

    // disable percussion instrument channels
    if (!percussionOption &&
        (event.channel == PERCUSSION_CHANNELS[0] /*|| event.channel == PERCUSSION_CHANNELS[1]*/)) return;

    // check event for note on/off and controller changes (sustain)
    let currentEvent = event.name;
    let currentNote = exists(event.noteNumber) &&
        (event.noteNumber >= 21) && (event.noteNumber <= 108)
        ? event.noteNumber : null;
    let noteIndex = currentNote ? (currentNote - 21) : -1;
    if (currentEvent == "Note on" && event.velocity) {
        // Note on
        //if (event.velocity >= 85) { // DEBLACKER NOTE: need to implement a slider for this
        // attempt at deblackening
        MPP.press(mppPianoNotes[noteIndex], event.velocity / 127);
        //}
        mppNoteBank[currentNote]++;
    } else if (currentEvent == "Note off" || (currentEvent == "Note on" && !event.velocity)) {
        // Note off
        if (sustainOption) {
            // only if the note bank shows we have 1 or less, should we release a key
            if (mppNoteBank[currentNote] <= 1) MPP.release(mppPianoNotes[noteIndex]);
        }
        mppNoteBank[currentNote]--;
    } else if (currentEvent == "Controller Change") {
        // Controller Change (CC)
        if (sustainOption) {
            if (event.noteNumber == 64) {
                // CC - Sustain
                if (event.velocity >= 64) {
                    MPP.pressSustain();
                } else {
                    MPP.releaseSustain();
                }
            } else if (event.noteNumber == 121) {
                // CC - Reset All Controllers
                MPP.releaseSustain();
            }
        }
    } // pitch bends don't need to be accounted for in midi files
});

Player.on('endOfFile', function () {
    // Do something when end of the file has been reached.
    ended = true;

    // do autoplay
    if (!repeatOption && autoplayOption != AUTOPLAY_OFF && !stopped) {
        // nice delay before playing next song
        setTimeout(function () { playRandom() }, REPEAT_DELAY);
    }
    // do repeat
    else if (repeatOption && !stopped && exists(currentSongIndex)) {
        // nice delay before playing song again
        setTimeout(function () { playSong(currentSongIndex) }, REPEAT_DELAY);
    }
    // stop
    else playerStop();
});

MPP.client.on('a', function (msg) { // on: new message
    // if user switches to VPN, these need to update
    let yourParticipant = MPP.client.getOwnParticipant();
    let yourId = yourParticipant._id;
    let yourUsername = yourParticipant.name;
    // get the message as string
    let input = msg.a.trim();
    let participant = msg.p;
    let username = participant.name;
    let userId = participant._id;

    // check if ping
    if (userId == yourId && pinging && input == PRE_PING) {
        pinging = false;
        pingTime = Date.now() - pingTime;
        mppChatSend(PRE_MSG + ' ' + pingTime + "ms", chatDelay);
    }

    // make sure the start of the input matches prefix
    if (input.startsWith(PREFIX)) {
        // don't allow banned or limited users to use the mod
        let bannedPlayers = BANNED_PLAYERS.length;
        if (bannedPlayers > 0) {
            for (let i = 0; i < BANNED_PLAYERS.length; ++i) {
                if (BANNED_PLAYERS[i] == userId) {
                    playerLimited(username);
                    return;
                }
            }
        }
        let limitedPlayers = LIMITED_PLAYERS.length;
        if (limitedPlayers > 0) {
            for (let j = 0; j < LIMITED_PLAYERS.length; ++j) {
                if (LIMITED_PLAYERS[j] == userId) {
                    playerLimited(username);
                    return;
                }
            }
        }
        // evaluate input into command and possible arguments
        let message = input.substring(PREFIX_LENGTH).trim();
        let hasArgs = message.indexOf(' ');
        let command = (hasArgs != -1) ? message.substring(0, hasArgs) : message;
        let argumentsString = (hasArgs != -1) ? message.substring(hasArgs + 1) : null;
        let arguments = (hasArgs != -1) ? argumentsString.split(' ') : null;
        // look through commands
        let isModOwner = userId == yourId;
        let preventsPlaying = MPP.client.preventsPlaying();
        switch (command.toLowerCase()) {
            case "help": case "h": if ((isModOwner || publicOption) && !preventsPlaying) help(argumentsString, userId, yourId); break;
            case "about": case "ab": if ((isModOwner || publicOption) && !preventsPlaying) about(); break;
            case "link": case "li": if ((isModOwner || publicOption) && !preventsPlaying) link(); break;
            case "feedback": case "fb": if (isModOwner || publicOption) feedback(); break;
            case "ping": case "pi": if (isModOwner || publicOption) ping(); break;
            case "play": case "p": if ((isModOwner || publicOption) && !preventsPlaying) play(arguments, argumentsString); break;
            case "skip": case "sk": if ((isModOwner || publicOption) && !preventsPlaying) skip(); break;
            case "stop": case "s": if ((isModOwner || publicOption) && !preventsPlaying) stop(); break;
            case "pause": case "pa": if ((isModOwner || publicOption) && !preventsPlaying) pause(); break;
            case "resume": case "r": if ((isModOwner || publicOption) && !preventsPlaying) resume(); break;
            case "song": case "so": if ((isModOwner || publicOption) && !preventsPlaying) song(); break;
            case "repeat": case "re": if ((isModOwner || publicOption) && !preventsPlaying) repeat(); break;
            case "sustain": case "ss": if ((isModOwner || publicOption) && !preventsPlaying) sustain(); break;
            case "percussion": case "pe": if ((isModOwner || publicOption) && !preventsPlaying) percussion(); break;
            case "autoplay": case "ap": if ((isModOwner || publicOption) && !preventsPlaying) autoplay(argumentsString); break;
            case "album": case "al": case "list": if (isModOwner || publicOption) album(); break;
            case "art": if (isModOwner || publicOption) art(argumentsString, yourParticipant); break;
            case "public": publicCommands(userId, yourId); break;
        }
    }
});
MPP.client.on('ch', function (msg) { // on: room change
    // update current room info
    let newRoom = mppGetRoom();
    if (currentRoom != newRoom) {
        currentRoom = newRoom;
        // stop any songs that might have been playing before changing rooms
        // only if we are not the owner of the room we are switching to
        if (!MPP.client.isOwner() && (currentRoom.toUpperCase()).indexOf(MOD_KEYWORD) == -1 && !ended) stopSong(true);
    }
});
MPP.client.on('nq', function (msg) { // on: note quota change
    // changes to note quota also reflect changes to room ownership or switching

    // set new chat delay
    if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
    else chatDelay = CHAT_DELAY;
});
MPP.client.on('p', function (msg) { // on: player joins room
    let userId = msg._id;
    // kick ban all the banned players
    let bannedPlayers = BANNED_PLAYERS.length;
    if (bannedPlayers > 0) {
        for (let i = 0; i < BANNED_PLAYERS.length; ++i) {
            let bannedPlayer = BANNED_PLAYERS[i];
            if (userId == bannedPlayer) MPP.client.sendArray([{ m: "kickban", _id: bannedPlayer, ms: 3600000 }]);
        }
    }
});

// =============================================== INTERVALS

// Stuff that needs to be done by intervals (e.g. autoplay/repeat)
let repeatingTasks = setInterval(function () {
    if (MPP.client.preventsPlaying()) return;
    // what to do while a song is playing
    if (!ended && exists(currentSongName) && currentSongName != "") {
        // display song progression status and end/done status
        let tempCurrentSongProgress = getElapsedProgressInt(PROGRESS_BAR_BLOCK_SIZE, currentSongEventsPlayed, currentSongTotalEvents);
        if (tempCurrentSongProgress != currentSongProgress) {
            currentSongProgress = tempCurrentSongProgress;
            if (currentSongProgress >= 0 && currentSongProgress <= PROGRESS_BAR_BLOCK_SIZE) {
                if (elapsingProgressNotification) {
                    elapsingProgressNotification.close();
                    elapsingProgressNotification = null;
                }
                let textColor = (MPP.client.user && MPP.client.user.color) ? MPP.client.user.color : '#0F0'; // fall back color just in case
                let textStyle = 'style="color: ' + textColor + ' !important"'
                let barProgress = getElapsingProgress(PROGRESS_BAR_BLOCK_SIZE, currentSongEventsPlayed, currentSongTotalEvents);
                let elapsingProgressNotificationSetup = {
                    html: '<div class="title" style="display: block !important">' +
                        '<code class="markdown">「<span ' + textStyle + '>' + barProgress + '</span>」</code><span>  </span>' +
                        '</div>' +
                        '<div class="text">' +
                        'Song: <code class="markdown" ' + textStyle + '>' + currentSongName + '</code>' +
                        '</div>',
                    duration: -1,
                    class: 'short'
                };
                elapsingProgressNotification = mppNotificationSend(elapsingProgressNotificationSetup);
            }
        }
        // pause if exceeds noteQuota
        if (!paused && exists(MPP.noteQuota) && exists(MPP.noteQuota.history) && !MPP.noteQuota.history[0]) {
            pause(true);
        }
    }
    if (finishedSongName) {
        if (elapsingProgressNotification) {
            elapsingProgressNotification.close();
            elapsingProgressNotification = null;
        }
        mppChatSend(PRE_MSG + ' `' + BAR_DONE_PLAYING + '` ' + BAR_ARROW_RIGHT + ' `' + finishedSongName + '`');
        finishedSongName = null;
    }
}, 1);
let slowRepeatingTasks = setInterval(function () {
    // do background tab fix
    if (!pageVisible) {
        let note = MPP.piano.keys["a-1"].note;
        let participantId = MPP.client.getOwnParticipant().id;
        MPP.piano.audio.play(note, 0.001, 0, participantId);
        MPP.piano.audio.stop(note, 0, participantId);
    }
}, SLOW_DELAY);

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

// wait for the client to come online, and piano keys to be fully loaded
let waitForMPP = setInterval(function () {
    let MPP_Fully_Loaded = exists(MPP) && exists(MPP.client) && exists(MPP.piano) && exists(MPP.piano.keys);
    if (MPP_Fully_Loaded && mppGetRoom() && triedClickingPlayButton) {
        clearInterval(waitForMPP);

        // initialize mod settings and elements
        currentRoom = mppGetRoom();
        if (currentRoom.toUpperCase().indexOf(MOD_KEYWORD) >= 0) {
            publicOption = true;
            if (MOD_SOLO_PLAY) setOwnerOnlyPlay(MOD_SOLO_PLAY);
            autoplayOption = AUTOPLAY_RANDOM;
            playRandom();
        }
        // attempt to create the Notification API, if it doesn't already exist
        if (!exists(MPP.Notification)) {
            // 2023-07-02T06:45:05Z - code modified via https://github.com/LapisHusky/mppclone/blob/main/client/script.js
            MPP.Notification = function (t) { if (this instanceof MPP.Notification == !1) throw "yeet"; EventEmitter.call(this); t = t || {}; this.id = "Notification-" + (t.id || Math.random()), this.title = t.title || "", this.text = t.text || "", this.html = t.html || "", this.target = $(t.target || "#piano"), this.duration = t.duration || 3e4, this.class = t.class || "classic"; var i = this, e = $("#" + this.id); return e.length > 0 && e.remove(), this.domElement = $('<div class="notification"><div class="notification-body"><div class="title"></div><div class="text"></div></div><div class="x">X</div></div>'), this.domElement[0].id = this.id, this.domElement.addClass(this.class), this.domElement.find(".title").text(this.title), this.text.length > 0 ? this.domElement.find(".text").text(this.text) : this.html instanceof HTMLElement ? this.domElement.find(".text")[0].appendChild(this.html) : this.html.length > 0 && this.domElement.find(".text").html(this.html), document.body.appendChild(this.domElement.get(0)), this.position(), this.onresize = function () { i.position() }, window.addEventListener("resize", this.onresize), this.domElement.find(".x").click((function () { i.close() })), this.duration > 0 && setTimeout((function () { i.close() }), this.duration), this }, mixin(MPP.Notification.prototype, EventEmitter.prototype), MPP.Notification.prototype.constructor = MPP.Notification, MPP.Notification.prototype.position = function () { var t = this.target.offset(), i = t.left - this.domElement.width() / 2 + this.target.width() / 4, e = t.top - this.domElement.height() - 8, o = this.domElement.width(); i + o > $("body").width() && (i -= i + o - $("body").width()), i < 0 && (i = 0), this.domElement.offset({ left: i, top: e }) }, MPP.Notification.prototype.close = function () { var t = this; window.removeEventListener("resize", this.onresize), this.domElement.fadeOut(500, (function () { t.domElement.remove(), t.emit("close") })) };
        }
        // let user know if they won't be able to see notifications
        if (!exists(MPP.Notification)) {
            mppChatSend(PRE_MSG + " This version of Multiplayer Piano doesn't support notifications, please check console for the notification.");
        }
        // setup midi player needs
        mppPianoNotes = Object.keys(MPP.piano.keys);
        mppNoteBank = Array.apply(null, Array(mppPianoNotes.length)).map(function () { return 0 });
        // won't work right if press/release sustain keys aren't available
        let compatitbilityError = '';
        if (!exists(MPP.pressSustain) && !exists(MPP.releaseSustain)) {
            compatitbilityError = "Looks like this version of Multiplayer Piano is incompatible with this mod.<br>" +
                "Things likely won't work as expected!<br>" +
                "Ask the website owner if they can update their version of Multiplayer Piano.<br><br>";
        }
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
                    target: "#new-room-btn",
                    title: MOD_DISPLAYNAME + " [v" + VERSION + "]",
                    html: mppAdsWebsiteNotice + compatitbilityError + newVersionAvailable + `Mod created by <a target="_blank" href="${NAMESPACE}">${AUTHOR}</a>, thanks for using it!<br>` +
                        `<br>` +
                        MOD_MUSIC_CREDIT + `<a target="_blank" href="${MOD_MUSIC_CREDIT_URL}">${MOD_MUSIC_CREDIT_URL}</a><br>` +
                        `<br>` +
                        MOD_MIDI_CREDIT + `<a target="_blank" href="${MOD_MIDI_CREDIT_URL}">${MOD_MIDI_CREDIT_URL}</a><br>` +
                        `<br>` +
                        `If you need any help using the mod, try using the command:<br>` +
                        ` ${LIST_BULLET} <code class="markdown" style="color: #0F0 !important">${PREFIX}help</code>`,
                    duration: starterNotificationDuration
                };
                let starterNotification = mppNotificationSend(starterNotificationSetup);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);
