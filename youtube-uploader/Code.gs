/**
 * The Cosmic Yardstick — YouTube auto-uploader (no Zapier, no Mac).
 *
 * Runs on Google's servers as a Google Apps Script in the channel's own Google account. Every hour it:
 *   1. lists GitHub branches named queue/<ID> in whyisitmadelikethis-ship-it/cosmic-yardstick
 *      (each one is pushed by the daily generation job and holds meta.json + the .mp4 + the thumbnail),
 *   2. CHECKS that it is signed in to the channel "The Cosmic Yardstick" (stops and uploads nothing otherwise),
 *   3. uploads the video, scheduled for its slot (17:30 IST; the next free day if that has passed),
 *   4. sets the thumbnail, keeps a backup copy of both files in Google Drive,
 *   5. fills in the video's row in the tracker sheet, writes upload-results/<ID>.json on main, deletes the branch,
 *   6. refreshes views / likes / comments / status for every video in the sheet.
 *
 * It signs in to YouTube with its OWN login (OAuth client from your Google Cloud project), so that when you
 * connect you can pick the right channel even though this Google account has two channels.
 * One-time setup: see SETUP.md.
 */

const CFG = {
  REPO: 'whyisitmadelikethis-ship-it/cosmic-yardstick',
  MAIN: 'main',
  QUEUE_PREFIX: 'queue/',
  RESULTS_DIR: 'upload-results',
  CHANNEL_TITLE: 'The Cosmic Yardstick',       // the only channel this script will ever upload to
  POST_TIME_IST: '17:30',                       // daily post time, India (07:00 US Eastern in winter, 08:00 in summer)
  MIN_LEAD_MINUTES: 30,
  MAX_ATTEMPTS: 3,
  TIME_BUDGET_MS: 4.5 * 60 * 1000,
  BACKUP_FOLDER_NAME: 'The Cosmic Yardstick — YouTube uploads',
  SHEET_ID: '1OSPZ9HufP6M_ywcPMcsD5NPjmat4es9M2YAo-6oenR0',   // "The Cosmic Yardstick – Tracker" (shared with this account)
  SHEET_TAB: 'Videos',
  SCOPES: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
};
// Videos tab columns (1-based)
const COL = { ID: 1, STATUS: 2, TOPIC: 3, TITLE: 4, ET: 5, IST: 6, LEN: 7, LINK: 8, VID: 9, VIEWS: 10, LIKES: 11, COMMENTS: 12, QUEUED: 13, UPLOADED: 14, DRIVE: 15, NOTES: 16 };

const PROPS = PropertiesService.getScriptProperties();

/* ------------------------------------------------------------------ */
/* 1. Connect YouTube (run once)                                       */
/* ------------------------------------------------------------------ */

/** Step 1 of connecting: run it, then open the link it prints in the log and choose "The Cosmic Yardstick". */
function connectYouTube() {
  const id = PROPS.getProperty('CLIENT_ID'), secret = PROPS.getProperty('CLIENT_SECRET');
  if (!id || !secret) throw new Error('Add CLIENT_ID and CLIENT_SECRET in Project Settings → Script Properties first (SETUP.md step 3).');
  const state = ScriptApp.newStateToken().withMethod('authCallback').withTimeout(3600).createToken();
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + [
    'client_id=' + encodeURIComponent(id),
    'redirect_uri=' + encodeURIComponent(redirectUri_()),
    'response_type=code',
    'scope=' + encodeURIComponent(CFG.SCOPES),
    'access_type=offline',
    'prompt=' + encodeURIComponent('consent select_account'),
    'state=' + state,
  ].join('&');
  Logger.log('Open this link, sign in, and when Google asks "Choose an account or brand account", pick "' + CFG.CHANNEL_TITLE + '":\n\n' + url);
}

