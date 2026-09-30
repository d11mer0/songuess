import urllib.request
import json
import time

def fetch_json(url):
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            res = urllib.request.urlopen(req)
            return json.loads(res.read().decode())
        except Exception as e:
            time.sleep(0.5)
    return {}

# 1. Fetch releases for Taylor Swift
print("Fetching all releases for Taylor Swift (ID: 12246)...")
albums_res = fetch_json("https://api.deezer.com/artist/12246/albums?limit=100").get("data", [])
valid_types = {'album', 'single', 'ep'}
non_orig = {'remixes', 'remix album', 'instrumentals', 'karaoke', 'commentary', 'drumless'}

filtered_releases = []
for a in albums_res:
    if a.get('record_type') in valid_types and not any(k in a.get('title', '').lower() for k in non_orig):
        filtered_releases.append(a)

filtered_releases.sort(key=lambda a: (3 if a.get('record_type')=='album' else 2 if a.get('record_type')=='ep' else 1, a.get('fans', 0)), reverse=True)
releases = filtered_releases[:60]

print(f"Total valid releases considered by backend: {len(releases)}")

raw_tracks = []
for alb in releases:
    data = fetch_json(f"https://api.deezer.com/album/{alb['id']}/tracks?limit=100").get("data", [])
    for t in data:
        t['album'] = {'id': alb['id'], 'title': alb['title'], 'cover': alb.get('cover')}
        t['record_type'] = alb.get('record_type')
        t['release_date'] = alb.get('release_date')
        raw_tracks.append(t)
    time.sleep(0.05)

print(f"Total RAW tracks across all releases: {len(raw_tracks)}")

# Old Naive Algorithm:
seen_naive = set()
naive_tracks = []
for t in raw_tracks:
    if t.get('preview'):
        key = (t.get('title') or '').lower().strip()
        if key not in seen_naive:
            seen_naive.add(key)
            naive_tracks.append(t)

print(f"Tracks returned by Old Naive Algorithm: {len(naive_tracks)}")

# New Algorithm results (from backend):
with open('/tmp/taylor_live.json') as f:
    new_tracks = json.load(f)

print(f"Tracks returned by New Algorithm: {len(new_tracks)}")

valid_previews = [t for t in new_tracks if t.get('preview') and len(t['preview'].strip()) > 10 and (t['preview'].startswith('http://') or t['preview'].startswith('https://'))]
print(f"Valid previews in New Algorithm: {len(valid_previews)} / {len(new_tracks)} (100% valid: {len(valid_previews) == len(new_tracks)})")

# Compare what naive leaked that New Algorithm cleaned:
new_ids = set(t['id'] for t in new_tracks)
leaked_by_naive = [t for t in naive_tracks if t['id'] not in new_ids]
print(f"Extra versions that Old Algorithm would have included as 'unique' songs: {len(leaked_by_naive)}")
print("Sample of duplicate variations Old Algorithm leaked but New Algorithm cleaned:")
for t in leaked_by_naive[:10]:
    print(f"  - {t['title']} (from album: {t['album']['title']})")
