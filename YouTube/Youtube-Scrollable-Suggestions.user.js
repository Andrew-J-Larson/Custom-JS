// ==UserScript==
// @name         Youtube Scrollable Suggestions
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      3.6
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/YouTube/Youtube-Scrollable-Suggestions.user.js
// @description  Converts the side video suggestions into a confined scrollable list, so you can watch your video while looking at suggestions.
// @author       AlienDrew
// @include      /^https?:\/\/www\.youtube\.com\/watch\?v=.*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

// Greasemonkey doesn't allow some external scripts, including the one I've been using to detect an element existing.
// Because of this, I've include a minified version of the code in this script.
// Date code was added: March 8th, 2020 - From: https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
function waitForKeyElements(e,t,a,n){var o,r;(o=void 0===n?$(e):$(n).contents().find(e))&&o.length>0?(r=!0,o.each(function(){var e=$(this);e.data("alreadyFound")||!1||(t(e)?r=!1:e.data("alreadyFound",!0))})):r=!1;var l=waitForKeyElements.controlObj||{},i=e.replace(/[^\w]/g,"_"),c=l[i];r&&a&&c?(clearInterval(c),delete l[i]):c||(c=setInterval(function(){waitForKeyElements(e,t,a,n)},300),l[i]=c),waitForKeyElements.controlObj=l}

// basic
const scriptShortName = 'YTscrollSuggest';
const normalTimeDelay = 1000;
const fastTimeDelay   = 100;

// selectors
const pageSelector        = 'ytd-app';
const headerSelector      = '#masthead-container';
const leftSelector        = '#primary';
const videoSelector       = 'video';
const panelsSelector      = '#panels';
const donationsSelector   = '#donation-shelf';
const chatSelector        = 'ytd-live-chat-frame#chat';
const playlistSelector    = '#playlist';
const adsSelector         = '#player-ads';
const suggestionsSelector = 'ytd-watch-next-secondary-results-renderer';
const autoPlaySelector    = 'ytd-compact-autoplay-renderer';
const itemsSelector       = '#items .ytd-watch-next-secondary-results-renderer:nth-child(2)';
const videoItemSelector   = 'ytd-compact-video-renderer';
const scrollbarSelector   = suggestionsSelector + '::-webkit-scrollbar';

// styling
const cssClassPrefix    = GM_info.script.author + scriptShortName;
const standardPadding   = 24; // in px
const videoItemPadding  = 8; // in px
const scrollbarWidth    = 17; // in px
const pageColorA        = 'var(--yt-spec-general-background-a)';
const pageColorB        = 'var(--yt-spec-general-background-b)';
const pageColorC        = 'var(--yt-spec-general-background-c)';
const sideBarWidth      = 'var(--ytd-watch-flexy-sidebar-width)';
const sideBarMinWidth   = 'var(--ytd-watch-flexy-sidebar-min-width)';
const varSuggestionsBG     = '--' + cssClassPrefix + 'SuggestionsBG';
const suggestionsBG  = 'var(' + varSuggestionsBG + ')';
const cssHtmlTheme      = 'html { ' + varSuggestionsBG + ':' + pageColorA + '!important }'
const cssScrollbarTheme = suggestionsSelector + ' { overflow-y:auto; width:' + sideBarWidth + '; min-width:' + sideBarMinWidth + ' } ' + scrollbarSelector + ' { height:auto } ' + scrollbarSelector + '-thumb { background-color:#ccc; border:2px solid ' + pageColorB + ' } ' + scrollbarSelector + '-track { background-color:' + pageColorB + '; } [dark] ' + scrollbarSelector + '-thumb { background-color:#333;border:2px solid ' + pageColorB + ' } [dark] ' + scrollbarSelector + '-track { background-color:' + pageColorB + '; }';
const cssAutoPlayTheme  = autoPlaySelector + ' { z-index:99; width:' + sideBarWidth + '; min-width:' + sideBarMinWidth + ' }';

var $ = window.jQuery;
var d = document;
var w = window;
var D = $(document);
var W = $(window);

var visibility = d.visibilityState;

// don't try to do anything until page is visible
d.addEventListener('visibilitychange', function() {
    visibility = d.visibilityState;
});

// wait for element to show up with a position, then execute code
function waitForPosition(element, aFunction, time) {
    if (element.position() != null) {
        aFunction()
        return;
    } else {
        setTimeout(function() {
            waitForPosition(time);
        }, time);
    }
}

