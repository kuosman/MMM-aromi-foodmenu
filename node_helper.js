/* eslint-disable prettier/prettier */
var moment = require("moment");
const request = require("request");
var NodeHelper = require("node_helper");
const { XMLParser } = require("fast-xml-parser");

module.exports = NodeHelper.create({
	updateTimer: null,

	/**
	 * Start
	 *
	 * @function start start
	 */
	start: function () {
		moment.locale(config.language || "fi");
	},

	/**
	 * Socket notification received
	 *
	 * @function socketNotificationReceived
	 * @param {string} notification notification
	 * @param {object} payload payload
	 */
	socketNotificationReceived: function (notification, payload) {
		if (notification === "GET_DATA") {
			this.fetchData(payload.url);
		}
	},

	/**
	 * Fetches data
	 *
	 * @function fetchData
	 * @param {string} url url
	 */
	fetchData(url) {
		var self = this;

		request(
			{
				url: url,
				method: "GET"
			},
			function (error, response) {
				if (!error && response.statusCode === 200) {
					const menuXML = response.body;
					const parsedMenuItems = parseMenuItemsFromXML(menuXML);

					self.sendSocketNotification("DATA_RESPONSE", {
						data: parsedMenuItems
					});
				} else {
					self.sendSocketNotification("DATA_RESPONSE", {
						data: []
					});
				}
			}
		);
	}
});

const parseMenuItemsFromXML = (feedXML) => {
    const parser = new XMLParser();

    // &nbsp; caused parse error. &amp;nbsp; encodes right in resulting html
    feedXML = feedXML.replaceAll('&nbsp;', '&amp;nbsp;');

    // Remove lounas texts
    feedXML = feedXML.replaceAll('Kasvislounas:', '');
    feedXML = feedXML.replaceAll('Lounas:', '');

    // Remove parentheses and remove text between parentheses
    feedXML = feedXML.replace(/\s*\(.*?\)\s*/g, '');

    const jObj = parser.parse(feedXML);
    const parsedNewsItems = Array.from(jObj.rss.channel.item).map(
        (itemNode) => ({
            title: itemNode.title || '',
            description: itemNode.description.split('<br><br>') || [],
        })
    );

    return parsedNewsItems;
};
