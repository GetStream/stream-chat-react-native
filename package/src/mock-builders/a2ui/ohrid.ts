// The Swift assistant's "Plan a weekend in Ohrid" example: the A2UI an agent is prompted to
// write (`a2ui/prompt.json`) and the app's components it places (`UIComponents.json`).
// Kept as the shared files write them, key order included: `x-order` aside, the order is what
// the agent reads.

export const ohridLines = [
  '{"version":"1.0","createSurface":{"surfaceId":"ohrid-weekend","catalogId":"getstream.io:app-catalog","dataModel":{"pace":["relaxed"],"interests":[]}}}',
  '{"version":"1.0","updateComponents":{"surfaceId":"ohrid-weekend","components":[{"id":"root","component":"Column","children":["title","intro","map","calendar","days","tip","refine","next"]},{"id":"title","component":"Text","text":"## A weekend in Ohrid"},{"id":"intro","component":"Text","text":"Two easy days by the lake: the old town on Saturday, a boat to St. Naum on Sunday."}]}}',
  '{"version":"1.0","updateComponents":{"surfaceId":"ohrid-weekend","components":[{"id":"map","component":"TripMap","places":[{"name":"Church of St. John at Kaneo","latitude":41.1112,"longitude":20.7881},{"name":"Plaošnik","latitude":41.1131,"longitude":20.7903},{"name":"Samuel\'s Fortress, Ohrid","latitude":41.1162,"longitude":20.7928},{"name":"Monastery of Saint Naum","latitude":40.9139,"longitude":20.7406},{"name":"Bay of Bones","latitude":41.0118,"longitude":20.7988}]},{"id":"calendar","component":"CalendarCheck","start":"2026-11-14","end":"2026-11-15"}]}}',
  '{"version":"1.0","updateComponents":{"surfaceId":"ohrid-weekend","components":[{"id":"days","component":"Tabs","tabs":[{"title":"Saturday","child":"saturday"},{"title":"Sunday","child":"sunday"}]},{"id":"saturday","component":"Column","children":["saturday_plan","plaosnik","fortress","kaneo"]},{"id":"saturday_plan","component":"Text","text":"**Morning:** coffee by the harbour, then up through the old town to Plaošnik.\\n\\n**Afternoon:** Samuel\'s Fortress for the view over the lake.\\n\\n**Sunset:** St. John at Kaneo, on the cliff above the water."},{"id":"plaosnik","component":"PlaceCard","title":"Plaošnik","note":"1 hour"},{"id":"fortress","component":"PlaceCard","title":"Samuel\'s Fortress, Ohrid","note":"2 hours"},{"id":"kaneo","component":"PlaceCard","title":"Church of St. John at Kaneo","note":"Best at sunset"}]}}',
  '{"version":"1.0","updateComponents":{"surfaceId":"ohrid-weekend","components":[{"id":"sunday","component":"Column","children":["sunday_plan","naum","bones"]},{"id":"sunday_plan","component":"Text","text":"**Morning:** the boat from the harbour to St. Naum.\\n\\n**Afternoon:** the Bay of Bones on the way back."},{"id":"naum","component":"PlaceCard","title":"Monastery of Saint Naum","note":"Take the 10:00 boat"},{"id":"bones","component":"PlaceCard","title":"Bay of Bones","note":"1 hour"}]}}',
  '{"version":"1.0","updateComponents":{"surfaceId":"ohrid-weekend","components":[{"id":"tip","component":"Text","text":"> **Good to know:** book the St. Naum boat the day before. It fills up at weekends."},{"id":"refine","component":"Card","child":"refine_form"},{"id":"refine_form","component":"Column","children":["pace","interests","update"]},{"id":"pace","component":"ChoicePicker","label":"Pace","variant":"mutuallyExclusive","displayStyle":"chips","options":[{"label":"Relaxed","value":"relaxed"},{"label":"Packed","value":"packed"}],"value":{"@path":"/pace"}},{"id":"interests","component":"ChoicePicker","label":"More of","variant":"multipleSelection","displayStyle":"chips","options":[{"label":"History","value":"history"},{"label":"Food","value":"food"},{"label":"Nature","value":"nature"},{"label":"Swimming","value":"swimming"}],"value":{"@path":"/interests"}},{"id":"update","component":"Button","variant":"primary","child":"update_label","action":{"event":{"name":"update_plan","userMessage":"Update the plan","context":{"pace":{"@path":"/pace"},"interests":{"@path":"/interests"}}}}},{"id":"update_label","component":"Text","text":"Update the plan"}]}}',
  '{"version":"1.0","updateComponents":{"surfaceId":"ohrid-weekend","components":[{"id":"next","component":"Column","children":["hotel","eat","longer"]},{"id":"hotel","component":"Button","variant":"borderless","child":"hotel_label","action":{"event":{"name":"ask","userMessage":"Find a hotel by the lake"}}},{"id":"hotel_label","component":"Text","text":"Find a hotel by the lake"},{"id":"eat","component":"Button","variant":"borderless","child":"eat_label","action":{"event":{"name":"ask","userMessage":"Where should we eat?"}}},{"id":"eat_label","component":"Text","text":"Where should we eat?"},{"id":"longer","component":"Button","variant":"borderless","child":"longer_label","action":{"event":{"name":"ask","userMessage":"Make it three days"}}},{"id":"longer_label","component":"Text","text":"Make it three days"}]}}',
];

export const uiComponents = [
  {
    name: 'place_card',
    description:
      'One place of a plan, with its photo and a short summary, which the phone loads from Wikipedia, so it needs no image URL. Use one per sight, beach, monastery, village or day trip.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description:
            'The place\'s exact English Wikipedia article title, such as "Church of St. John at Kaneo"',
        },
        note: {
          type: 'string',
          description:
            'One short line about it for this plan, such as "Best at sunset" or "2 hours"',
        },
      },
      required: ['title'],
      'x-order': ['title', 'note'],
    },
    events: [
      {
        name: 'ask_about',
        description: 'Tapping the card asks you about the place.',
      },
    ],
  },
  {
    name: 'trip_map',
    description:
      'A map of a plan with a pin for each place, drawn on the phone. Use one near the top of every trip plan.',
    parameters: {
      type: 'object',
      properties: {
        places: {
          type: 'array',
          description: 'Every place of the plan, with its coordinates',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              latitude: {
                type: 'number',
              },
              longitude: {
                type: 'number',
              },
            },
            required: ['name', 'latitude', 'longitude'],
            'x-order': ['name', 'latitude', 'longitude'],
          },
        },
      },
      required: ['places'],
      'x-order': ['places'],
    },
    events: [
      {
        name: 'select_place',
        description: 'Tapping a pin asks you about that place.',
      },
    ],
  },
  {
    name: 'calendar_check',
    description:
      "The person's own calendar for the days of a plan, read on the phone. You never see it: use it whenever a plan has dates, so they can see what the trip would clash with.",
    parameters: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          format: 'date',
          description: 'The first day, as YYYY-MM-DD',
        },
        end: {
          type: 'string',
          format: 'date',
          description: 'The last day, as YYYY-MM-DD',
        },
      },
      required: ['start', 'end'],
      'x-order': ['start', 'end'],
    },
    events: [],
  },
];