// prevent page from scolling when trying to scroll on an element
// code via https://stackoverflow.com/a/33672757/7312536
function disablePageScrolling (element) {
    element.on('DOMMouseScroll mousewheel', function(ev) {
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
}

// change pixels to viewheight
function pxTOvh(height, pixels) {
    return (100*pixels)/height;
}

// to get separate RGB values
// code via https://stackoverflow.com/a/34980657/7312536
function getRGB(str){
  var match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/);
  return match ? {
    red: match[1],
    green: match[2],
    blue: match[3]
  } : {};
}

// append css styling to html page
function addStyleString(str) {
    var node = d.createElement('style');
    node.innerHTML = str;
    d.body.appendChild(node);
}

// enabled scrollbar on suggestions panel, and start sizing
function startScript() {
    var page        = $(pageSelector),
        header      = $(headerSelector),
        leftCon     = $(leftSelector),
        video       = $(videoSelector),
        panels      = $(panelsSelector),
        donations   = $(donationsSelector),
        chat        = $(chatSelector),
        playlist    = $(playlistSelector),
        ads         = $(adsSelector),
        suggestions = $(suggestionsSelector),
        autoPlay    = $(autoPlaySelector),
        items       = $(itemsSelector),
        videoItem   = $(videoItemSelector),
        sugWidth    = suggestions.width() - scrollbarWidth,
        viewHeight  = W.height(),
        autoPHeight = autoPlay.outerHeight(true),
        vItemHeight = videoItem.height(),
        headHeight  = header.height(),
        contentTop  = headHeight + standardPadding,
        minHeight   = vItemHeight,
        maxHeight   = viewHeight - (contentTop + autoPHeight + standardPadding),
        sliding     = true; // this allows it to execute at least once to resize

    disablePageScrolling(suggestions);
    disablePageScrolling(autoPlay);

    addStyleString(cssHtmlTheme);
    addStyleString(cssScrollbarTheme);
    addStyleString(cssAutoPlayTheme);

    // detect position changes to change size accordingly
    function fixDynamicSizes() {
        if (visibility == 'visible') {
            var scrTop          = W.scrollTop(),
                panelsHeight    = isNaN(panels.height()) ? 0 : panels.height(),
                donationsHeight = isNaN(donations.height()) ? 0 : donations.height(),
                chatHeight      = isNaN(chat.height()) ? 0 : chat.height(),
                playlistHeight  = isNaN(playlist.height()) ? 0 : playlist.height(),
                adsHeight       = isNaN(ads.height()) ? 0 : ads.height(),
                fillerHeight    = panelsHeight + donationsHeight + chatHeight + playlistHeight + adsHeight,
                adjustedHeight  = (fillerHeight ? (fillerHeight + (adsHeight ? 0 : standardPadding)) : 0),
                oriPosTop       = contentTop + adjustedHeight,
                oriScrTop       = oriPosTop - scrTop,
                atContent       = (adjustedHeight - scrTop) <= 0,
                belowTopPos     = viewHeight - oriScrTop,
                belowView       = belowTopPos < 0,
                allInView       = (belowTopPos - minHeight) >= 0,
                vidHeight       = video.height(),
                newHeight       = viewHeight - (oriScrTop + autoPHeight + standardPadding);

            console.log(adsHeight);

            if (newHeight < minHeight) newHeight = minHeight;
            else if (newHeight > maxHeight) newHeight = maxHeight;

            // if suggestions is moving
            if ((scrTop && !sliding) && allInView) {
                // ADD CLASSES
                sliding = true;
            }

            // determine if position/size needs updating
            if (sliding) {
                var topPos = (atContent) ? contentTop : oriScrTop;

                if (atContent) {
                    addStyleString(suggestionsSelector + ' { position:fixed; margin-top:0; top:' + (topPos + autoPHeight) + 'px; height:' + newHeight + 'px }');
                    addStyleString(autoPlaySelector + ' { position:fixed; top:' + topPos + 'px }');
                } else {
                    addStyleString(suggestionsSelector + ' { position:static; margin-top:' + (autoPHeight + (adsHeight ? 0 : standardPadding)) + 'px; top:0; height:' + newHeight + 'px }');
                    addStyleString(autoPlaySelector + ' { position:absolute; top:' + oriPosTop + 'px }');
                }
            }

            // if suggestions is not moving
            if ((!scrTop && sliding) || !allInView) {
                // REMOVE CLASSES
                sliding = false;
            }
        }
    }

    fixDynamicSizes(); // run at least once even if there hasn't been a scroll

    d.addEventListener('scroll', function() {
        fixDynamicSizes();
    });
}

// begin script
waitForKeyElements(videoItemSelector, function () {
    startScript();
});