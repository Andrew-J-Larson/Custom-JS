// ==UserScript==
// @name         Greeter Bot
// @namespace    https://thealiendrew.github.io/
// @version      0.1.4
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Multiplayer%20Piano/MPP-Greeter-Bot.user.js
// @description  Greets users who join the room with a custom message!
// @author       AlienDrew
// @include      /^https?://www\.multiplayerpiano\.com*/
// @icon         https://cdn.pixabay.com/photo/2016/11/30/18/14/chat-1873543_960_720.png
// @grant        GM_info
// @run-at       document-end
// @noframes
// ==/UserScript==

/* globals jQuery, MPP, Color */

// =============================================== CONSTANTS

// Script constants
const SCRIPT = GM_info.script;
const NAME = SCRIPT.name;
const NAMESPACE = SCRIPT.namespace;
const VERSION = SCRIPT.version;
const DESCRIPTION = SCRIPT.description;
const AUTHOR = SCRIPT.author;

// Time constants (in milliseconds)
const TENTH_OF_SECOND = 100; // mainly for repeating loops
const SECOND = 10 * TENTH_OF_SECOND;
const CHAT_DELAY = 5 * TENTH_OF_SECOND; // needed since the chat is limited to 10 messages within less delay
const SLOW_CHAT_DELAY = 2 * SECOND // when you are not the owner, your chat quota is lowered

// URLs
const FEEDBACK_URL = "https://forms.gle/SzpZYTzVKRe7B4Wc7";

// Bot constants
const CHAT_MAX_CHARS = 512; // there is a limit of this amount of characters for each message sent (DON'T CHANGE)

// Bot constant settings
const CLEAR_LINES = 9; // may be changed if needed, but this number seems to be the magic number
const CLEAR_TEXT = "—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬—▬";

// Bot custom constants
const GREET_HI = 0;
const GREET_BYE = 1;
const GREET_NAME = "$NAME";
const GREET_COLOR = "$COLOR";
const GREET_PLAYER = '"' + GREET_NAME + '" [' + GREET_COLOR + ']';
const PREFIX = "!";
const PREFIX_LENGTH = PREFIX.length;
const THICK_BORDER = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const THIN_BORDER = "══════════════════════════════════════════════════════════════════════";
const BOT_USERNAME = NAME + " [" + PREFIX + "help]";
const BOT_NAMESPACE = '(' + NAMESPACE + ')';
const BOT_DESCRIPTION = DESCRIPTION + " Made with JS via Tampermonkey."
const BOT_AUTHOR = "Created by " + AUTHOR + '.';
const COMMANDS = [
    ["help (command)", "displays info about command, but no command entered shows the commands"],
    ["about", "get information about this bot"],
    ["hi [message]", "sets the welcome message for users; " + GREET_NAME + " = user name, " + GREET_COLOR + " = user color"],
    ["hi_[choice]", "turns the welcome message on or off; e.g. " + PREFIX + "hi_on"],
    ["bye [message]", "sets the goodbye message for users; " + GREET_NAME + " = user name, " + GREET_COLOR + " = user color"],
    ["bye_[choice]", "turns the goodbye message on or off e.g. " + PREFIX + "bye_on"],
    ["clear", "clears the chat"],
    ["feedback", "shows link to send feedback about the bot to the developer"],
    ["active [choice]", "turns the bot on or off (bot owner only)"]
];
const PRE_MSG = NAME + " (v" + VERSION + "): ";
const PRE_HELP = PRE_MSG + "[Help]";
const PRE_ABOUT = PRE_MSG + "[About]";
const PRE_HI = PRE_MSG + "[Hi]";
const PRE_BYE = PRE_MSG + "[Bye]";
const PRE_PING = PRE_MSG + "[Ping]";
const PRE_FEEDBACK = PRE_MSG + "[Feedback]";
const PRE_LIMITED = PRE_MSG + "Limited!";
const PRE_ERROR = PRE_MSG + "Error!";
const LIST_BULLET = "• ";
const DESCRIPTION_SEPARATOR = " - ";

// =============================================== VARIABLES

var active = true; // turn off the bot if needed
var botUser = null; // gets set to _id of user running the bot
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

