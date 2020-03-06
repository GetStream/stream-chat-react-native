Wrapper around [i18next](https://www.i18next.com/) class for Stream related translations.

### API

- **constructor**(options)

  Contructor accepts following options:

  - **language** (String) default: 'en'

    Language code e.g., en, tr

  - **disableDateTimeTranslations** (boolean) default: false

    Disable translations for datetimes

  - **debug** (boolean) default: false

    Enable debug mode in internal i18n class

  - **logger** (function) default: () => {}

    Logger function to log warnings/errors from this class

  - **momentLocaleConfigForLanguage** (object) default: 'enConfig'

    [Config object](https://momentjs.com/docs/#/i18n/changing-locale/) for internal moment object, corresponding to language (param)

- **geti18Instance**

  Returns an instance of [i18next](https://www.i18next.com/) used internally.

- **getAvailableLanguages**

  Returns all the languages (code) registered with Streami18n

- **getTranslations**

  Returns all the translations registered with Streami18n

- **getTranslators**

  Returns an object containing t (i18next translator) and momentjs instance (configured with set language)

  ```js static
  const streami18n = new Streami18n({ language: 'nl' });
  const { t, moment } = await streami18n.getTranslators();
  ```

- **registerTranslation**

  _params_

  - language | string
  - translator | object
  - customMomentLocale | object (optional)

  ```js static
  streami18n.registerTranslation('mr', {
  'Nothing yet...': 'काहीही नाही  ...',
  '{{ firstUser }} and {{ secondUser }} are typing...':
      '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
  }, {
  months: [...],
  monthsShort: [...],
  calendar: {
      sameDay: '...'
  }
  });
  ```

- **setLanguage**

  Set a different language

  ```js static
  streami18n.setLanguage('tr');
  ```

Instance of this class should be provided to Chat component to handle translations.
Stream provides following list of in-built translations:

1. English (en)
2. Dutch (nl)
3. Russian (ru)
4. Turkish (tr)
5. French (fr)
6. Italian (it)
7. Hindi (hi)

### Docs

- **Text translations**

  Simplest way to start using chat components in one of the in-built languages would be following:

  ```js static
  const i18n = new Streami18n({ language: 'nl' });
  <Chat client={chatClient} i18nInstance={i18n}>
    ...
  </Chat>;
  ```

  If you would like to override certain keys in in-built translation.
  UI will be automatically updated in this case.

  ```js static
  const i18n = new Streami18n({
    language: 'nl',
    translationsForLanguage: {
      'Nothing yet...': 'Nog Niet ...',
      '{{ firstUser }} and {{ secondUser }} are typing...':
        '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
    },
  });
  ```

  If you would like to register additional languages, use registerTranslation. You can add as many languages as you want:

  ```js static
  i18n.registerTranslation('zh', {
    'Nothing yet...': 'Nog Niet ...',
    '{{ firstUser }} and {{ secondUser }} are typing...':
      '{{ firstUser }} en {{ secondUser }} zijn aan het typen...',
  });

  <Chat client={chatClient} i18nInstance={i18n}>
    ...
  </Chat>;
  ```

  You can use the same function to add whole new language as well.

  ```js static
  const i18n = new Streami18n();

  i18n.registerTranslation('mr', {
    'Nothing yet...': 'काहीही नाही  ...',
    '{{ firstUser }} and {{ secondUser }} are typing...':
      '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
  });

  // Make sure to call setLanguage to reflect new language in UI.
  i18n.setLanguage('it');
  <Chat client={chatClient} i18nInstance={i18n}>
    ...
  </Chat>;
  ```

- **Datetime translations**

  Stream components uses [momentjs](http://momentjs.com/) internally to format datetime stamp.
  e.g., in ChannelPreview, MessageContent components.

  When you use any of the built-in translations, datetime will also be translated in corresponding langauge
  by default. If you would like to stick with english language for datetimes, you can set `disableDateTimeTranslations` to true.

  You can override the locale config for momentjs.

  e.g.,

  ```js static
  const i18n = new Streami18n({
    language: 'nl',
    momentLocaleConfigForLanguage: {
      months: [...],
      monthsShort: [...],
      calendar: {
        sameDay: '...'
      }
    }
  });
  ```

  The default `en` locale config from moment is as follow:

  ```json
  {
    "months": [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    "monthsShort": [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    "week": {
      "dow": 0,
      "doy": 6
    },
    "weekdays": [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ],
    "weekdaysMin": ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    "weekdaysShort": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "calendar": {
      "sameDay": "[Today at] LT",
      "nextDay": "[Tomorrow at] LT",
      "nextWeek": "dddd [at] LT",
      "lastDay": "[Yesterday at] LT",
      "lastWeek": "[Last] dddd [at] LT",
      "sameElse": "L"
    },
    "longDateFormat": {
      "LTS": "h:mm:ss A",
      "LT": "h:mm A",
      "L": "MM/DD/YYYY",
      "LL": "MMMM D, YYYY",
      "LLL": "MMMM D, YYYY h:mm A",
      "LLLL": "dddd, MMMM D, YYYY h:mm A"
    },
    "invalidDate": "Invalid date",
    "ordinal": "%d.",
    "dayOfMonthOrdinalParse": /\\d{1,2}(th|st|nd|rd)/,
    "relativeTime": {
      "future": "in %s",
      "past": "%s ago",
      "s": "a few seconds",
      "ss": "%d seconds",
      "m": "a minute",
      "mm": "%d minutes",
      "h": "an hour",
      "hh": "%d hours",
      "d": "a day",
      "dd": "%d days",
      "M": "a month",
      "MM": "%d months",
      "y": "a year",
      "yy": "%d years"
    },
    "meridiemParse": /[ap]\\.?m?\\.?/i,
    "abbr": "en"
  }
  ```

  Similarly, you can add locale config for moment while registering translation via `registerTranslation` function.

  e.g.,

  ```js static
  const i18n = new Streami18n();

  i18n.registerTranslation(
  'mr',
  {
    'Nothing yet...': 'काहीही नाही  ...',
    '{{ firstUser }} and {{ secondUser }} are typing...': '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
  },
  {
    months: [...],
    monthsShort: [...],
    calendar: {
      sameDay: '...'
    }
  }
  );
  ```

  Momentjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url

  https://github.com/moment/moment/tree/develop/locale

  Stream uses locale configs provided by momentjs for built-in languages. You can also use one of these locale configs whiles registering
  a new language. If you would liek to use the locale provided by momentjs as it is, simply import the file in your project.

  e.g.,

  ```js static

    // Registering locale config for Danish language
    import 'moment/locale/da';

    const i18n = new Streami18n({
      language: 'da',
      translationsForLanguage: {
        ...
      },
    });
  ```