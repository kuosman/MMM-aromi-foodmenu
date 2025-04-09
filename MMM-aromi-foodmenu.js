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
        large: false,
    },

    menuData: null,
    updateTimer: null,
    hasMenuItems: false,
    identifier: Date.now(),

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
            const description = document.createElement('div');
            description.className = 'description';
            //`<div class="description"></div>`;
            const noDescription = `<div class="no-description">-</div>`;

            var menuHTML = document.createElement('div');
            menuHTML.className = self.config.large ? 'menu large' : 'menu';
            if (menu.description.length > 0) {
                menu.description.forEach((d) => {
                    const desc = document.createElement('div');
                    desc.innerHTML = d;
                    description.appendChild(desc);
                });
                menuHTML.innerHTML = date + description.innerHTML;
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
            self.sendSocketNotification('MMM_AROMI_FOODMENU_GET_DATA', {
                config: self.config,
                identifier: self.identifier,
            });
        } else {
            clearTimeout(self.updateTimer);
            const delay =
                self.config.updateInterval < 1000 * 60
                    ? 1000 * 60
                    : self.config.updateInterval;
            self.updateTimer = setTimeout(function () {
                self.sendSocketNotification('MMM_AROMI_FOODMENU_GET_DATA', {
                    config: self.config,
                    identifier: self.identifier,
                });
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
        var self = this;
        switch (notification) {
            case 'MMM_AROMI_FOODMENU_DATA_RESPONSE':
                if (payload.identifier === self.identifier) {
                    self.scheduleNextFetch();
                    self.menuData = payload.data;
                    self.hasMenuItems = payload.hasMenuItems;
                    self.updateDom();
                    break;
                }
        }
    },
});
