# The Cosmic Yardstick — automated Shorts

One true-scale science Short a day, made entirely in code and posted at **19:00 US Eastern**.

```
daily scheduled task (Claude, cloud)                Google Apps Script (channel's Google account, hourly)
 pick next topic from the tracker sheet               lists queue/* branches
 script → voice → scene → QA → music → outro          checks it is signed in to "The Cosmic Yardstick"
 thumbnail → tools/enqueue.py  ──── queue/<ID> ────▶  uploads + schedules, sets thumbnail, Drive backup
 writes the row in the tracker sheet                  fills in the sheet row, keeps views/likes fresh
```

- **GUIDE.md** — how a Short is made (length, hook, look, sound, QA, packaging). The daily job follows it.
- **engine/kit** — the Scale Zoom drawing kit (canvas), fonts and page template. **engine/examples** — reference scenes.
- **engine/outro** + **assets/outro.mp4** — the 1.8 s channel outro, made once (`tools/make_outro.sh` rebuilds it).
- **tools/** — `setup.sh`, `new_short.sh`, `voice.py`, `render.mjs`, `mix.py`, `finish.sh`, `enqueue.py`.
- **youtube-uploader/** — the uploader (`Code.gs`, `appsscript.json`) and **SETUP.md**.
- **topics.json** — the starting topic list (the live list is the *Topics* tab of "The Cosmic Yardstick – Tracker").
- **upload-results/** — one JSON per uploaded Short, written by the uploader.

Tracker sheet: https://docs.google.com/spreadsheets/d/1OSPZ9HufP6M_ywcPMcsD5NPjmat4es9M2YAo-6oenR0
