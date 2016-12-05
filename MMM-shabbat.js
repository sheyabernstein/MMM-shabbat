/* Magic Mirror
 * Module: Pi-Hole Stats
 *
 * By Sheya Bernstein https://github.com/sheyabernstein/MMM-shabbat
 * MIT Licensed.
 */

Module.register("MMM-shabbat", {

	// Default module config.
	defaults: {
		observe: true,
		minutesBefore: "18",
		minutesAfter: "50",
		ashkenaz: true,
		
		latitude: "",
		longitude: "",
		tzid: "",

		updateInterval: 6 * 60 * 60 * 1000, // every 6 hours
		animationSpeed: 1000,

		retryDelay: 2500,
		initialLoadDelay: 0,

		modulesHidden: false, // don't change
	},

	// Define required scripts.
	getScrips: function() {
		return ["moment.min.js"];
	},

	// Define required translations.
	getTranslations: function() {
		// The translations for the defaut modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionairy.
		// If you're trying to build yiur own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		this.parashat = null;
		this.candles = null;
		this.havdalah = null;

		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.latitude === "") {
			wrapper.innerHTML = "Please set the correct <i>latitude</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.longitude === "") {
			wrapper.innerHTML = "Please set the correct <i>longitude</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.tzid === "") {
			wrapper.innerHTML = "Please set the correct <i>tzid</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light";
			return wrapper;
		}

		var header = document.createElement("div");
		header.className = "small light";
		header.innerHTML = this.parashat.title + ' | ' + this.parashat.hebrew;
		wrapper.appendChild(header);

		var table = document.createElement("table");
		table.className = "small";
		wrapper.appendChild(table);

		var row = document.createElement("tr");
		table.appendChild(row);

		var candlesCell = document.createElement("td");
		candlesCell.innerHTML = this.candles.title;
		row.appendChild(candlesCell);

		var row = document.createElement("tr");
		table.appendChild(row);

		var havdalahCell = document.createElement("td");
		havdalahCell.innerHTML = this.havdalah.title;
		row.appendChild(havdalahCell);

		return wrapper;
	},

	updateTimes: function() {
		var self = this;
		var url = self.makeURL();
		var retry = true;

		var timesRequest = new XMLHttpRequest();
		timesRequest.open("GET", url, true);
		timesRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processTimes(JSON.parse(this.response));
				} else {
					Log.error(self.name + ": Could not load shabbat updateTimes.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		timesRequest.send();
	},

	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this
		setTimeout(function() {
			self.updateTimes();
		}, nextLoad);
	},

	makeURL: function() {
		var c = this.config
		
		var ashkenaz = "on"
		if (!c.ashkenaz) {
			ashkenaz = "off"
		}

		var url = "http://www.hebcal.com/shabbat/?cfg=json&b=" + c.minutesBefore + "&m=" + c.minutesAfter + "&a=" + ashkenaz + "&geo=pos&latitude=" + c.latitude + "&longitude=" + c.longitude + "&tzid=" + c.tzid;
		return url
	},

	processTimes: function(data) {
		if (!data) {
			// Did not receive usable new data.
			return;
		}

		for (var time in data.items) {
			time = data.items[time];

			if (!time.hasOwnProperty("hebrew")) {
				// do nothing
			}
			else if (time.category == "parashat") {
				this.parashat = time;
			}
			else if (time.category == "candles") {
				this.candles = time;
			}
			else if (time.category == "havdalah") {
				this.havdalah = time;
			}
		}

		if (this.config.observe && this.candles.hasOwnProperty("date") && this.havdalah.hasOwnProperty("date")) {
			window.hideStart = this.candles.date;
			window.hideEnd = this.havdalah.date;
			this.startTimer();
		}

		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	startTimer: function() {
		var self = this;
	    var interval = null;
	    var now = moment();

	    if (!this.config.modulesHidden) {
	    	interval = moment.duration(now.diff(window.hideStart));
	    }
	    else {
	    	interval = moment.duration(now.diff(window.hideEnd));
	    }

	    interval = interval.asMilliseconds();
	    interval = interval - (interval + interval);
	    
	    window.shabbatTimer = setTimeout(function(){
	    	self.toggleBody();
	    }, interval);
	    
	    Log.info(this.name + " set timer to toggle modulesHidden to " + this.config.modulesHidden + " in " + interval + " milliseconds")
	},

	toggleBody: function(interval) {
		if (this.config.modulesHidden) {
			document.body.setAttribute("style", "display: block");
			this.config.modulesHidden = false;
		}
		else {
			document.body.setAttribute("style", "display: none");
			this.config.modulesHidden = true;	
		}
	}

})