/** Google sends you back here after you approve. Saves the login only if it is the right channel. */
function authCallback(request) {
  try {
    const code = request.parameter.code;
    if (!code) return page_('Not connected', 'Google did not send a code: ' + (request.parameter.error || 'cancelled') + '. Run connectYouTube again.');
    const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', { method: 'post', muteHttpExceptions: true, payload: {
      code: code, client_id: PROPS.getProperty('CLIENT_ID'), client_secret: PROPS.getProperty('CLIENT_SECRET'),
      redirect_uri: redirectUri_(), grant_type: 'authorization_code' } });
    const tok = JSON.parse(r.getContentText());
    if (!tok.access_token) return page_('Not connected', 'Token exchange failed: ' + r.getContentText().slice(0, 300));
    if (!tok.refresh_token) return page_('Not connected', 'Google did not return a long-term login. Run connectYouTube again (it asks for consent each time).');
    const ch = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: 'Bearer ' + tok.access_token }, muteHttpExceptions: true }).getContentText());
    const c = ch.items && ch.items[0];
    if (!c) return page_('Not connected', 'That login has no YouTube channel. Run connectYouTube again and pick "' + CFG.CHANNEL_TITLE + '".');
    if (norm_(c.snippet.title) !== norm_(CFG.CHANNEL_TITLE)) {
      return page_('Wrong channel — not connected', 'You picked "' + c.snippet.title + '". This uploader only works with "' + CFG.CHANNEL_TITLE +
        '". If that is the right channel, rename it on YouTube first; otherwise run connectYouTube again and pick the other one.');
    }
    PROPS.setProperties({ YT_REFRESH: tok.refresh_token, CHANNEL_ID: c.id, CHANNEL_TITLE_SEEN: c.snippet.title });
    CacheService.getScriptCache().put('yt_access', tok.access_token, 3000);
    return page_('Connected ✔', 'Uploads will go to "' + c.snippet.title + '" (' + c.id + '). Close this tab and run setup() in the editor.');
  } catch (e) {
    return page_('Not connected', String(e.message || e));
  }
}

function redirectUri_() { return 'https://script.google.com/macros/d/' + ScriptApp.getScriptId() + '/usercallback'; }
function page_(title, msg) { return HtmlService.createHtmlOutput('<div style="font:16px sans-serif;padding:24px"><h2>' + title + '</h2><p>' + msg + '</p></div>'); }
function norm_(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

/** Prints the redirect URI to paste into the Google Cloud OAuth client (SETUP.md step 2). */
function showRedirectUri() { Logger.log(redirectUri_()); }

/** Forget the YouTube login (then run connectYouTube again). */
function disconnectYouTube() { ['YT_REFRESH', 'CHANNEL_ID', 'CHANNEL_TITLE_SEEN'].forEach(k => PROPS.deleteProperty(k)); CacheService.getScriptCache().remove('yt_access'); Logger.log('Disconnected.'); }

function ytToken_() {
  const cache = CacheService.getScriptCache(); const c = cache.get('yt_access'); if (c) return c;
  const refresh = PROPS.getProperty('YT_REFRESH');
  if (!refresh) throw new Error('YouTube is not connected. Run connectYouTube() (SETUP.md step 5).');
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', { method: 'post', muteHttpExceptions: true, payload: {
    client_id: PROPS.getProperty('CLIENT_ID'), client_secret: PROPS.getProperty('CLIENT_SECRET'), refresh_token: refresh, grant_type: 'refresh_token' } });
  const tok = JSON.parse(r.getContentText());
  if (!tok.access_token) throw new Error('YouTube login expired or was revoked (' + r.getContentText().slice(0, 200) + '). Run connectYouTube() again. ' +
    'If this happens every 7 days, the Google Cloud app is still in "Testing": publish it (SETUP.md step 2e).');
  cache.put('yt_access', tok.access_token, Math.min(3000, (tok.expires_in || 3600) - 120));
  return tok.access_token;
}

