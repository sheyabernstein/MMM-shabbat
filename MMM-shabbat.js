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

        updateInterval: 60 * 60 * 1000, // every hour
        animationSpeed: 1000,

        retryDelay: 2500,
        initialLoadDelay: 0,

        modulesHidden: false, // don't change
    },

    // Define required scripts.
    getScrips: function() {
        return ["moment.min.js"];
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        this.parashat = null;
        this.candles = null;
        this.havdalah = null;
        this.other = null;

        this.loaded = false;
        this.scheduleUpdate(this.config.initialLoadDelay);
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        var requiredConfigs = ["latitude", "longitude", "tzid"]

        for (var i in requiredConfigs) {
        	req = requiredConfigs[i]
        	if (this.config[req] === "") {
        		wrapper.innerHTML = "Please set the correct <i>" + req + "</i> in the config for module " + this.name + ".";
            	wrapper.className = "dimmed light small";
            	return wrapper;
        	}
        }

        if (!this.loaded) {
            wrapper.innerHTML = this.translate("LOADING");
            wrapper.className = "dimmed light";
            return wrapper;
        }

        var header = document.createElement("div");
        header.className = "small bright";
        header.innerHTML = this.parashat.title + ' | ' + this.parashat.hebrew;
        wrapper.appendChild(header);

        var table = document.createElement("table");
        table.className = "small";
        wrapper.appendChild(table);

        var otherText = null;
        var candlesText = "שבת שלום";
        var havdalahText = "שבוע טוב";

        if (this.other) {
        	otherText = this.other.title;
        }

        if (this.candles) {
        	candlesText = this.candles.title;
            havdalahText = null;
            if (otherText) {
            	candlesText = "Shabbos c" + candlesText.substring(1);
            }
        }

        if (this.havdalah) {
            havdalahText = this.havdalah.title;
        }


        if (!this.candles && this.havdalah) {
            havdalahText = null;
        }

        if (!this.candles && !this.havdalah) {
            candlesText = null;
            havdalahText = null;
        }

        var times = [otherText, candlesText, havdalahText]
        for (var time in times) {
            text = times[time]

            if (text) {
                var row = document.createElement("tr");
                table.appendChild(row);

                var cell = document.createElement("td");
                cell.innerHTML = text;
                row.appendChild(cell);
            }
        }

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

        console.log(data)
        var other = []

        for (var time in data.items) {
            time = data.items[time];

            if (!time.hasOwnProperty("hebrew")) {
                // do nothing
            } else if (time.category == "parashat") {
                this.parashat = time;
            } else if (time.category == "candles") {
                this.candles = time;
            } else if (time.category == "havdalah") {
                this.havdalah = time;
            } else {
            	if (time.hasOwnProperty("date")) {
            		if (this.other && this.other.hasOwnProperty("date")) {
            			if (time.date < this.other.date) {
            				this.other = time
            			}
            		}
            		else {
            			this.other = time;
            		}
            	}
            }
        }

        if (this.config.observe && (this.candles || this.havdalah)) {

            if (this.candles && this.candles.hasOwnProperty("date")) {
                this.startTimer(this.candles.date, true)
            } else if (this.havdalah && this.havdalah.hasOwnProperty("date")) {
                this.startTimer(this.havdalah.date, false)
            }
        }

        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
    },

    startTimer: function(zeroHour, hide) {
        var self = this;
        var interval = moment.duration(moment().diff(zeroHour)).asMilliseconds();
        interval = interval - (interval + interval);

        Log.info(this.name + " set timer to toggle modulesHidden to " + this.config.modulesHidden + " in " + moment.duration(interval).humanize())

        window.shabbatTimer = setTimeout(function() {
            self.toggleModules(hide);
        }, interval);
    },

    toggleModules: function(hide) {
        var display = "block";

        if (hide == true) {
            display = "none";
        }

        this.config.modulesHidden = hide;

        document.querySelectorAll('.module').forEach(function(elem) {
            if (!elem.classList.contains("shabbat-friendly")) {
                elem.style.display = display;
            }
        });
    }
})