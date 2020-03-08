// ==UserScript==
// @name         Youtube Sub-Scrollable "Watch Next Secondary Results"
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      2.5
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/YouTube/Youtube%20Sub-Scrollable%20Watch%20Next%20Secondary%20Results.user.js
// @description  Converts the side video suggestions into a confined scrollable list, so you can watch your video while looking at suggestions.
// @author       AlienDrew
// @include      /^https?://www\.youtube\.com/watch\?v=*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
// ==/UserScript==

const containerSelector = '#primary';
const videoSelector = 'video';
const watchNextSelector = 'ytd-watch-next-secondary-results-renderer';
const autoPlaySelector = 'ytd-compact-autoplay-renderer';
const itemsSelector = '#items .ytd-watch-next-secondary-results-renderer:nth-child(2)';
const scrollbarWidth = 17;
const timeForTimeouts = 1000;

var $ = window.jQuery;
var d = document;

var visibility = d.visibilityState;
var panelWidth = 0;
var panelHeight = 0;
var autoVidHeight = 0;

// don't try to resize page isn't visible
d.addEventListener('visibilitychange', function() {
    visibility = d.visibilityState;
});

// change pixels to viewheight
function pxTOvh(height, pixels) {
    return (100*pixels)/height;
}

// append css styling to html page
function addStyleString(str) {
    var node = d.createElement('style');
    node.innerHTML = str;
    d.body.appendChild(node);
}

// detect position changes to change size accordingly
function fixDynamicSizes() {
    if (visibility == 'visible') {
        var scrHeight  = $(window).height(),
            vidHeight  = $(videoSelector).height(),
            elemPosTop = $(watchNextSelector).position().top,
            elemPad    = $(containerSelector).css('padding-top').replace('px',''),
            minHeight  = (((scrHeight - (vidHeight / 2)) / scrHeight) * 100),
            calcHeight = (((scrHeight - elemPosTop) / scrHeight) * 100) - pxTOvh(scrHeight, elemPad),
            viewHeight = Math.max(minHeight, calcHeight);

        if (panelHeight != elemPosTop) {
            panelHeight = elemPosTop;
            addStyleString(watchNextSelector + ' { height: ' + viewHeight + 'vh;}');
        }

        var watchNextWidth = $(watchNextSelector).outerWidth(),
            autoPlayHeight = 0;
        if ($(autoPlaySelector) != null) autoPlayHeight = $(autoPlaySelector).outerHeight(true);

        if (scrollbarWidth != 0 && panelWidth != watchNextWidth) {
            panelWidth = watchNextWidth;
            console.log(scrollbarWidth);
            addStyleString(autoPlaySelector + ' { width: ' + (watchNextWidth - scrollbarWidth) + 'px; }');
        }

        if (autoVidHeight != autoPlayHeight) {
            autoVidHeight = autoPlayHeight;
            addStyleString(itemsSelector + ' { padding-top: ' + autoPlayHeight + 'px; }');
        }

        setTimeout(fixDynamicSizes, timeForTimeouts);
    }
}

// wait until watch next panel is given a position to start sizing
function waitForPanelPosition(time) {
    if ($(watchNextSelector).position() != null) {
        fixDynamicSizes()
        return;
    } else {
        setTimeout(function() {
            waitForPanelPosition(time);
        }, time);
    }
}

// enabled scrollbar on watch next panel, and start sizing
waitForKeyElements(itemsSelector, function () {
    // prevent page from scolling when using panel scrolling
    // code via https://stackoverflow.com/a/33672757/7312536
    $(watchNextSelector).on('DOMMouseScroll mousewheel', function(ev) {
        var $this = $(this),
            scrollTop = this.scrollTop,
            scrollHeight = this.scrollHeight,
            height = $this.height(),
            delta = (ev.type == 'DOMMouseScroll' ?
                     ev.originalEvent.detail * -40 :
                     ev.originalEvent.wheelDelta),
            up = delta > 0;

        var prevent = function() {
            ev.stopPropagation();
            ev.preventDefault();
            ev.returnValue = false;
            return false;
        }

        if (!up && -delta > scrollHeight - height - scrollTop) {
            // Scrolling down, but this will take us past the bottom.
            $this.scrollTop(scrollHeight);
            return prevent();
        } else if (up && delta > scrollTop) {
            // Scrolling up, but this will take us past the top.
            $this.scrollTop(0);
            return prevent();
        }
    });

    addStyleString(watchNextSelector + ' { overflow-y: scroll !important; }');
    addStyleString(autoPlaySelector + ' { position: absolute; z-index: 100; background-color: rgba(0,0,0,0.9); }');

    waitForPanelPosition(100);
});