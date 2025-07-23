const i18n = require('i18n');
const path = require('path');

i18n.configure({
    locales: ['en', 'hi'],
    directory: path.join(__dirname, '../language'),
    defaultLocale: process.env.DEFAULT_LANGUAGE || 'en',
    objectNotation: true,
    updateFiles: false,
    autoReload: true
});

module.exports = (locale) => {
    return {
        t: (phrase, ...replace) => {
            i18n.setLocale(locale);
            return i18n.__(phrase, ...replace);
        },
        changeLanguage: (newLocale) => {
            i18n.setLocale(newLocale);
        }
    };
};