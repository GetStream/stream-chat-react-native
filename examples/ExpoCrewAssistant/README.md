# Crew assistant (Expo)

An AI assistant for a restaurant's team members, built on the AI components and the Vision-Agents
router. A team member opens it before, during or after a shift. The home screen lists what it
helps with, and each flow starts a conversation with the agent: `AIConversation` for the chat,
A2UI for checklists, quizzes and forms, and the phone's own tools for the restaurant's systems.

The backend is `examples/voice_agents/crew_assistant` in Vision-Agents, forked from
`swift_assistant`. It mints Stream tokens, stands in for the restaurant's schedule, handbook,
equipment and leaders' inbox, and makes the agent speak first when something happens, such as a
clock-in.

## What it shows

| Flow                   | How it starts                 | What to look at                                                                                                                                                     |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clock in**           | the agent speaks first        | A fit-check checklist and the focus for the shift, as interactive UI. Tick the boxes and tap "I'm ready".                                                           |
| **Call out sick**      | a question                    | Schedule and call-out policy as tool steps. With a cold it offers cover, the swap asks you first, and the shift leader gets a note. With a fever it says stay home. |
| **Ask the handbook**   | a question                    | The answer comes from `search_handbook`, and the passages show as **Sources** under the reply.                                                                      |
| **Equipment problem**  | a question, a photo or a scan | The quick fix for the asset and code. "Still broken" drafts a repair ticket, which asks you first. Send a photo with "+" to have it look first.                     |
| **Back from time off** | the agent speaks first        | What you missed since your time off started, grouped.                                                                                                               |
| **I'm new here**       | the agent speaks first        | Who's who, a menu quiz as interactive UI, and booking a check-in with the trainer.                                                                                  |
| **Interview practice** | a question                    | A mock shift leader interview, one question at a time, with feedback. Try it in voice mode (the button beside the composer).                                        |
| **Clock out**          | the agent speaks first        | An end-of-shift reflection form. What it saves shows in the team lead view, without your name.                                                                      |

**Team lead** (top right) is what the shift leaders and the owner see: call-out notes, swap
requests, drafted tickets, booked check-ins and the team's pulse from reflections. It refreshes
every few seconds, so keep it open next to a flow.

**Scanning a machine.** A QR code on a machine holds a link such as
`crewassistant://equipment?asset=FRY-02&code=E-41`. Opening it starts a conversation about that
machine. On an emulator, open it with:

```bash
adb shell am start -a android.intent.action.VIEW -d "crewassistant://equipment?asset=FRY-02\&code=E-41"
```

Known assets and codes: `FRY-02` (`E-41`, `E-07`), `POS-1` (`E-NET`), `ICE-1` (`BIN`).

## Run it

1. Run the router as in Vision-Agents' `swift_demo` README, then store the agent and start its
   backend:

   ```bash
   cd examples/voice_agents/crew_assistant/configure
   STREAM_ACCELERATION_URL=http://localhost:8080 STREAM_ACCELERATION_CUSTOMER_ID=examples GOWORK=off go run . -dir ..
   cd ../backend
   STREAM_API_SECRET=<the router's> STREAM_ACCELERATION_URL=http://localhost:8080 STREAM_ACCELERATION_CUSTOMER_ID=examples GOWORK=off go run .
   ```

2. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_STREAM_API_KEY` to the router's
   Stream app.

3. Build and run the app:

   ```bash
   yarn install
   cd examples/ExpoCrewAssistant
   npx expo prebuild
   yarn android   # or yarn ios
   ```

   On an Android emulator, `adb reverse tcp:8080 tcp:8080 && adb reverse tcp:8097 tcp:8097` lets
   the app reach the router and the backend on `localhost`.

## How it's built

- `contexts/AppContext.tsx` opens conversations: new ones, ones from the drawer, ones that start
  with a question (`startConversationWith`), and ones the agent opens about an event
  (`startConversationAbout`), which asks the backend's `POST /events`.
- `agent/crewTools.ts` declares the tools the phone runs for the agent. Each reads or writes the
  backend. `request_shift_swap`, `create_support_ticket` and `book_check_in` ask first, with the
  AI components' approval card.
- `search_handbook` answers `{"status": "answered", "citations": [...]}`, which the router adds to
  the reply's `support_message.sources`. `screens/ChatContent.tsx` shows them under the reply.
- `app/leader.tsx` is the team lead view, and `app/equipment.tsx` the scanned-code link.

**Your calendar.** Booking a check-in ("Book a check-in with Priya on Thursday afternoon when I'm
free") first reads your own Cal.com. The first time, the reply asks you to **Connect Cal.com**, the
same sign-in the AI components show for any connector: Connect opens Cal.com's sign-in, and the
booking carries on once you're connected. Not now books the time you asked for without it.

Not here yet: voice memos (dictation and voice mode work), and approvals answered by someone
other than the person chatting.