/** The safety check: the login must still be the connected channel, with the expected name. Throws otherwise. */
function assertChannel_() {
  const ch = ytJson_('get', 'channels?part=snippet,contentDetails&mine=true');
  const c = ch.items && ch.items[0];
  if (!c) throw new Error('CHANNEL CHECK FAILED: the login has no channel.');
  if (c.id !== PROPS.getProperty('CHANNEL_ID')) throw new Error('CHANNEL CHECK FAILED: signed in to "' + c.snippet.title + '" (' + c.id + '), not the connected channel. Nothing uploaded.');
  if (norm_(c.snippet.title) !== norm_(CFG.CHANNEL_TITLE)) throw new Error('CHANNEL CHECK FAILED: channel is now called "' + c.snippet.title + '", expected "' + CFG.CHANNEL_TITLE + '". Nothing uploaded.');
  return c;
}

/* ------------------------------------------------------------------ */
/* 2. Setup + the hourly run                                           */
/* ------------------------------------------------------------------ */

/** Run once after connecting. Checks everything, makes the Drive folder and the hourly timer, runs the queue once. */
function setup() {
  const repo = ghJson_('get', '');
  Logger.log('GitHub OK: ' + repo.full_name + ' (private: ' + repo.private + ')');
  const c = assertChannel_();
  Logger.log('YouTube OK: "' + c.snippet.title + '" (' + c.id + ')');
  Logger.log('Drive backup folder: ' + backupFolder_().getUrl());
  const sh = sheet_();
  Logger.log('Google Sheet OK: ' + sh.getParent().getName() + ' → ' + CFG.SHEET_TAB);
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'processQueue').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('processQueue').timeBased().everyHours(1).create();
  Logger.log('Hourly timer created. Running the queue once now…');
  processQueue();
}

/** Called by the hourly timer (you can also run it by hand). */
function processQueue() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) { Logger.log('Another run is busy; skipping.'); return; }
  const started = Date.now();
  try {
    const branches = listQueueBranches_();
    Logger.log(branches.length + ' video(s) in the queue.');
    if (branches.length) {
      try { assertChannel_(); }
      catch (e) { Logger.log(e.message); branches.forEach(b => noteInSheet_(b.substring(CFG.QUEUE_PREFIX.length), 'upload blocked', e.message)); return; }
      applyPendingThumbnails_();
      for (const b of branches) {
        if (Date.now() - started > CFG.TIME_BUDGET_MS) { Logger.log('Time budget used; the rest waits for the next run.'); break; }
        processOne_(b);
      }
    } else {
      applyPendingThumbnails_();
    }
    try { syncStats(); } catch (e) { Logger.log('Stats sync failed: ' + e.message); }
  } finally { lock.releaseLock(); }
}

/** Shows what is queued, without uploading anything. */
function showQueue() {
  listQueueBranches_().forEach(b => {
    try { const m = JSON.parse(ghRawText_('meta.json', b)); Logger.log(b + ' → ' + m.title + ' | slot ' + m.slot); }
    catch (e) { Logger.log(b + ' → (no readable meta.json) ' + e.message); }
  });
}

function processOne_(branch) {
  const id = branch.substring(CFG.QUEUE_PREFIX.length);
  let meta;
  try { meta = JSON.parse(ghRawText_('meta.json', branch)); }
  catch (e) { Logger.log(branch + ': no readable meta.json — deleting the branch.'); ghDeleteBranch_(branch); return; }
  if (meta.test) { Logger.log(branch + ': test branch — deleting.'); ghDeleteBranch_(branch); return; }
  const key = 'attempts:' + id, attempts = Number(PROPS.getProperty(key) || 0);
  if (attempts >= CFG.MAX_ATTEMPTS) return;
  try {
    const r = uploadAndSchedule_(id, meta);
    try { logToSheet_(r); r.sheet = 'logged'; } catch (e) { r.sheet = 'not logged: ' + String(e.message).slice(0, 200); }
    writeResult_(id, r); ghDeleteBranch_(branch); PROPS.deleteProperty(key);
    Logger.log(id + ': done → ' + r.url + ' at ' + r.publishAtET + ' ET');
  } catch (e) {
    const n = attempts + 1; PROPS.setProperty(key, String(n));
    Logger.log(id + ': attempt ' + n + ' failed: ' + e.message);
    if (n >= CFG.MAX_ATTEMPTS) {
      noteInSheet_(id, 'upload failed', String(e.message).slice(0, 300));
      try { writeResult_(id, { id: id, status: 'failed', error: String(e.message).slice(0, 500), attempts: n, processedAt: nowIST_(), title: meta.title }); } catch (e2) {}
    }
  }
}

