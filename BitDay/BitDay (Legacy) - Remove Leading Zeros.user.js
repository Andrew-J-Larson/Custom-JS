// ==UserScript==
// @name         BitDay (Legacy) - Remove Leading Zeros
// @namespace    https://thealiendrew.github.io/
// @version      1.0.0
// @description  Removes leading zeros (like normal clocks).
// @author       AlienDrew
// @include      /^https?://www\.bitday\.me/legacy*/
// @downloadURL  https://raw.githubusercontent.com/TheAlienDrew/Tampermonkey-Scripts/master/BitDay/BitDay%20(Legacy)%20-%20Remove%20Leading%20Zeros.user.js
// @grant        none
// ==/UserScript==

window["updateClock"] = function () {
	var d = new Date();
	var hours = d.getHours();
	var mins = d.getMinutes();
	var ampm = hours < 12 ? "AM" : "PM";

	//Formatting
	mins = ((mins < 10) ? "0" : "") + mins;
	hours = (hours > 12) ? hours - 12 : hours;
	hours = (hours == 0) ? 12 : hours;
	hours = ((hours < 10) ? "0" : "") + hours;

	var str = hours + ":" + mins + " " + ampm;

	//Set the new time
	var $clock = $('.clock h3');
	var oldStr = $clock.text();
	$clock.text(str.replace(/^0+/, ''));

	//Check if the hour has changed
	var oldHour = getMilitaryHour(oldStr);
	if(oldStr.length == 0) return;
	var currHour = d.getHours();
	if(currHour != oldHour) {

		//Change bgs
		var cssClass = getPicture(currHour);
		var oldClass = getPicture(oldHour);

		if(cssClass != oldClass) {

			//Make our waiting div the active div
			$('.bg-tobe').removeClass('bg-tobe').addClass('bg-' + cssClass);

			//Fade in the new bg
	    	$('.bg-' + cssClass).fadeIn();

			//Fade out the active and put it in a waiting state
	    	$('.bg-' + oldClass).fadeOut(function() {
	    		$('.bg-' + oldClass).removeClass('bg-' + oldClass).addClass('bg-tobe');
	    	});
	    }
	}
};