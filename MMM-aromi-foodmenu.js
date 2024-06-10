/* global Module */

/*
 * Magic Mirror
 * Module: MMM-aromi-foodmenu
 *
 *
 *  By Marko Kuosmanen http://github.com/kuosman
 *  MIT Licenced.
 */
Module.register('MMM-aromi-foodmenu', {
    // Default module config.
    defaults: {
        url: 'https://aromimenu.cgisaas.fi/VantaaAromieMenus/FI/Default/Vantti/VierumakiKO/Rss.aspx?Id=9594d033-482f-4f9d-b369-307fa37223db&DateMode=1',
        updateInterval: 60 * 1000 * 60, // every hour
    },

    menuData: null,
    updateTimer: null,
    hasMenuItems: false,

    /**
     * Gets styles
     *
     * @function getStyles
     * @returns {Array} styles array
     */
    getStyles: function () {
        return [this.file('css/styles.css')];
    },

    /**
     * Gets translations
     * @function getTranslations
     * @returns {Object} translation object
     */
    getTranslations: function () {
        return {
            en: 'translations/en.json',
            fi: 'translations/fi.json',
        };
    },

    /**
     * Gets dom
     *
     * @function getDom
     * @returns {object} html wrapper
     */
    getDom: function () {
        const self = this;
        var wrapper = document.createElement('div');


        if (self.menuData === null) {
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = 'aromi-foodmenu row dimmed light small';
            return wrapper;
        }

        if (self.menuData.length === 0 && !self.hasMenuItems) {
            wrapper.innerHTML = '-';
            wrapper.className = 'aromi-foodmenu row dimmed light small';
            return wrapper;
        }
        wrapper.className = 'aromi-foodmenu row light small';

        self.menuData.forEach((menu) => {
            const date = `<div class="date bright">${menu.title.toUpperCase()}</div>`;
            const descriptionVegan = `<div class="description vegan">${menu.description[0]}</div>`;
            const description = `<div class="description">${menu.description[1]}</div>`;
            const noDescription = `<div class="no-description">-</div>`;

            var menuHTML = document.createElement('div');
            menuHTML.className = 'menu';
            if (
                menu.description[0] === menu.description[1] &&
                menu.description[1]
            ) {
                menuHTML.innerHTML = date + description;
            } else if (menu.description[0] && menu.description[1]) {
                menuHTML.innerHTML = date + descriptionVegan + description;
            } else {
                menuHTML.innerHTML = date + noDescription;
            }

            wrapper.appendChild(menuHTML);
        });
        return wrapper;
    },

    /**
     * Schedule next fetch
     *
     * @function scheduleNextFetch
     */
    scheduleNextFetch: function () {
        var self = this;
        if (self.menuData === null) {
            self.sendSocketNotification('GET_DATA', self.config);
        } else {
            clearTimeout(self.updateTimer);
            const delay =
                self.config.updateInterval < 1000 * 60
                    ? 1000 * 60
                    : self.config.updateInterval;
            self.updateTimer = setTimeout(function () {
                self.sendSocketNotification('GET_DATA', self.config);
            }, delay);
        }
    },

    /**
     * Notification received
     *
     * @function  notificationReceived
     * @param {string} notification notification
     */
    notificationReceived: function (notification) {
        if (notification === 'DOM_OBJECTS_CREATED') {
            this.scheduleNextFetch();
        }
    },

    /**
     * Socket notification received
     *
     * @function socketNotificationReceived
     * @param {string} notification notification message
     * @param {object} payload payload
     */
    socketNotificationReceived: function (notification, payload) {
        switch (notification) {
            case 'DATA_RESPONSE':
                this.scheduleNextFetch();
                this.menuData = payload.data;
                this.hasMenuItems = payload.hasMenuItems;
                this.updateDom();
                break;
        }
    },
});
