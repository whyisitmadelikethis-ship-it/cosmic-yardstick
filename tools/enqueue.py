#!/usr/bin/env python3
"""Queue a finished Short for the YouTube auto-uploader (Apps Script in youtube-uploader/).

Pushes ONE orphan branch  queue/<ID>  to cosmic-yardstick containing:
    meta.json, <video>.mp4, <thumbnail>.jpg (optional)
The Apps Script picks it up within the hour, schedules it on YouTube, writes
upload-results/<ID>.json on main and deletes the branch. main is never touched here.
The slot is given in US Eastern time (the channel posts at 19:00 ET); daylight saving is handled.

Example:
  python3 tools/enqueue.py --id 2026-11-27 --video renders/x.mp4 --thumb x-thumbnail.jpg \
    --title "Why ...? #shorts" --description "..." --tags "a, b, c" --category "Education (27)" \
    --slot-et "2026-11-27 19:00" --topic "Why ..." --length 34.6
Prints one JSON line: {"ok": true, "branch": ..., "sha": ...} or {"ok": false, "error": ...}
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, time
from datetime import datetime, timedelta, timezone

REMOTE = "https://github.com/whyisitmadelikethis-ship-it/cosmic-yardstick"
IST = timezone(timedelta(hours=5, minutes=30))
from zoneinfo import ZoneInfo
ET = ZoneInfo("America/New_York")


def run(cmd, cwd, check=True):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=600)
    if check and r.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd[:3])}… failed: {(r.stderr or r.stdout).strip()[-400:]}")
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--video", required=True)
    ap.add_argument("--thumb")
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--tags", default="", help="comma separated")
    ap.add_argument("--category", default="27", help='e.g. "Education (27)" or "27"')
    ap.add_argument("--slot-et", required=True, help='"YYYY-MM-DD HH:MM" US Eastern')
    ap.add_argument("--topic", default="")
    ap.add_argument("--length", default="")
    ap.add_argument("--test", action="store_true", help="mark as test: the uploader deletes it without uploading")
    a = ap.parse_args()

    if not re.fullmatch(r"[0-9A-Za-z][0-9A-Za-z._-]*", a.id):
        raise SystemExit(json.dumps({"ok": False, "error": f"bad id {a.id!r}"}))
    if not os.path.isfile(a.video):
        raise SystemExit(json.dumps({"ok": False, "error": f"video not found: {a.video}"}))
    size_mb = os.path.getsize(a.video) / 1e6
    if size_mb > 45:
        raise SystemExit(json.dumps({"ok": False, "error": f"video is {size_mb:.1f} MB; the uploader limit is 45 MB — re-encode smaller"}))
    m = re.search(r"\d+", a.category)
    cat = m.group(0) if m else "27"
    slot = datetime.strptime(a.slot_et.strip()[:16], "%Y-%m-%d %H:%M").replace(tzinfo=ET)

    video_name = os.path.basename(a.video)
    thumb_name = os.path.basename(a.thumb) if a.thumb and os.path.isfile(a.thumb) else None
    meta = {
        "id": a.id, "topic": a.topic, "title": a.title, "description": a.description,
        "tags": [t.strip() for t in a.tags.split(",") if t.strip()],
        "categoryId": cat, "slot": slot.isoformat(), "lengthSeconds": a.length,
        "video": video_name, "thumbnail": thumb_name,
        "slotIST": slot.astimezone(IST).strftime("%Y-%m-%d %H:%M"),
        "queuedAt": datetime.now(IST).strftime("%Y-%m-%d %H:%M"),
    }
    if a.test:
        meta["test"] = True

    work = tempfile.mkdtemp(prefix="enqueue-")
    try:
        shutil.copy2(a.video, os.path.join(work, video_name))
        if thumb_name:
            shutil.copy2(a.thumb, os.path.join(work, thumb_name))
        with open(os.path.join(work, "meta.json"), "w") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)
        run(["git", "init", "-q", "-b", "q"], work)
        run(["git", "config", "user.name", "whyisitmadelikethis-ship-it"], work)
        run(["git", "config", "user.email", "whyisitmadelikethis@gmail.com"], work)
        run(["git", "add", "-A"], work)
        run(["git", "commit", "-qm", f"Queue {a.id}: {a.title}"], work)
        sha = run(["git", "rev-parse", "HEAD"], work).stdout.strip()
        branch = f"queue/{a.id}"
        last = ""
        for attempt in range(3):
            r = run(["git", "push", "-q", REMOTE, f"HEAD:refs/heads/{branch}"], work, check=False)
            if r.returncode == 0:
                break
            full = (r.stderr or r.stdout)
            last = full.strip()[-300:]
            if any(k in full for k in ("rejected", "fetch first", "non-fast-forward", "already exists")):
                raise RuntimeError(f"{branch} already exists on GitHub (already queued?) — {last}")
            time.sleep(5 * (attempt + 1))
        else:
            raise RuntimeError(f"push failed 3 times: {last}")
        remote = run(["git", "ls-remote", REMOTE, f"refs/heads/{branch}"], work).stdout.split()
        if not remote or remote[0] != sha:
            raise RuntimeError(f"push not visible on GitHub (remote says {remote[:1]})")
        print(json.dumps({"ok": True, "branch": branch, "sha": sha, "slot": meta["slot"], "slot_ist": meta["slotIST"],
                          "video": video_name, "thumbnail": thumb_name, "size_mb": round(size_mb, 1)}))
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
        sys.exit(1)
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