function uploadAndSchedule_(id, meta) {
  const notes = [];
  let videoId = findUploadedByTitle_(meta.title), publishAt, video = null;
  if (videoId) notes.push('already on YouTube (reused existing upload)');
  else {
    publishAt = pickSlot_(meta.slot);
    if (publishAt.getTime() !== new Date(meta.slot).getTime()) notes.push('planned slot had passed or was taken; moved to the next free day');
    video = ghRawBlob_(meta.video, CFG.QUEUE_PREFIX + id);
    videoId = ytUploadVideo_(video, meta, publishAt);
    reserveSlot_(publishAt);
  }
  let thumbnail = 'none', thumbBlob = null;
  if (meta.thumbnail) {
    try { thumbBlob = ghRawBlob_(meta.thumbnail, CFG.QUEUE_PREFIX + id); ytSetThumbnail_(videoId, thumbBlob); thumbnail = 'set'; }
    catch (e) { thumbnail = 'not set yet: ' + String(e.message).slice(0, 160); }
  }
  const v = ytJson_('get', 'videos?part=status&id=' + videoId);
  const st = (v.items && v.items[0] && v.items[0].status) || {};
  if (st.uploadStatus === 'rejected' || st.uploadStatus === 'failed') throw new Error('YouTube ' + st.uploadStatus + ': ' + (st.rejectionReason || st.failureReason || ''));
  if (!publishAt && st.publishAt) publishAt = new Date(st.publishAt);
  let driveVideoId = '', driveThumbId = '';
  try {
    const folder = backupFolder_();
    driveVideoId = folder.createFile((video || ghRawBlob_(meta.video, CFG.QUEUE_PREFIX + id)).setName(meta.video)).getId();
    if (thumbBlob) driveThumbId = folder.createFile(thumbBlob.setName(meta.thumbnail)).getId();
  } catch (e) { notes.push('Drive backup failed: ' + String(e.message).slice(0, 160)); }
  if (driveThumbId) addPendingThumbnail_(videoId, driveThumbId);
  if (/not set/.test(thumbnail)) notes.push('thumbnail ' + thumbnail + ' (will retry; custom thumbnails need a phone-verified channel)');
  return {
    id: id, status: st.privacyStatus === 'public' ? 'public' : 'scheduled', youtubeId: videoId, url: 'https://youtube.com/shorts/' + videoId,
    publishAtET: publishAt ? fmtET_(publishAt) : '', publishAtIST: publishAt ? fmtIST_(publishAt) : '',
    thumbnail: thumbnail, driveVideoId: driveVideoId, driveThumbnailId: driveThumbId,
    title: meta.title, topic: meta.topic || '', lengthSeconds: meta.lengthSeconds || '', notes: notes.join(' ; '), processedAt: nowIST_(), queuedAt: meta.queuedAt || '',
  };
}

/* ------------------------------------------------------------------ */
/* Thumbnails: set again once YouTube has finished processing          */
/* ------------------------------------------------------------------ */

function pendingThumbs_() { return JSON.parse(PROPS.getProperty('pendingThumbs') || '{}'); }
function addPendingThumbnail_(videoId, fileId) { const m = pendingThumbs_(); m[videoId] = { file: fileId, tries: 0 }; PROPS.setProperty('pendingThumbs', JSON.stringify(m)); }
function applyPendingThumbnails_() {
  const m = pendingThumbs_();
  Object.keys(m).forEach(vid => {
    const it = m[vid];
    try {
      const v = ytJson_('get', 'videos?part=processingDetails&id=' + vid), x = v.items && v.items[0];
      if (!x) { delete m[vid]; return; }
      const ps = x.processingDetails && x.processingDetails.processingStatus;
      if (ps && ps !== 'succeeded') { if (++it.tries > 48) delete m[vid]; return; }
      ytSetThumbnail_(vid, DriveApp.getFileById(it.file).getBlob()); delete m[vid];
    } catch (e) { Logger.log('Thumbnail retry ' + vid + ': ' + e.message); if (++it.tries > 48) delete m[vid]; }
  });
  PROPS.setProperty('pendingThumbs', JSON.stringify(m));
}

