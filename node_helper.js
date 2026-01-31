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
        moment.locale(config.language || 'fi');
    },

    /**
     * Socket notification received
     *
     * @function socketNotificationReceived
     * @param {string} notification notification
     * @param {object} payload payload
     */
    socketNotificationReceived: function (notification, payload) {
        if (notification === 'MMM_AROMI_FOODMENU_GET_DATA') {
            this.fetchData(payload.config.url, payload.config.nextWeekUrl, payload.identifier);
        }
    },

    /**
     * Fetches data
     *
     * @function fetchData
     * @param {string} url url
     * @param {string} nextWeekUrl next week url
     * @param {string} identifier identifier
     */
    fetchData(url, nextWeekUrl, identifier) {
        var self = this;

        const now = moment().tz("Europe/Helsinki");

        const isWeekend = now.day() === 0 || now.day() === 6;
        const isFridayAfter15 = now.day() === 5 && now.hour() >= 15;

        const isNextWeek = isWeekend || isFridayAfter15;

        const rssUrl = isNextWeek && nextWeekUrl ? nextWeekUrl : url;

        request(
            {
                url: rssUrl,
                method: 'GET',
            },
            function (error, response) {
                if (!error && response.statusCode === 200) {
                    const menuXML = response.body;
                    self.sendSocketNotification('MMM_AROMI_FOODMENU_DATA_RESPONSE', {
                        data: hasMenuItems(menuXML)
                            ? parseMenuItemsFromXML(menuXML)
                            : [],
                        hasMenuItems: hasMenuItems(menuXML),
                        identifier: identifier,
                    });
                } else {
                    self.sendSocketNotification(
                        'MMM_AROMI_FOODMENU_DATA_RESPONSE',
                        {
                            data: [],
                            hasMenuItems: false,
                            identifier: identifier,
                        }
                    );
                }
            }
        );
    },
});

const hasMenuItems = (feedXML) => {
    const parser = new XMLParser();
    const jObj = parser.parse(feedXML);

    try {
        Array.from(jObj.rss.channel.item);
        return true;
    } catch (err) {
        return false;
    }
};

const parseMenuItemsFromXML = (feedXML) => {
    const parser = new XMLParser();

    // &nbsp; caused parse error. &amp;nbsp; encodes right in resulting html
    feedXML = feedXML.replaceAll('&nbsp;', '&amp;nbsp;');

    feedXML = feedXML.replaceAll(':', ': ');

    // Remove lounas texts
    //feedXML = feedXML.replaceAll('Kasvislounas:', '');
    //feedXML = feedXML.replaceAll('Lounas:', '');

    // Remove parentheses and remove text between parentheses
    feedXML = feedXML.replace(/\s*\(.*?\)\s*/g, '');

    const jObj = parser.parse(feedXML);
    let parsedNewsItems = [];
    if (Array.isArray(jObj.rss.channel.item)) {
        parsedNewsItems = Array.from(jObj.rss.channel.item).map(
            (itemNode) => ({
                title: itemNode.title || '',
                description: itemNode.description.split('<br><br>') || [],
            })
        );
    } else {
        parsedNewsItems = [{
            title: jObj.rss.channel.item.title || '',
            description: jObj.rss.channel.item.description.split('<br><br>') || [],
        }];
    }

    return parsedNewsItems;
};
