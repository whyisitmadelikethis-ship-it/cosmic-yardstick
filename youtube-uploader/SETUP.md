# Uploader setup (one time, about 15 minutes)

Do everything below **signed in to the Google account that owns The Cosmic Yardstick** (the new email),
except step 1b and step 4.

## 1. Prepare
a. **Rename the channel** on YouTube to exactly **The Cosmic Yardstick**. The uploader refuses any other channel name.
b. From the **whyisitmadelikethis** account, open the sheet **"The Cosmic Yardstick – Tracker"** → Share → add the **new email** as **Editor**.
c. Optional but recommended: verify the channel at <https://www.youtube.com/verify> (phone). YouTube only accepts custom thumbnails on verified channels.

## 2. Create the uploader script
a. Go to <https://script.google.com> → **New project**. Name it **Cosmic Yardstick Uploader**.
b. Replace everything in `Code.gs` with the contents of `youtube-uploader/Code.gs` from the repo.
c. ⚙ **Project Settings** → tick **Show "appsscript.json" manifest file in editor**. Open `appsscript.json` and replace it with the repo's `youtube-uploader/appsscript.json`. **Save** (Ctrl/Cmd + S).
d. In the function menu at the top choose **showRedirectUri** → **Run** (allow the permissions it asks for). Copy the link it prints in the log
   (it looks like `https://script.google.com/macros/d/…/usercallback`).

## 3. Create the YouTube login key (Google Cloud, free)
a. Open <https://console.cloud.google.com> → project menu at the top → **New project** → name **cosmic-yardstick-uploader** → Create, and select it.
b. **APIs & Services → Library** → search **YouTube Data API v3** → **Enable**.
c. **Google Auth Platform** (or "OAuth consent screen") → **Get started**: App name **Cosmic Yardstick Uploader**, your email as support and contact email,
   Audience **External** → Create.
d. **Clients → Create client** → Application type **Web application** → under **Authorized redirect URIs** add the link from step 2d → **Create**.
   Copy the **Client ID** and **Client secret**.
e. **Audience** → **Publish app** → Confirm (status becomes **In production**). This matters: in "Testing" Google logs the uploader out every 7 days.
   You do not need to submit it for verification — it's your private app.

## 4. Create the GitHub key (repo-only)
a. On GitHub (whyisitmadelikethis-ship-it account): <https://github.com/settings/personal-access-tokens/new> (Fine-grained token).
b. Name **cosmic-yardstick-uploader**, Expiration **1 year** (put a reminder in your calendar), Resource owner **whyisitmadelikethis-ship-it**.
c. Repository access → **Only select repositories** → **cosmic-yardstick**.
d. Permissions → Repository permissions → **Contents: Read and write**. → **Generate token** and copy it.

## 5. Put the three keys in the script
Apps Script → ⚙ **Project Settings** → **Script Properties** → Add:

| Property | Value |
|---|---|
| `CLIENT_ID` | from step 3d |
| `CLIENT_SECRET` | from step 3d |
| `GITHUB_TOKEN` | from step 4d |

Save.

## 6. Connect the channel
a. Choose **connectYouTube** → **Run**. Open the link it prints in the log.
b. Sign in, and when Google asks **"Choose an account or brand account"**, pick **The Cosmic Yardstick**.
c. Google shows **"Google hasn't verified this app"** → **Advanced** → **Go to Cosmic Yardstick Uploader (unsafe)** → **Continue** / **Allow**.
   (It's your own app, so this warning is expected.)
d. The page should say **Connected ✔ — Uploads will go to "The Cosmic Yardstick"**. If it says *Wrong channel*, run connectYouTube again and pick the other one.

## 7. Start it
Choose **setup** → **Run**. The log should show **GitHub OK**, **YouTube OK: "The Cosmic Yardstick"**, the Drive folder, **Google Sheet OK**
and **Hourly timer created**. Done — from now on it checks the queue every hour.

## Handy functions
- **showQueue** — what is waiting to upload.
- **processQueue** — run the hourly job now.
- **syncStats** — refresh views/likes/comments in the sheet now.
- **disconnectYouTube** — forget the YouTube login (then connectYouTube again).

## Safety
Before every upload the script checks that it is signed in to the connected channel **and** that the channel is still called
"The Cosmic Yardstick". If either check fails it uploads nothing and writes **upload blocked** in the sheet.