/* ------------------------------------------------------------------ */
/* Slots: 17:30 IST every day (one Short a day)                         */
/* ------------------------------------------------------------------ */

function istAt_(ymd, hm) { return new Date(ymd + 'T' + hm + ':00+05:30'); }   // India has no daylight saving
function takenSlots_() { const now = Date.now(); const l = JSON.parse(PROPS.getProperty('takenSlots') || '[]').filter(t => t > now); PROPS.setProperty('takenSlots', JSON.stringify(l)); return l; }
function reserveSlot_(d) { const l = takenSlots_(); l.push(d.getTime()); PROPS.setProperty('takenSlots', JSON.stringify(l)); }
function dayIST_(t) { return Utilities.formatDate(new Date(t), 'Asia/Calcutta', 'yyyy-MM-dd'); }
function pickSlot_(planned) {
  const earliest = Date.now() + CFG.MIN_LEAD_MINUTES * 60000, taken = takenSlots_(), takenDays = taken.map(dayIST_);
  const p = new Date(planned).getTime();
  if (!isNaN(p) && p >= earliest && takenDays.indexOf(dayIST_(p)) === -1) return new Date(p);
  for (let day = 0; day < 60; day++) {
    const ymd = Utilities.formatDate(new Date(Date.now() + day * 86400000), 'Asia/Calcutta', 'yyyy-MM-dd');
    const t = istAt_(ymd, CFG.POST_TIME_IST).getTime();
    if (t >= earliest && takenDays.indexOf(ymd) === -1) return new Date(t);
  }
  throw new Error('No free slot in the next 60 days.');
}

/* ------------------------------------------------------------------ */
/* YouTube                                                             */
/* ------------------------------------------------------------------ */

function ytJson_(method, path, body) {
  const opts = { method: method, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + ytToken_() } };
  if (body) { opts.contentType = 'application/json'; opts.payload = JSON.stringify(body); }
  const r = UrlFetchApp.fetch('https://www.googleapis.com/youtube/v3/' + path, opts);
  if (r.getResponseCode() >= 300) throw new Error('YouTube ' + path.split('?')[0] + ' → ' + r.getResponseCode() + ': ' + r.getContentText().slice(0, 300));
  return JSON.parse(r.getContentText());
}

function ytUploadVideo_(blob, meta, publishAt) {
  const bytes = blob.getBytes();
  const resource = {
    snippet: { title: meta.title, description: meta.description || '', tags: meta.tags || [], categoryId: String(meta.categoryId || '27'), defaultLanguage: 'en', defaultAudioLanguage: 'en' },
    status: { privacyStatus: 'private', publishAt: publishAt.toISOString(), selfDeclaredMadeForKids: false, embeddable: true, license: 'youtube' },
  };
  const auth = { Authorization: 'Bearer ' + ytToken_() };
  const init = UrlFetchApp.fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status&notifySubscribers=true', {
    method: 'post', muteHttpExceptions: true, contentType: 'application/json; charset=UTF-8', payload: JSON.stringify(resource),
    headers: Object.assign({ 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(bytes.length) }, auth) });
  if (init.getResponseCode() !== 200) throw new Error('Upload start → ' + init.getResponseCode() + ': ' + init.getContentText().slice(0, 300));
  const h = init.getAllHeaders(), loc = h.Location || h.location;
  if (!loc) throw new Error('Upload start returned no upload URL.');
  const up = UrlFetchApp.fetch(loc, { method: 'put', muteHttpExceptions: true, contentType: 'video/mp4', payload: bytes, headers: auth });
  if (up.getResponseCode() >= 300) throw new Error('Upload → ' + up.getResponseCode() + ': ' + up.getContentText().slice(0, 300));
  return JSON.parse(up.getContentText()).id;
}

