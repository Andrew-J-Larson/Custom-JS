// ==UserScript==
// @name         Youtube Scrollable Suggestions
// @namespace    https://thealiendrew.github.io/
// @version      1.6.7
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/YouTube/Youtube-Scrollable-Suggestions.user.js
// @description  Converts the side video suggestions into a confined scrollable list, so you can watch your video while looking at suggestions.
// @author       AlienDrew
// @include      /^https?:\/\/www\.youtube\.com\/watch\?v=.*
// @icon         https://s.ytimg.com/yts/img/favicon_32-vflOogEID.png
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// ==/UserScript==

/* Copyright (C) 2020  Andrew Larson (thealiendrew@gmail.com)

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

// Greasemonkey doesn't allow some external scripts, including the one I've been using to detect an element existing.
// Because of this, I've include a minified version of the code in this script.
// jQuery library - waitForKeyElements --- Date code was added: March 8th, 2020 -- From: https://gist.githubusercontent.com/BrockA/2625891/raw/9c97aa67ff9c5d56be34a55ad6c18a314e5eb548/waitForKeyElements.js
function waitForKeyElements(e,t,a,n){var o,r;(o=void 0===n?$(e):$(n).contents().find(e))&&o.length>0?(r=!0,o.each(function(){var e=$(this);e.data("alreadyFound")||!1||(t(e)?r=!1:e.data("alreadyFound",!0))})):r=!1;var l=waitForKeyElements.controlObj||{},i=e.replace(/[^\w]/g,"_"),c=l[i];r&&a&&c?(clearInterval(c),delete l[i]):c||(c=setInterval(function(){waitForKeyElements(e,t,a,n)},300),l[i]=c),waitForKeyElements.controlObj=l}
// jQuery library - attrchange ----------- Date code was added: March 16th, 2020 - From: https://raw.githubusercontent.com/meetselva/attrchange/master/js/attrchange.js
!function(t){var a=window.MutationObserver||window.WebKitMutationObserver;t.fn.attrchange=function(e,n){if("object"==typeof e){var r={trackValues:!1,callback:t.noop};if("function"==typeof e?r.callback=e:t.extend(r,e),r.trackValues&&this.each(function(a,e){for(var n,r={},i=(a=0,e.attributes),c=i.length;a<c;a++)r[(n=i.item(a)).nodeName]=n.value;t(this).data("attr-old-value",r)}),a){var i={subtree:!1,attributes:!0,attributeOldValue:r.trackValues},c=new a(function(a){a.forEach(function(a){var e=a.target;r.trackValues&&(a.newValue=t(e).attr(a.attributeName)),"connected"===t(e).data("attrchange-status")&&r.callback.call(e,a)})});return this.data("attrchange-method","Mutation Observer").data("attrchange-status","connected").data("attrchange-obs",c).each(function(){c.observe(this,i)})}return function(){var t=document.createElement("p"),a=!1;if(t.addEventListener)t.addEventListener("DOMAttrModified",function(){a=!0},!1);else{if(!t.attachEvent)return!1;t.attachEvent("onDOMAttrModified",function(){a=!0})}return t.setAttribute("id","target"),a}()?this.data("attrchange-method","DOMAttrModified").data("attrchange-status","connected").on("DOMAttrModified",function(a){a.originalEvent&&(a=a.originalEvent),a.attributeName=a.attrName,a.oldValue=a.prevValue,"connected"===t(this).data("attrchange-status")&&r.callback.call(this,a)}):"onpropertychange"in document.body?this.data("attrchange-method","propertychange").data("attrchange-status","connected").on("propertychange",function(a){a.attributeName=window.event.propertyName,function(a,e){if(a){var n=this.data("attr-old-value");if(e.attributeName.indexOf("style")>=0){n.style||(n.style={});var r=e.attributeName.split(".");e.attributeName=r[0],e.oldValue=n.style[r[1]],e.newValue=r[1]+":"+this.prop("style")[t.camelCase(r[1])],n.style[r[1]]=e.newValue}else e.oldValue=n[e.attributeName],e.newValue=this.attr(e.attributeName),n[e.attributeName]=e.newValue;this.data("attr-old-value",n)}}.call(t(this),r.trackValues,a),"connected"===t(this).data("attrchange-status")&&r.callback.call(this,a)}):this}if("string"==typeof e&&t.fn.attrchange.hasOwnProperty("extensions")&&t.fn.attrchange.extensions.hasOwnProperty(e))return t.fn.attrchange.extensions[e].call(this,n)}}(jQuery);

// basic
const scriptShortName = 'YTscrollSuggest';
const fastDelay       = 100; // in milliseconds

// selectors
//const pageSelector        = 'ytd-app';
const headerSelector      = '#masthead-container';
const leftSelector        = '#primary';
const leftInSelector      = leftSelector + '-inner';
const rightSelector       = '#secondary';
const rightInSelector     = rightSelector + '-inner';
const playerSelector      = '#player-container-outer';
const theaterSelector     = '#player-theater-container';
const miniplayerSelector  = 'button.ytp-miniplayer-button';
const sizeSelector        = 'button.ytp-size-button';
const fullscreenSelector  = 'button.ytp-fullscreen-button';
const panelsSelector      = '#panels';
const donationsSelector   = '#donation-shelf';
const chatSelector        = 'ytd-live-chat-frame#chat';
const playlistSelector    = '#playlist';
const adsSelector         = '#player-ads';
const offerModuleSelector = '#offer-module';
const suggestionsSelector = '#items:nth-child(2):not(.playlist-items)';
const autoPlaySelector    = 'ytd-compact-autoplay-renderer';
const videoItemSelector   = 'ytd-compact-video-renderer:not(.ytd-compact-autoplay-renderer)';
const videoThumbSelector  = 'ytd-thumbnail';
const radioItemSelector   = 'ytd-compact-radio-renderer';
const movieItemSelector   = 'ytd-compact-movie-renderer';
const movieItemASelector  = 'a.yt-simple-endpoint.ytd-compact-movie-renderer';
const spinnerSelector     = 'ytd-watch-next-secondary-results-renderer #continuations';

// constant strings
const miniplayerExit  = 'Expand (i)';
const miniplayerEnter = 'Miniplayer (i)';
const sizeExit  = 'Default view (t)';
const sizeEnter = 'Theater mode (t)';
const fullscreenExit  = 'Exit full screen (f)';
const fullscreenEnter = 'Full screen (f)';

// styling
const cssClassPrefix       = GM_info.script.author + scriptShortName;
const standardPadding      = 24; // in px
const videoItemPadding     = 8; // in px
const spinnerPadding       = 16; // in px
const scrollbarWidth       = 17; // in px
//const videoMinWidth        = 'var(--ytd-watch-flexy-min-player-width)';
//const videoMaxWidth        = 'var(--ytd-watch-flexy-max-player-width)';
//const sidebarWidth         = 'var(--ytd-watch-flexy-sidebar-width)';
//const sidebarMinWidth      = 'var(--ytd-watch-flexy-sidebar-min-width)';
const pageColorA           = 'var(--yt-spec-general-background-a)';
const pageColorB           = 'var(--yt-spec-general-background-b)';
const pageColorC           = 'var(--yt-spec-general-background-c)';
const cssSuggestionsClass  = cssClassPrefix + 'Suggestions';
const cssSpinnerClass      = cssClassPrefix + 'Spinner';
const cssSugClassSelector  = '.' + cssSuggestionsClass;
const cssScrollbarSelector = '.' + cssSuggestionsClass + '::-webkit-scrollbar';
const cssSpinClassSelector = '.' + cssSpinnerClass;
const cssSuggestionsStyle  = cssSugClassSelector + ' { overflow-y: auto }' + cssScrollbarSelector + ' { height:auto } ' + cssScrollbarSelector + '-thumb { background-color:#ccc; border:2px solid '+ pageColorB + ' } ' + cssScrollbarSelector + '-track { background-color:' + pageColorB + ' } [dark] ' + cssScrollbarSelector + '-thumb { background-color:#333;border:2px solid ' + pageColorB + ' } [dark] ' + cssScrollbarSelector + '-track { background-color:' + pageColorB + ' }';
// padding screws up the scrollbar effect, so must remove it
const cssMovieItemStyle    = cssSugClassSelector + ' ' + movieItemASelector + ' { padding-right: 0px }';
// must be above everything, but not be showing so it's not awkward, and must follow scrollbar in view to activate
const cssSpinnerStyle      = cssSpinClassSelector + ' { z-index: 999; position: fixed; opacity: 0 }';
const cssConstantStyle     = cssSuggestionsStyle + ' ' + cssMovieItemStyle + ' ' + cssSpinnerStyle;

var $ = window.jQuery;
var d = document;
var D = $(document);
var W = $(window);

var visibility      = d.visibilityState,
    enabledYT       = false,
    disabledYT      = true,
    extendedDisable = false;

// don't try to do anything until page is visible
D.on('visibilitychange', function() {
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
function disablePageScrolling(element) {
    // code via https://stackoverflow.com/a/33672757/7312536
    element.on('DOMMouseScroll mousewheel', function(ev) {
        if (enabledYT && !disabledYT) {
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
        }
    });
}

// if the element gains or loses height do something
function detectHeightChange(element, aFunction) {
    var prevHeight = element.height();
    element.attrchange({
        callback: function (e) {
            var curHeight = element.height();
            if (prevHeight !== curHeight) {
                aFunction(true);
                prevHeight = curHeight;
            }
        }
    }).resizable();
}

// check if element has an attribute
function checkAttribute(element, attribute) {
    var attr = element.attr(attribute);

    // For some browsers, `attr` is undefined; for others,
    // `attr` is false.  Check for both.
    if (typeof attr !== typeof undefined && attr !== false) {
        return true;
    } else return false;
}

// check if element has a height
function hasHeight(element) {
    var height = element.height();

    if (typeof height === typeof undefined || isNaN(height) || height == 0) return false;
    else return true;
}

// check if element has a width
function hasWidth(element) {
    var width = element.width();

    if (typeof width === typeof undefined || isNaN(width) || width == 0) return false;
    else return true;
}

// append css styling to html page
function addStyleString(str) {
    var node = d.createElement('style');
    node.innerHTML = str;
    d.body.appendChild(node);
}

// begin script when page is ready
waitForKeyElements(videoItemSelector, function () {
    var header      = $(headerSelector),
        leftCoIn    = $(leftInSelector),
        rightContn  = $(rightSelector),
        rightCoIn   = $(rightInSelector),
        player      = $(playerSelector).first(),
        theater     = $(theaterSelector).first(),
        panels      = $(panelsSelector),
        donations   = $(donationsSelector),
        chat        = $(chatSelector).first(),
        playlist    = $(playlistSelector),
        ads         = $(adsSelector),
        offerModule = $(offerModuleSelector),
        suggestions = $(suggestionsSelector).first(),
        autoPlay    = $(autoPlaySelector).first(),
        videoItem   = $(videoItemSelector),
        videoThumb  = $(videoThumbSelector),
        radioItem   = $(radioItemSelector),
        movieItem   = $(movieItemSelector),
        movieItemA  = $(movieItemASelector),
        spinner     = $(spinnerSelector).first(),
        autoPHeight = autoPlay.length ? autoPlay.outerHeight(true) : 0,
        vItemHeight = videoItem.height(),
        vItemHPad   = vItemHeight + videoItemPadding,
        vThumbWidth = videoThumb.outerWidth(true),
        headHeight  = header.height(),
        contentTop  = headHeight + standardPadding,
        autoPlayBot = contentTop + autoPHeight,
        minHeight   = vItemHeight,
        previousScr = 0,
        sliding     = false,
        atSugEnd    = false,
        fullscreen  = false;

    // contains classes used to style everything
    addStyleString(cssConstantStyle);

    // disable page scrolling when scrollbar is active
    disablePageScrolling(suggestions);
    if (autoPlay.length) disablePageScrolling(autoPlay);
    disablePageScrolling(spinner);

    // enable/disable scrollbar function
    function enableSuggestionsScroll(trueFalse) {
        // readdress where elements are first
        suggestions = $(suggestionsSelector).first();
        if (autoPlay.length) autoPlay = $(autoPlaySelector).first();
        spinner     = $(spinnerSelector).first();
        videoItem   = $(videoItemSelector);
        radioItem   = $(radioItemSelector);
        movieItem   = $(movieItemSelector);
        movieItemA  = $(movieItemASelector);

        // toggle styling
        if (trueFalse) {
            suggestions.addClass(cssSuggestionsClass);
            spinner.addClass(cssSpinnerClass);
        } else {
            if (suggestions.classList && suggestions.classList.contains(cssSuggestionsClass)) suggestions.removeClass(cssSuggestionsClass);
            if (spinner.classList && spinner.classList.contains(cssSpinnerClass)) spinner.removeClass(cssSpinnerClass);
            suggestions.css({'width': '', 'height': '', 'margin-top': '', 'position': '', 'top': ''});
            if (autoPlay.length) autoPlay.css({'width': '', 'position': '', 'top': ''});
            spinner.css({'width': '', 'margin-top': '', 'top': '', 'bottom': ''});
            videoItem.css({'opacity': '', 'width': ''});
            radioItem.css({'opacity': '', 'width': ''});
            movieItem.css({'opacity': '', 'width': ''});
            movieItemA.css({'width': ''});
        }
    }

    // detect position changes to change size accordingly
    function fixDynamicSizes(forceRun) {
        if (visibility == 'visible') {
            var viewHeight     = W.height(),
                viewWidth      = W.width(),
                playerWidth    = hasWidth(player) ? player.width() : 0,
                theaterEnabled = theater.children().length > 0,
                secondaryGone  = rightCoIn.children().length <= 1;

            disabledYT = secondaryGone || extendedDisable;

            if (enabledYT && disabledYT) {
                // not disabled yet, disabling
                console.log(scriptShortName + ': disabling suggestions scrollbar...');
                enableSuggestionsScroll(false);
                enabledYT = false;
                fixDynamicSizes(false);
            } else if (enabledYT && !disabledYT) {
                var scrTop          = W.scrollTop(),
                    outsidePadding  = leftCoIn.position().left,
                    resizeWidth     = (viewWidth - (leftCoIn.width() + standardPadding + outsidePadding*2)),
                    theatherHeight  = theaterEnabled ? (hasHeight(theater) ? theater.outerHeight(true) : 0) : 0,
                    panelsHeight    = hasHeight(panels) ? panels.outerHeight(true) : 0,
                    donationsHeight = hasHeight(donations) ? donations.outerHeight(true) : 0,
                    chatHeight      = hasHeight(chat) ? chat.outerHeight(true) : 0,
                    playlistHeight  = hasHeight(playlist) ? playlist.outerHeight(true) : 0,
                    adsHeight       = hasHeight(ads) ? ads.outerHeight(true) : 0,
                    offerModHeight  = hasHeight(offerModule) ? offerModule.outerHeight(true) : 0,
                    fillerHeight    = (fullscreen ? 0 : theatherHeight) + panelsHeight + donationsHeight + chatHeight + playlistHeight + adsHeight + offerModHeight,
                    oriPosTop       = (fullscreen ? (viewHeight + standardPadding) : contentTop) + fillerHeight,
                    oriScrTop       = oriPosTop - scrTop,
                    belowTopPos     = viewHeight - oriScrTop,
                    allInView       = (belowTopPos - minHeight) >= 0;

                // if suggestions is or not moving
                if (!sliding && previousScr != scrTop) {
                    previousScr = scrTop;
                    if (scrTop && allInView) {
                        sliding = true;
                    }
                } else {
                    if ((!scrTop || !allInView)) {
                        sliding = false;
                    }
                }

                // determine if position/size needs updating
                if (sliding || forceRun) {
                    var maxHeight            = vItemHPad * Math.floor((viewHeight - (autoPlayBot + standardPadding)) / vItemHPad),
                        itemsNewWidth        = resizeWidth - scrollbarWidth,
                        movieItemANewWidth   = itemsNewWidth - vThumbWidth,
                        atContent            = ((fullscreen ? viewHeight : 0) + fillerHeight - scrTop) <= 0,
                        opacityItems         = atSugEnd ? 0.33 : 1,
                        marginTopSuggestions = autoPHeight,
                        posSuggestions       = 'static',
                        topSuggestions       = 0,
                        posAutoPlay          = 'absolute',
                        topAutoPlay          = oriPosTop,
                        marginTopSpinner     = 0,
                        topSpinner           = 'auto',
                        botSpinner           = atSugEnd ? 'auto' : (viewHeight + 'px');

                    if (atContent) {
                        marginTopSuggestions = 0;
                        posSuggestions = 'fixed';
                        topSuggestions = autoPlayBot;
                        posAutoPlay = 'fixed';
                        topAutoPlay = contentTop;
                        if (atSugEnd) topSpinner = contentTop + 'px';
                    } else if (atSugEnd) topSpinner = ((contentTop + fillerHeight) - scrTop) + 'px';

                    // just for reference, this is how to always used fixed positions, but it yields jagged movement when the video suggestions are not at the top of the screen
                    /*if (!atContent) {
                        marginTopSuggestions = 0;
                        posSuggestions = 'fixed';
                        topSuggestions = ((contentTop + fillerHeight + autoPHeight) - scrTop);
                        posAutoPlay = 'fixed';
                        topAutoPlay = ((contentTop + fillerHeight) - scrTop);
                    }*/


                    // updates style for each that changes
                    suggestions.css({'width': resizeWidth + 'px', 'height': maxHeight + 'px', 'margin-top': marginTopSuggestions, 'position': posSuggestions, 'top': topSuggestions + 'px'});
                    if (autoPlay.length) autoPlay.css({'width': resizeWidth + 'px', 'position': posAutoPlay, 'top': topAutoPlay + 'px'});
                    spinner.css({'width': resizeWidth + 'px', 'margin-top': marginTopSpinner + 'px', 'top': topSpinner, 'bottom': botSpinner});
                    // widths of items and inside of movie items must change
                    videoItem.css({'opacity': opacityItems, 'width': itemsNewWidth + 'px'});
                    radioItem.css({'opacity': opacityItems, 'width': itemsNewWidth + 'px'});
                    movieItem.css({'opacity': opacityItems, 'width': itemsNewWidth + 'px'});
                    movieItemA.css({'width': movieItemANewWidth + 'px'});
                }
            } else if (!enabledYT && !disabledYT) {
                // not enabled yet, enabling
                console.log(scriptShortName + ': enabling suggestions scrollbar...');
                enableSuggestionsScroll(true);
                enabledYT = true;
                fixDynamicSizes(true);
            }
        }
    }

    // must run at least once
    fixDynamicSizes(true);

    // when the screen is resized also update the sidebar width
    D.on('scroll', function() {
        fixDynamicSizes(false);
    });
    W.on('resize', function() {
        fixDynamicSizes(true);
    });

    // when scroll has happened and we reach a change of ending, update positions
    suggestions.on('scroll', function() {
        if (enabledYT && !disabledYT) {
            var atPrevious       = atSugEnd,
                suggestScrBottom = suggestions.scrollTop() + suggestions.innerHeight(),
                suggestScrHeight = suggestions[0].scrollHeight;
            if (suggestScrBottom >= suggestScrHeight && !checkAttribute(spinner, 'hidden') && hasHeight(spinner)) atSugEnd = true;
            else atSugEnd = false;

            // update changes
            if (atPrevious != atSugEnd) fixDynamicSizes(true);
        }
    });

    // must know when miniplayer, size, and fullscreen buttons are pressed
    $(function() {
        $(miniplayerSelector).click(function() {
            // must disable the size/position settings when going off of current page
            extendedDisable = true;
            fixDynamicSizes(true);
        });

        $(sizeSelector).click(function() {
            setTimeout(function() {
                // don't need to update variables related to theater mode, since sizing for that is already handled
                fixDynamicSizes(true);
            }, fastDelay);
        });

        $(fullscreenSelector).click(function() {
            setTimeout(function() {
                var tempTitle = $(fullscreenSelector).attr('title');

                if (tempTitle == fullscreenEnter) fullscreen = false;
                else if(tempTitle == fullscreenExit) fullscreen = true;

                fixDynamicSizes(true);
            }, fastDelay);
        });
    });

    // this must start only after the two panel view is on
    var waitForRightHaveChildren = setInterval(function() {
        if (rightCoIn.length > 1) {
            detectHeightChange(rightContn, fixDynamicSizes);
            clearInterval(waitForRightHaveChildren);
        }
    }, fastDelay);
});