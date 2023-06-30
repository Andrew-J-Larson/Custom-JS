// load scripts in first
var loaded = false;
if (!loaded) {
    let s1 = document.createElement('script');
    s1.src = 'https://cdn.jsdelivr.net/npm/jzz';
    document.head.appendChild(s1);

    let waitForJZZ = setInterval(function() {
        if (typeof JZZ !== 'undefined') {
            clearInterval(waitForJZZ);
            
if (!loaded) {
    let s2 = document.createElement('script');
    s2.src = 'https://cdn.jsdelivr.net/npm/jzz-midi-smf';
    document.head.appendChild(s2);
    
    let waitForJZZmidiSMF = setInterval(function() {
        if ((typeof JZZ.MIDI !== 'undefined') && (typeof JZZ.MIDI.SMF !== 'undefined')) {
            clearInterval(waitForJZZmidiSMF);

if (!loaded) {
    let s3 = document.createElement('script');
    s3.src = 'https://cdn.jsdelivr.net/npm/web-midi-test';
    document.head.appendChild(s3);

    let waitForWebMidiTest = setInterval(function() {
        if ((typeof WMT !== 'undefined') && (typeof WMT.requestMIDIAccess !== 'undefined')) {
            clearInterval(waitForWebMidiTest);
            
if (!loaded) {
    let s4 = document.createElement('script');
    s4.src = 'https://cdn.jsdelivr.net/npm/jzz-gui-player';
    document.head.appendChild(s4);

    let waitForJZZguiPlayer = setInterval(function() {
        if ((typeof JZZ.gui !== 'undefined') && (typeof JZZ.gui.Player !== 'undefined')) {
            clearInterval(waitForJZZguiPlayer);
            
            loaded = true;
        }
    }, 1);
}
        }
    }, 1);
}
        }
    }, 1);
}
        }
    }, 1);
}

let waitForScriptsLoaded = setInterval(function() {
    if (loaded) {
        clearInterval(waitForScriptsLoaded);

        WMT.requestMIDIAccess().then(function() {
            // create test MIDI input/output
            var testMidiOutName = 'VIRTUAL MIDI-Out'
            var testMidiOut = new WMT.MidiDst(testMidiOutName);
testMidiOut.receive = function(msg) { console.log('received:', msg); };
            
            // create midi player
            var midiPlayerElement = document.createElement('div');
            midiPlayerElement.id = 'mppMidiMod';
            var appendToElement = document.getElementById('names');
            appendToElement.appendChild(midiPlayerElement);
            //var testMidiHandler = new JZZ.MIDI();
            //testMidiOut.receive = function(jzzMidi) {
            //    console.log(jzzMidi);
            //} // NEED TO FIGURE OUT

            // attempt midi play with the handler
            var player = new JZZ.gui.Player(midiPlayerElement.id);
            player.connect(testMidiOutName);
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mid,.midi';
            input.onchange = function() {
                if (input.files.length > 0) {
                    let fileChosen = input.files[0];
                    var reader = new FileReader();
                    reader.addEventListener("loadend", () => {
                        // reader.result contains the contents of blob as a typed array
                        var data = reader.result;
                        // data can be String, Buffer, ArrayBuffer, Uint8Array or Int8Array
                        player.load(new JZZ.MIDI.SMF(data));
                        player.play();
                        //...
                        //player.speed(0.5); // play twice slower
                    });
                    reader.readAsArrayBuffer(fileChosen);
                }
            }
            input.click();
        }, function() {
            console.error('SOMETHING FAILED!');
        });
    }
}, 1);