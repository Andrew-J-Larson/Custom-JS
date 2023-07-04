// MOD temp constants
const PRE_ELEMENT_ID = "aliendrew-midi-player-mod";
// MOD constants
const TOGGLER_ELEMENT_ID = PRE_ELEMENT_ID + '-toggler';
const MIDI_PLAYER_CONTAINER_ELEMENT_ID = PRE_ELEMENT_ID + "-midi-player-container";
const JZZ_TO_MPP_VIRTUAL_MIDI_PORT_NAME = 'JZZ to MPP (Virtual MIDI)';
const PERCUSSION_CHANNELS = [10, 11]; // (DON'T CHANGE)
// MOD functions
// Check to make sure variable is initialized with something
let exists = function(element) {
    if (typeof(element) != "undefined" && element != null) return true;
    return false;
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
// MOD variables
let mppPianoNotes = Object.keys(MPP.piano.keys);
let percussionOption = false; // turning on percussion makes a lot of MIDIs sound bad

// MOD temp elements
let theModButton = document.getElementById(TOGGLER_ELEMENT_ID);
let elementToAttachTo = theModButton ? ('#' + TOGGLER_ELEMENT_ID) : '#piano';

// load scripts in first
let loaded = false;
let s1 = document.createElement('script');
s1.src = 'https://cdn.jsdelivr.net/npm/jzz';
s1.async = 'false';
document.body.appendChild(s1);

s1.onload = () => {

    let s2 = document.createElement('script');
    s2.src = 'https://cdn.jsdelivr.net/npm/jzz-midi-smf';
    s2.async = 'false';
    document.body.appendChild(s2);

    s2.onload = () => {

        let s3 = document.createElement('script');
        s3.src = 'https://cdn.jsdelivr.net/npm/jzz-gui-player';
        s3.async = 'false';
        document.body.appendChild(s3);

        s3.onload = () => {
            
            let s4 = document.createElement('script');
            s4.src = 'https://cdn.jsdelivr.net/gh/bgrins/TinyColor/dist/tinycolor-min.js';
            s3.async = 'false';
            document.body.appendChild(s4);
            
            s4.onload = () => {
                loaded = true;
            }
        };
    };
};


let player = null;
let waitForScriptsLoaded = setInterval(function() {
    if (loaded) {
        clearInterval(waitForScriptsLoaded);

        if (!document.querySelector("#" + TOGGLER_ELEMENT_ID)) elementToAttachTo = '#piano';

        // modify the theme of the gui player
        let uglyButtonStyle = JSON.parse(JSON.stringify(getComputedStyle(theModButton)));
        let uglyButtonIsdarkTheme = tinycolor(uglyButtonStyle.backgroundColor).isDark();
/*        JZZ.gui.Player.Btn = function() {
          
        };
        JZZ.gui.Player.Btn.prototype.on = function() {
            this.div.style.backgroundColor = tinycolor(uglyButtonIsdarkTheme.backgroundColor).lighten(20).toString();
            this.div.style.borderColor = uglyButtonStyle.borderColor;
            this.div.firstChild.style.fill = uglyButtonStyle.color;
        };
        JZZ.gui.Player.Btn.prototype.off = function() {
            this.div.style.backgroundColor = uglyButtonStyle.backgroundColor;
            this.div.style.borderColor = uglyButtonStyle.borderColor;
            this.div.firstChild.style.fill = uglyButtonStyle.color;
        };
        JZZ.gui.Player.Btn.prototype.disable = function() {
            this.div.style.backgroundColor = 'transparent';
            this.div.style.borderColor = uglyButtonStyle.backgroundColor;
            this.div.firstChild.style.fill = uglyButtonStyle.backgroundColor;
        }; */

        // create JZZ gui Player element
        var midiPlayerContainerElement = document.createElement('div');
        midiPlayerContainerElement.id = MIDI_PLAYER_CONTAINER_ELEMENT_ID;
        let midiPlayerNotificationSetup = {
            target: elementToAttachTo,
            html: midiPlayerContainerElement,
            duration: -1,
            class: 'short'
        };
        let midiPlayerNotification = mppNotificationSend(midiPlayerNotificationSetup);
        let midiPlayerNotificationElement = midiPlayerNotification.domElement[0];
        let midiPlayerNotificationElementStyle = midiPlayerNotificationElement.style;
        if (theModButton) {
            midiPlayerNotificationElementStyle.visibility = 'hidden'; // instantly hide the notification for further setup
            // TODO >>> EVENTUALLY NEED TO FIX THE FOLLOWING CODE, AND MAKE IT SUCH THAT CLICKING THE BUTTON CLOSES THE MOD INFO NOTIFICATION
            theModButton.onclick = function() {
                // can use jQuery to fade element out, but must not activate until fade is done
                if (!midiPlayerNotificationElementStyle.opacity || midiPlayerNotificationElementStyle.opacity == 1) {
                    if (midiPlayerNotificationElementStyle.visibility && midiPlayerNotificationElementStyle.visibility == 'hidden') midiPlayerNotificationElementStyle.visibility = '';
                    else {
                        midiPlayerNotification.domElement.fadeOut(500, function () {
                            // required, or else breaks positioning
                            midiPlayerNotificationElementStyle.visibility = 'hidden';
                            midiPlayerNotificationElementStyle.display = '';
                        });
                    }
                }
            };
        }

        // create custom JZZ widget (to interpret MIDI notes for MPP)
        var jzzToMPP_widget = JZZ.Widget({ _receive: function(msg) {
            // JJZ implementation to play midi notes on MPP
            var channel = (msg[0] & 0xf) + 1;
            var cmd = msg[0] >> 4;
            var note_number = msg[1] - 21;
            var vel = msg[2];
            if (percussionOption && (channel == PERCUSSION_CHANNELS[0] || channel == PERCUSSION_CHANNELS[1])) return;
            if (cmd == 8 || (cmd == 9 && vel == 0)) {
                // NOTE_OFF
                MPP.release(mppPianoNotes[note_number]);
            } else if (cmd == 9) {
                // NOTE_ON
                MPP.press(mppPianoNotes[note_number], vel / 127);
            } else if (cmd == 11) {
                // CONTROL_CHANGE
                if (note_number == 64) {
                    if (vel > 20) {
                        MPP.pressSustain();
                    } else {
                        MPP.releaseSustain();
                    }
                }
            }
        }});
        JZZ.addMidiOut(JZZ_TO_MPP_VIRTUAL_MIDI_PORT_NAME, jzzToMPP_widget);

        // connect custom JZZ widget to JZZ gui Player element
        player = new JZZ.gui.Player({ at: MIDI_PLAYER_CONTAINER_ELEMENT_ID, file: true, midi: false, ports: [JZZ_TO_MPP_VIRTUAL_MIDI_PORT_NAME] });
        // fix notification placement
        midiPlayerNotification.position();
        // remove close button (toggle button will hide it if needed)
        midiPlayerNotificationElement.querySelector('.x').remove();

        // setup hooks on special events
        player.onLoad = function(smf) {
            // called when the MIDI data is successfully loaded; smf is an instance of the JZZ.MIDI.SMF class
            MPP.chat.send('Song loaded');
        };
        /* player.onSelect = function(name) {
            // called when the MIDI Output port is successfully selected; name is the port name
        }; */
        player.onPlay = function() {
            // called when the playback is started (either by the button click or by calling play())
            MPP.chat.send('Song started');
        };
        player.onStop = function() {
            // called when the playback is stopped (either by the button click or by calling stop())
            MPP.chat.send('Pressed stop');
        };
        player.onPause = function() {
            // called when the playback is paused (either by the button click or by calling pause())
            MPP.chat.send('Pressed pause');
        };
        player.onResume = function() {
            // called when the playback is resumed (either by the button click or by calling pause())
            MPP.chat.send('Pressed resume');
        };
        player.onLoop = function(loop) {
            // called when loop is toggled (either by the button click or by calling loop())
            MPP.chat.send('Pressed loop: looping = `' + (loop == -1) + '`');
        };
        /* player.onJump  = function(t) {
            // called when the playback position is changed (either by dragging the knob or by calling jump()/jumpMS()); t is the new position in MIDI ticks
        }; */
        player.onEnd = function() {
            // called when the end of the MIDI file is reached; if the plyback is looped, called in the end of each loop
            MPP.chat.send('Song ended');
        };
        /* player.onClose = function() {
            // called when the widget is closed
        }; */
    }
}, 1);