// Set the bot on or off (only from bot)
var setActive = function(args, userId) {
    if (userId != MPP.client.user._id) return;
    var choice = args[0];
    var newActive = null;
    switch(choice.toLowerCase()) {
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
    setTimeout(function(){MPP.chat.send(str)}, delay);
}

// Titles for some commands
var mppTitleSend = function(str, delay) {
    if (chatDelay != SLOW_CHAT_DELAY) mppChatSend(THICK_BORDER, delay);
    mppChatSend(str, delay);
}

// Sends in a bottom border if needed
var mppEndSend = function(delay) {
    if (chatDelay != SLOW_CHAT_DELAY) mppChatSend(THIN_BORDER, delay);
}

// Send multiline chats, and return final delay to make things easier for timings
var mppChatMultiSend = function(strArray, optionalPrefix, initialDelay) {
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
var mppGetUserColorName = function(hexColor) {
    return (new Color(hexColor)).getName().replace("A shade of ", "");
}

// Send command info to user
var mppCmdSend = function(commandsArray, cmdSubstring, delay) {
    var commandIndex = null;
    // get command index
    var i;
    for(i = 0; i < commandsArray.length; ++i) {
        if (commandsArray[i][0].indexOf(cmdSubstring) == 0) {
            commandIndex = i;
        }
    }
    // display info on command
    mppChatSend(formatCommandInfo(commandsArray, commandIndex), delay);
}

// When there is an incorrect command, show this error
var cmdNotFound = function(cmd) {
    // if cmd is empty somehow, show it
    if (exists(cmd) && cmd != "") {
        // if we're in the fishing room, ignore the fishing commands
        var error = "Invalid command, " + quoteString(cmd) + " doesn't exist";
        cmd = cmd.toLowerCase();
        if (currentRoom == "test/fishing" && (cmd.indexOf("fish") == 0 || cmd.indexOf("cast") == 0 || cmd.indexOf("reel") == 0 ||
                                             cmd.indexOf("caught") == 0 || cmd.indexOf("eat") == 0 || cmd.indexOf("give") == 0 ||
                                             cmd.indexOf("bestow") == 0 || cmd.indexOf("pick") == 0 || cmd.indexOf("sack") == 0)) {
            console.log(error);
        } else {
            mppTitleSend(PRE_ERROR, 0);
            mppChatSend(error, 0);
            mppEndSend(0);
        }
    } else {
        mppTitleSend(PRE_ERROR, 0);
        mppChatSend("No command entered", 0);
        mppEndSend(0);
    }
}

// Commands
var help = function(command) {
    if (!exists(command) || command == "") {
        mppTitleSend(PRE_HELP, 0);
        mppChatSend("Commands: " + formattedCommands(COMMANDS, LIST_BULLET + PREFIX, true), 0);
    } else {
        var valid = null;
        var commandIndex = null;
        command = command.toLowerCase();
        // check commands array
        var i;
        for(i = 0; i < COMMANDS.length; ++i) {
            if (COMMANDS[i][0].indexOf(command) == 0) {
                valid = command;
                commandIndex = i;
            }
        }
        // display info on command if it exists
        if (exists(valid)) {
            mppTitleSend(PRE_HELP, 0);
            mppChatSend(formatCommandInfo(COMMANDS, commandIndex), 0);
        } else cmdNotFound(command);
    }
    mppEndSend(0);
}
var about = function() {
    mppTitleSend(PRE_ABOUT, 0);
    mppChatSend(BOT_DESCRIPTION, 0);
    mppChatSend(BOT_AUTHOR + ' ' + BOT_NAMESPACE, 0);
    mppEndSend(0);
}
var greetMsgSet = function(cmd, intGreet, msg) {
    var greet = "The ";
    var title;
    if (intGreet == GREET_HI) title = PRE_HI;
    else if (intGreet == GREET_BYE) title = PRE_BYE;
    mppTitleSend(title, 0);
    if (!exists(msg)) mppCmdSend(COMMANDS, cmd + ' ', 0);
    else {
        var sameMsg = false;
        switch(intGreet) {
            case GREET_HI: greet += "welcome"; hiMessage == msg ? sameMsg = true : hiMessage = msg; break;
            case GREET_BYE: greet += "goodbye"; byeMessage == msg ? sameMsg = true : byeMessage = msg; break;
        }
        if (sameMsg) mppChatSend(greet + " message wasn't changed", 0);
        else mppChatSend(greet + " message was set to: " + msg.replace(GREET_NAME,"[username here]").replace(GREET_COLOR,"[usercolor here]"), 0);
    }
    mppEndSend(0);
}
var greetToggle = function(cmd, intGreet, boolChoice) {
    // check greet, then check current bool, lastly set it if not already
    var greet = "The ";
    var alreadySet = false;
    if (intGreet == GREET_HI) {
        greet += "welcome";
        switch(hiOn) {
            case true: boolChoice ? alreadySet = true : hiOn = false; break;
            case false: boolChoice ? hiOn = true : alreadySet = true; break;
        }
    } else if (intGreet == GREET_BYE) {
        greet += "goodbye";
        switch(byeOn) {
            case true: boolChoice ? alreadySet = true : byeOn = false; break;
            case false: boolChoice ? byeOn = true : alreadySet = true; break;
        }
    }

    // display message
    mppTitleSend(PRE_MSG + '[' + cmd + ']', 0);
    if (alreadySet) mppChatSend(greet + " message is already turned " + (boolChoice ? "on" : "off"), 0);
    else mppChatSend(greet + " message has been turned " + (boolChoice ? "on" : "off"), 0);
    mppEndSend(0);
}
var clear = function() {
    // clear the chat of current messages (can be slow)
    var i;
    for (i = 0; i < CLEAR_LINES; ++i) {
        mppChatSend(CLEAR_TEXT, chatDelay * i);
        if (i == CLEAR_LINES - 1) setTimeout(MPP.chat.clear, chatDelay * (i + 1));
    }
}
var feedback = function() {
    // just sends feedback url to user
    mppTitleSend(PRE_FEEDBACK, 0);
    mppChatSend("Please go to " + FEEDBACK_URL + " in order to submit feedback.", 0);
    mppEndSend(0);
}

// =============================================== MAIN

MPP.client.on('a', function (msg) {
    // get the message as string
    var input = msg.a.trim();
    var participant = msg.p;
    var username = participant.name;
    var userId = participant._id;
    // make sure the start of the input matches prefix
    if (userId == botUser && input.startsWith(PREFIX)) {
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
            case "hi": if (active) greetMsgSet(command.toLowerCase(), GREET_HI, argumentsString); break;
            case "bye": if (active) greetMsgSet(command.toLowerCase(), GREET_BYE, argumentsString); break;
            case "hi_on": if (active) greetToggle(command.toLowerCase(), GREET_HI, true); break;
            case "hi_off": if (active) greetToggle(command.toLowerCase(), GREET_HI, false); break;
            case "bye_on": if (active) greetToggle(command.toLowerCase(), GREET_BYE, true); break;
            case "bye_off": if (active) greetToggle(command.toLowerCase(), GREET_BYE, false); break;
            case "clear": case "cl": if (active) clear(); break;
            case "feedback": case "fb": if (active) feedback(); break;
            case "active": case "a": setActive(arguments, userId); break;
            default: if (active) cmdNotFound(command); break;
        }
    }
});
MPP.client.on("ch", function(msg) {
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
                jQuery.grep(new_ids, function(_id) {
                    if (jQuery.inArray(_id, old_ids) == -1) added_ids.push(_id);
                    i++;
                });
                // if we have gained users, welcome them in
                if (exists(added_ids) && added_ids.length > 0) {
                    var j;
                    for(j = 0; j < added_ids.length; j++) {
                        var k;
                        for(k = 0; k < updatedPlayers.length; k++) {
                            // if added _id matches in updatedPlayers, then get name and show hiMessage
                            if (added_ids[j] == updatedPlayers[k][0]) mppChatSend(PRE_MSG + hiMessage.replace(GREET_NAME,updatedPlayers[k][1]).replace(GREET_COLOR,mppGetUserColorName(updatedPlayers[k][2])), 0);
                        }
                    }
                }
            }

            // check players left
            if (byeOn) {
                var removed_ids = [];
                jQuery.grep(old_ids, function(_id) {
                    if (jQuery.inArray(_id, new_ids) == -1) removed_ids.push(_id);
                    i++;
                });
                // if we have lost users, goodbye to them
                if (exists(removed_ids) && removed_ids.length > 0) {
                    var l;
                    for(l = 0; l < removed_ids.length; l++) {
                        var m;
                        for(m = 0; m < currentPlayers.length; m++) {
                            // if removed _id matches in currentPlayers, then get name and show byeMessage
                            if (removed_ids[l] == currentPlayers[m][0]) mppChatSend(PRE_MSG + byeMessage.replace(GREET_NAME,currentPlayers[m][1]).replace(GREET_COLOR,mppGetUserColorName(currentPlayers[m][2])), 0);
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

                active = true;
                botUser = MPP.client.user._id;
                currentRoom = MPP.client.channel._id;
                if (!MPP.client.isOwner()) chatDelay = SLOW_CHAT_DELAY;
                mppTitleSend(PRE_MSG + " Online!", 0);
                mppEndSend(0);
            }
        }, TENTH_OF_SECOND);
    }
}, TENTH_OF_SECOND);