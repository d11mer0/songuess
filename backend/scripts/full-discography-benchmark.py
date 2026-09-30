import urllib.request
import json
import time

def fetch_json(url, headers=None):
    req_headers = {'User-Agent': 'Mozilla/5.0'}
    if headers:
        req_headers.update(headers)
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers=req_headers)
            res = urllib.request.urlopen(req, timeout=60)
            return json.loads(res.read().decode())
        except Exception as e:
            time.sleep(1)
    return {}

# 1. Login as guest to call backend endpoint
print("Logging into backend as guest...")
login_data = json.dumps({'nickname': 'BenchmarkRunner'}).encode()
login_req = urllib.request.Request('http://localhost:3000/api/auth/guest', data=login_data, headers={'Content-Type': 'application/json'})
token = json.loads(urllib.request.urlopen(login_req).read())['accessToken']
auth_headers = {'Authorization': f'Bearer {token}'}

artists_list = [
    {"name": "Taylor Swift", "id": 12246},
    {"name": "Linkin Park", "id": 92},
    {"name": "Eminem", "id": 13},
    {"name": "Daft Punk", "id": 27},
    {"name": "Queen", "id": 412},
    {"name": "Dua Lipa", "id": 8706544}, # Deezer ID for Dua Lipa is 8706544
    {"name": "The Weeknd", "id": 4050205},
    {"name": "Billie Eilish", "id": 9635624},
    {"name": "Rammstein", "id": 464},
    {"name": "Океан Ельзи", "id": 257798}, # Okean Elzy
]

results = []

valid_types = {'album', 'single', 'ep'}
non_orig = {'remixes', 'remix album', 'instrumentals', 'karaoke', 'commentary', 'drumless'}

print(f"\n==========================================================================")
print(f"       STARTING FULL DISCOGRAPHY BENCHMARK (NO CUTOFFS) ON 10 ARTISTS       ")
print(f"==========================================================================\n")

for item in artists_list:
    artist_name = item["name"]
    artist_id = item["id"]
    print(f"\n▶ Testing: {artist_name} (ID: {artist_id})...")

    # A. Fetch Releases for Artist (up to 60 as in backend)
    albums_res = fetch_json(f"https://api.deezer.com/artist/{artist_id}/albums?limit=100").get("data", [])
    filtered_releases = []
    for a in albums_res:
        if a.get('record_type') in valid_types and not any(k in a.get('title', '').lower() for k in non_orig):
            filtered_releases.append(a)

    filtered_releases.sort(key=lambda a: (3 if a.get('record_type')=='album' else 2 if a.get('record_type')=='ep' else 1, a.get('fans', 0)), reverse=True)
    releases = filtered_releases[:60]

    # B. Count RAW tracks across all releases
    raw_tracks = []
    for alb in releases:
        data = fetch_json(f"https://api.deezer.com/album/{alb['id']}/tracks?limit=100").get("data", [])
        for t in data:
            t['album'] = {'id': alb['id'], 'title': alb['title'], 'cover': alb.get('cover')}
            t['record_type'] = alb.get('record_type')
            t['release_date'] = alb.get('release_date')
            raw_tracks.append(t)
        time.sleep(0.04)

    # C. Old Naive Algorithm (case-insensitive title set with basic preview check)
    seen_naive = set()
    naive_tracks = []
    for t in raw_tracks:
        if t.get('preview') and t['preview'] != '':
            key = (t.get('title') or '').lower().strip()
            if key not in seen_naive:
                seen_naive.add(key)
                naive_tracks.append(t)

    # D. Call REAL Backend Endpoint (New Algorithm)
    new_tracks = fetch_json(f"http://localhost:3000/api/deezer/artist/{artist_id}/all-tracks", headers=auth_headers)
    if not isinstance(new_tracks, list):
        print(f"  ❌ Error fetching from backend: {new_tracks}")
        continue

    # E. Preview URL Validation Check
    invalid_previews = []
    for t in new_tracks:
        p = t.get('preview')
        if not p or not isinstance(p, str) or len(p.strip()) < 10 or not (p.startswith('http://') or p.startswith('https://')):
            invalid_previews.append(t)

    all_previews_valid = (len(invalid_previews) == 0)

    # F. Duplicates Check in New Algorithm
    title_counts = {}
    for t in new_tracks:
        title = t.get('title', '').strip()
        title_counts[title] = title_counts.get(title, 0) + 1
    exact_duplicates = [k for k, v in title_counts.items() if v > 1]

    # G. Sample of duplicate/low-quality variations eliminated
    new_ids = set(t.get('id') for t in new_tracks)
    cleaned_variations = [t.get('title') for t in naive_tracks if t.get('id') not in new_ids]

    res = {
        "artist": artist_name,
        "id": artist_id,
        "releasesCount": len(releases),
        "rawTracksCount": len(raw_tracks),
        "naiveCount": len(naive_tracks),
        "newCount": len(new_tracks),
        "eliminatedCount": len(raw_tracks) - len(new_tracks),
        "validPreviewsCount": len(new_tracks) - len(invalid_previews),
        "allPreviewsValid": all_previews_valid,
        "exactDuplicatesCount": len(exact_duplicates),
        "sampleCleaned": cleaned_variations[:5],
    }
    results.append(res)

    print(f"  ✔ Releases: {len(releases)} | Raw tracks: {len(raw_tracks)}")
    print(f"  ✔ Old Algorithm (Naive): {len(naive_tracks)} tracks")
    print(f"  ✔ New Algorithm (Clean): {len(new_tracks)} tracks (eliminated {len(raw_tracks) - len(new_tracks)} duplicates/skits)")
    print(f"  ✔ Previews 100% Valid: {all_previews_valid} ({len(new_tracks) - len(invalid_previews)} / {len(new_tracks)})")
    if exact_duplicates:
        print(f"  ⚠ Exact duplicates found: {exact_duplicates}")
    else:
        print(f"  ✔ Exact duplicates: 0")
    print(f"  ✔ Sample cleaned duplicates: {cleaned_variations[:3]}")

# Write results
with open("/tmp/full-discography-results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("\n\n==========================================================================")
print("                           FINAL BENCHMARK TABLE                           ")
print("==========================================================================")
print(f"{'Artist':20} | {'Raw':5} | {'Old Naive':10} | {'New Smart':10} | {'Eliminated':10} | {'Previews 100%':14}")
print("-" * 80)
for r in results:
    p_status = "100.0% ✅" if r["allPreviewsValid"] else "FAILED ❌"
    print(f"{r['artist']:20} | {r['rawTracksCount']:5} | {r['naiveCount']:10} | {r['newCount']:10} | {r['eliminatedCount']:10} | {p_status:14}")
print("==========================================================================\n")