function ytSetThumbnail_(videoId, blob) {
  const r = UrlFetchApp.fetch('https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId=' + videoId, {
    method: 'post', muteHttpExceptions: true, contentType: 'image/jpeg', payload: blob.getBytes(), headers: { Authorization: 'Bearer ' + ytToken_() } });
  if (r.getResponseCode() >= 300) throw new Error(r.getResponseCode() + ': ' + r.getContentText().slice(0, 200));
}

function findUploadedByTitle_(title) {
  const ch = ytJson_('get', 'channels?part=contentDetails&mine=true');
  const pl = ytJson_('get', 'playlistItems?part=snippet&maxResults=50&playlistId=' + ch.items[0].contentDetails.relatedPlaylists.uploads);
  const hit = (pl.items || []).find(it => it.snippet.title === title);
  return hit ? hit.snippet.resourceId.videoId : null;
}

/* ------------------------------------------------------------------ */
/* GitHub                                                              */
/* ------------------------------------------------------------------ */

function gh_(method, path, body, accept) {
  const token = PROPS.getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('GITHUB_TOKEN is missing (Project Settings → Script Properties).');
  const opts = { method: method, muteHttpExceptions: true, headers: { Authorization: 'Bearer ' + token, Accept: accept || 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } };
  if (body) { opts.contentType = 'application/json'; opts.payload = JSON.stringify(body); }
  return UrlFetchApp.fetch('https://api.github.com/repos/' + CFG.REPO + (path ? '/' + path : ''), opts);
}
function ghJson_(method, path, body) {
  const r = gh_(method, path, body), c = r.getResponseCode();
  if (c >= 300) throw new Error('GitHub ' + method.toUpperCase() + ' ' + path + ' → ' + c + ': ' + r.getContentText().slice(0, 300));
  return c === 204 ? null : JSON.parse(r.getContentText());
}
function encPath_(p) { return String(p).split('/').map(encodeURIComponent).join('/'); }
function listQueueBranches_() { return ghJson_('get', 'git/matching-refs/heads/' + CFG.QUEUE_PREFIX).map(r => r.ref.replace('refs/heads/', '')).sort(); }
function ghRawBlob_(path, ref) {
  const r = gh_('get', 'contents/' + encPath_(path) + '?ref=' + encodeURIComponent(ref), null, 'application/vnd.github.raw');
  if (r.getResponseCode() >= 300) throw new Error('GitHub file ' + path + ' on ' + ref + ' → ' + r.getResponseCode());
  return r.getBlob();
}
function ghRawText_(path, ref) { return ghRawBlob_(path, ref).getDataAsString('UTF-8'); }
function ghDeleteBranch_(branch) {
  const r = gh_('delete', 'git/refs/heads/' + encPath_(branch));
  if (r.getResponseCode() !== 204 && r.getResponseCode() !== 422) throw new Error('Could not delete ' + branch + ' → ' + r.getResponseCode());
}
function writeResult_(id, obj) {
  const path = CFG.RESULTS_DIR + '/' + id + '.json'; let sha;
  const cur = gh_('get', 'contents/' + encPath_(path) + '?ref=' + CFG.MAIN);
  if (cur.getResponseCode() === 200) sha = JSON.parse(cur.getContentText()).sha;
  const body = { message: 'Upload result ' + id + ': ' + obj.status, branch: CFG.MAIN,
    content: Utilities.base64Encode(JSON.stringify(obj, null, 2) + '\n', Utilities.Charset.UTF_8),
    committer: { name: 'youtube-uploader (Apps Script)', email: 'noreply@example.com' } };
  if (sha) body.sha = sha;
  ghJson_('put', 'contents/' + encPath_(path), body);
}

/* ------------------------------------------------------------------ */
/* Tracker sheet ("Videos" tab; the generation job writes the row,      */
/* this script fills in the YouTube part and keeps the numbers fresh)   */
/* ------------------------------------------------------------------ */

