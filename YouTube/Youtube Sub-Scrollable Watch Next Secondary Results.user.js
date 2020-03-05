// ==UserScript==
// @name         Youtube Sub-Scrollable "Watch Next Secondary Results"
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      1.0
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/YouTube/Youtube%20Sub-Scrollable%20Watch%20Next%20Secondary%20Results.user.js
// @description  Converts the side video suggestions into a confined scrollable list, so you can watch your video while looking at suggestions.
// @author       AlienDrew
// @match        www.youtube.com/watch?v=*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

var $ = window.jQuery;

// required functions

// change pixels to viewheight
function pxTOvh(height, pixels) {
  return (100*pixels)/height;
}

// append css styling to html page
function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}

// create the scrollable side panel
function createScrollable() {
    // get positions/padding in pixels
    var screenHeight  = $(window).height(),
        elemRect      = $("ytd-watch-next-secondary-results-renderer"),
        elemHeight    = elemRect.position().top,
        elemPadding   = $("#primary").css("padding-top").replace("px",""),
        newViewHeight = (((screenHeight - elemHeight) / screenHeight) * 100) - pxTOvh(screenHeight, elemPadding);

    // convert new view height
    var cssStyleString = "ytd-watch-next-secondary-results-renderer { overflow-y: auto !important; height: " + newViewHeight + "vh;}"

    // code via https://stackoverflow.com/questions/33672479/prevent-page-scrolling-while-scrolling-a-div-element/33672757
    elemRect.on('DOMMouseScroll mousewheel', function(ev) {
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

    addStyleString(cssStyleString);

    return;
}

// wait until panel exists to make it scrollable
function waitForWatchNextToDisplay(time) {
    if(document.getElementsByTagName("ytd-watch-next-secondary-results-renderer")[0]!=null) {
        createScrollable()
            return;
    } else {
        setTimeout(function() {
            waitForWatchNextToDisplay(time);
        }, time);
    }
}

waitForWatchNextToDisplay(100);