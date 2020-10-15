Wrapper around [i18next](https://www.i18next.com/) class for Stream related translations.

### API

- **constructor**(options)

  Constructor accepts following options:

  - **language** (String) default: 'en'

    Language code e.g., en, tr

  - **disableDateTimeTranslations** (boolean) default: false

    Disable translations for datetimes

  - **debug** (boolean) default: false

    Enable debug mode in internal i18n class

  - **logger** (function) default: () => {}

    Logger function to log warnings/errors from this class

  - **dayjsLocaleConfigForLanguage** (object) default: 'enConfig'

    [Config object](https://github.com/iamkun/dayjs/tree/dev/src/locale) for internal dayjs object, corresponding to language (param)

  - **DateTimeParser** (function)

    Moment or Dayjs instance/function.

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
  const { t, tDateTimeParser } = await streami18n.getTranslators();
  ```

- **registerTranslation**

  _params_

  - language | string
  - translator | object
  - customDayjsLocale | object (optional)

  ```js static
    streami18n.registerTranslation(
      'mr',
      {
        'Nothing yet...': 'काहीही नाही  ...',
        '{{ firstUser }} and {{ secondUser }} are typing...':
            '{{ firstUser }} आणि {{ secondUser }} टीपी करत आहेत ',
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

  We have exported all the in-built translations in our library. You can import them in your project as following:

  ```js static
  import {
    enTranslations,
    nlTranslations,
    ruTranslations,
    trTranslations,
    frTranslations,
    hiTranslations,
    itTranslations,
    esTranslations,
  } from 'stream-chat-react-native'; // or 'stream-chat-expo'
  ```

  If you would like to maintain your own translation files:

  1. Create a json file in your project with whatever name you prefer. Best practice would be to name it after
     the language-translations it contains e.g, If you are creating a translation file for Korean language then `ko.json`
  2. Copy the content of file https://github.com/GetStream/stream-chat-react/blob/master/src/i18n/en.json
  3. Change the values of the keys as translation of key.
  4. Use it in chat client:

  ```js static
  import koTranslation from 'path/to/ko.json';
  import deTranslation from 'path/to/de.json';
  const i18n = new Streami18n();
  i18n.registerTranslation('ko', koTranslation);
  i18n.registerTranslation('de', deTranslation);
  // You can switch language at any point in lifetime of component, it will automatically reflect in UI.
  i18n.setLanguage('ko');
  <Chat client={chatClient} i18nInstance={i18n}>
    ...
  </Chat>;
  ```

## Datetime translations

Stream react chat components uses [dayjs](https://day.js.org/en/) internally by default to format datetime stamp.
e.g., in ChannelPreview, MessageContent components.
Dayjs has locale support as well - https://day.js.org/docs/en/i18n/i18n
Dayjs is a lightweight alternative to Momentjs with the same modern API.

Dayjs provides locale config for plenty of languages, you can check the whole list of locale configs at following url
https://github.com/iamkun/dayjs/tree/dev/src/locale

You can either provide the dayjs locale config while registering
language with Streami18n (either via constructor or registerTranslation()) OR you can provide your own Dayjs or Moment instance
to Streami18n constructor, which will be then used internally (using the language locale) in components.

### Via language registration

e.g.,

```js static
const i18n = new Streami18n({
 language: 'nl',
 dayjsLocaleConfigForLanguage: {
   months: [...],
   monthsShort: [...],
   calendar: {
     sameDay: ...'
   }
 }
});
```

Similarly, you can add locale config for dayjs while registering translation via `registerTranslation` function.

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
     sameDay: ...'
   }
 }
);
```

### Provide your own Moment object

```js static
import 'moment/locale/nl';
import 'moment/locale/it';
// or if you want to include all locales
import 'moment/min/locales';

import Moment from moment

const i18n = new Streami18n({
 language: 'nl',
 DateTimeParser: Moment
})
```

### Provide your own Dayjs object

```js static
import Dayjs from 'dayjs';

import 'dayjs/locale/nl';
import 'dayjs/locale/it';

const i18n = new Streami18n({
  language: 'nl',
  DateTimeParser: Dayjs,
});
```

If you would like to stick with english language for datetimes in Stream components, you can set `disableDateTimeTranslations` to true.

**NOTE** Please note here that locales in `dayjs/locale/it` (and all other language locale files), does not load calendar related
config like 'today at', 'tomorrow at' etc. You will need to manually configure calendar locale using [updateLocale](https://day.js.org/docs/en/plugin/update-locale).

**TIPS**

1. If you would like to stick with english language for datetimes in Stream components,
   you can set `disableDateTimeTranslations` to true.

```js static
const i18n = new Streami18n({
  language: 'nl',
  disableDateTimeTranslations: false,
});
```

2. If you want to disable all the warnings, you can override logger option:

```js static
const i18n = new Streami18n({
  language: 'nl',
  logger: () => null,
});
```

The default `en` locale config from dayjs is as follow:

```json static
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
  "formats": {
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