function sheet_() {
  const sh = SpreadsheetApp.openById(CFG.SHEET_ID).getSheetByName(CFG.SHEET_TAB);
  if (!sh) throw new Error('Tab "' + CFG.SHEET_TAB + '" not found — is the sheet shared with this account as Editor?');
  return sh;
}
function rowOf_(sh, id) {
  const last = sh.getLastRow(); if (last < 2) return 0;
  const ids = sh.getRange(2, COL.ID, last - 1, 1).getDisplayValues().map(r => r[0].replace(/^'/, ''));
  const i = ids.indexOf(String(id)); return i === -1 ? 0 : i + 2;
}
function logToSheet_(r) {
  const sh = sheet_(); let row = rowOf_(sh, r.id);
  if (!row) { row = sh.getLastRow() + 1; sh.getRange(row, COL.ID, 1, 4).setValues([["'" + r.id, '', r.topic, r.title]]); sh.getRange(row, COL.LEN).setValue(r.lengthSeconds); sh.getRange(row, COL.QUEUED).setValue(r.queuedAt); }
  sh.getRange(row, COL.STATUS).setValue(r.status);
  sh.getRange(row, COL.ET, 1, 2).setValues([[r.publishAtET, r.publishAtIST]]);
  sh.getRange(row, COL.LINK, 1, 2).setValues([[r.url, r.youtubeId]]);
  sh.getRange(row, COL.UPLOADED, 1, 3).setValues([[r.processedAt, r.driveVideoId ? 'https://drive.google.com/file/d/' + r.driveVideoId : '', r.notes]]);
}
function noteInSheet_(id, status, note) {
  try { const sh = sheet_(), row = rowOf_(sh, id); if (!row) return; sh.getRange(row, COL.STATUS).setValue(status); sh.getRange(row, COL.NOTES).setValue(note); }
  catch (e) { Logger.log('Could not write to the sheet: ' + e.message); }
}

/** Refreshes Status / Views / Likes / Comments for every row that has a Video ID. Runs every hour; you can run it by hand. */
function syncStats() {
  const sh = sheet_(), last = sh.getLastRow(); if (last < 2) return;
  const vids = sh.getRange(2, COL.VID, last - 1, 1).getDisplayValues().map(r => r[0]);
  const list = vids.map((v, i) => ({ v: v, row: i + 2 })).filter(x => x.v);
  for (let i = 0; i < list.length; i += 50) {
    const part = list.slice(i, i + 50);
    const res = ytJson_('get', 'videos?part=statistics,status&id=' + part.map(x => x.v).join(','));
    const byId = {}; (res.items || []).forEach(it => byId[it.id] = it);
    part.forEach(x => {
      const it = byId[x.v];
      if (!it) { sh.getRange(x.row, COL.STATUS).setValue('removed'); return; }
      const st = it.status || {}, scheduled = st.privacyStatus === 'private' && st.publishAt;
      sh.getRange(x.row, COL.STATUS).setValue(scheduled ? 'scheduled' : st.privacyStatus);
      if (!scheduled) sh.getRange(x.row, COL.VIEWS, 1, 3).setValues([[Number(it.statistics.viewCount || 0), Number(it.statistics.likeCount || 0), Number(it.statistics.commentCount || 0)]]);
    });
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function backupFolder_() {
  const idp = PROPS.getProperty('BACKUP_FOLDER_ID');
  if (idp) { try { return DriveApp.getFolderById(idp); } catch (e) {} }
  const it = DriveApp.getFoldersByName(CFG.BACKUP_FOLDER_NAME);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(CFG.BACKUP_FOLDER_NAME);
  PROPS.setProperty('BACKUP_FOLDER_ID', f.getId()); return f;
}
function fmtIST_(d) { return Utilities.formatDate(d, 'Asia/Calcutta', 'yyyy-MM-dd HH:mm'); }
function fmtET_(d) { return Utilities.formatDate(d, 'America/New_York', 'yyyy-MM-dd HH:mm'); }
function nowIST_() { return fmtIST_(new Date()); }
