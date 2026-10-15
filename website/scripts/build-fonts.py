#!/usr/bin/env python3
"""Fonts the site serves itself (2026-10-06), so English and Chinese pages never ask Google Fonts for anything.

  Geist (sans)    Geist 1.800 (SIL OFL) as the two variable Latin slices Google Fonts serves (latin, latin-ext), used as they are:
                  re-cutting the release ourselves drew text edges a little differently. Like Google's stylesheet, each weight
                  (300-800) is its own @font-face rule on the same file, so a page asking for weight 450 or 550 lands on the same
                  face as before. The rules sit between the "geist-faces" markers in assets/brand.css, which this script rewrites.
  Noto Sans SC    cut down to ASCII and the Chinese characters the site actually uses, weight axis limited to 300-900, one
                  @font-face rule per weight 300-900 as Google did. Loaded only when a page is shown in Chinese
                  (RM_CATALOG.fonts, the LED tool and the OTA page do the same), so English visitors never download it.
                  ASCII is in it because some headings put Noto Sans SC before Geist and must keep drawing Latin letters with it.
  Japanese and Korean still load Noto Sans JP / KR from Google on demand: those visitors are outside mainland China.

Usage (from the repository root):
  python3 website/scripts/build-fonts.py           build the files; needs python3 with fonttools and brotli, and the network
  python3 website/scripts/build-fonts.py --check   verify every Chinese character the site uses is in the subset (no network)

Run the build again whenever Chinese copy gains a character the subset does not have. The check lists the missing ones.
Sources are cached in .font-cache/ at the repository root (not committed)."""
import argparse
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / 'website'
FONTS = SITE / 'assets' / 'fonts'
LICENSES = SITE / 'assets' / 'licenses'
CACHE = ROOT / '.font-cache'

GEIST_FILES = {  # fonts.googleapis.com/css2?family=Geist (v5): the files, pinned by hash
    'latin': ('https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwcGFWNOITd.woff2', '9b6f5ff45b278c744b5f379a2c4ecbaf858a842b8eaf82ac8d21b699ca16c608'),
    'latin-ext': ('https://fonts.gstatic.com/s/geist/v5/gyByhwUxId8gMEwSGFWNOITddY4.woff2', '58a6b173d5ca1dec92166ea3c6cb1a84a4144556d10928ac14e8e6b40e4787bd'),
}
# The code point ranges Google Fonts uses for its Geist slices (fonts.googleapis.com css2?family=Geist), copied so rendering does not change.
GEIST_SLICES = {
    'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
}
NOTO_SHA = 'a85815a42757630ce188fdad368c2dfc444d4773'  # google/fonts, ofl/notosanssc
NOTO_URL = 'https://raw.githubusercontent.com/google/fonts/%s/ofl/notosanssc/NotoSansSC%%5Bwght%%5D.ttf' % NOTO_SHA
NOTO_OFL = 'https://raw.githubusercontent.com/google/fonts/%s/ofl/notosanssc/OFL.txt' % NOTO_SHA
NOTO_WEIGHTS = (300, 400, 900)  # min, default, max
SC_CSS = FONTS / 'noto-sans-sc.css'
SC_CHARS = FONTS / 'noto-sans-sc.chars.txt'

# Chinese copy lives in these files; the Japanese, Korean, Spanish and French catalogs are not Chinese copy.
SOURCE_EXT = {'.html', '.js', '.mjs', '.json', '.css', '.svg'}
SKIP_DIRS = {'node_modules', '.git', 'fonts', 'licenses', 'images', 'videos', 'review', 'translations'}
SKIP_NAMES = {'ja.json', 'ko.json', 'es.json', 'fr.json'}
SOURCE_ROOTS = [SITE, ROOT / 'services' / 'tianshanos-ota' / 'src']
# Worker-generated pages use the same font; include their declared source inputs in check AND build.
WORKER_PAGES = ROOT / 'tests' / 'browser' / 'worker-pages.json'
if WORKER_PAGES.exists():
    SOURCE_ROOTS.extend(ROOT / dependency for page in json.loads(WORKER_PAGES.read_text()) for dependency in page['dependencies'])


def parse_ranges(text):
    out = []
    for part in text.split(','):
        part = part.strip().replace('U+', '')
        if '-' in part:
            a, b = part.split('-')
            out.append((int(a, 16), int(b, 16)))
        else:
            out.append((int(part, 16), int(part, 16)))
    return out



def needs_sc(cp):
    """A character the Chinese font must carry: printable ASCII and anything else in Chinese copy except kana, hangul, emoji and format characters."""
    if cp < 0x20 or 0x7F <= cp <= 0x9F:
        return False
    if 0x1100 <= cp <= 0x11FF or 0x3040 <= cp <= 0x30FF or 0x3130 <= cp <= 0x318F or 0xAC00 <= cp <= 0xD7AF:
        return False
    if cp >= 0x10000 or 0xFE00 <= cp <= 0xFE0F or cp in (0x200D, 0x200B, 0xFEFF):
        return False
    return True


def source_files():
    for root in SOURCE_ROOTS:
        if root.is_file():
            if root.suffix in SOURCE_EXT:
                yield root
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                path = Path(dirpath) / name
                if path.suffix not in SOURCE_EXT:
                    continue
                if name in SKIP_NAMES and path.parent.name == 'locales' and 'emoji2pixel' not in path.parts:
                    continue
                yield path


def collect_chars():
    found = {chr(cp): ['printable ASCII'] for cp in range(0x20, 0x7F)}
    for path in source_files():
        try:
            text = path.read_text(encoding='utf-8')
        except (UnicodeDecodeError, OSError):
            continue
        for ch in set(text):
            if needs_sc(ord(ch)):
                found.setdefault(ch, []).append(path.relative_to(ROOT).as_posix())
    return found


def download(url, dest):
    """Fetch a source file once into the cache. curl retries on a flaky connection; urllib is the fallback."""
    if dest.exists():
        return dest
    CACHE.mkdir(exist_ok=True)
    print('downloading', url)
    part = dest.with_suffix(dest.suffix + '.part')
    if shutil.which('curl'):
        subprocess.run(['curl', '-fsSL', '--retry', '4', '--retry-all-errors', '--max-time', '600', '-o', str(part), url], check=True)
    else:
        for attempt in range(4):
            try:
                request = urllib.request.Request(url, headers={'User-Agent': 'rminte-build-fonts'})
                with urllib.request.urlopen(request, timeout=180) as response:
                    part.write_bytes(response.read())
                break
            except Exception as error:
                if attempt == 3:
                    raise
                print('retrying after', error)
    part.rename(dest)
    return dest


def check():
    found = collect_chars()
    if not SC_CHARS.exists() or not SC_CSS.exists():
        print('missing', SC_CHARS.relative_to(ROOT), 'or', SC_CSS.relative_to(ROOT), '- run the build first')
        return 1
    have = set(SC_CHARS.read_text(encoding='utf-8').replace('\n', ''))
    missing = sorted(set(found) - have)
    name = re.search(r'url\("(NotoSansSC-[0-9a-f]+\.woff2)"\)', SC_CSS.read_text(encoding='utf-8'))
    problems = []
    if not name or not (FONTS / name.group(1)).exists():
        problems.append('the font file named in noto-sans-sc.css is missing')
    elif hashlib.sha256((FONTS / name.group(1)).read_bytes()).hexdigest()[:10] != name.group(1)[len('NotoSansSC-'):-len('.woff2')]:
        problems.append('the font file does not match the hash in its name')
    for slice_name in GEIST_SLICES:
        if not list(FONTS.glob('Geist-%s-v*.woff2' % slice_name)):
            problems.append('Geist %s slice is missing' % slice_name)
    for ch in missing:
        problems.append('U+%04X %s is used in %s but not in the subset' % (ord(ch), ch, ', '.join(found[ch][:2])))
    for line in problems:
        print('PROBLEM', line)
    if problems:
        print('Run: python3 website/scripts/build-fonts.py')
        return 1
    print('ok: %d Chinese characters used on the site, all in the subset (%d glyph candidates); Geist slices present' % (len(found), len(have)))
    return 0


def write_geist_faces(tag):
    """Rewrite the block between the geist-faces markers in brand.css: every weight, latin-ext first so the later latin rule wins on overlaps."""
    css = SITE / 'assets' / 'brand.css'
    text = css.read_text(encoding='utf-8')
    start, end = '/* geist-faces:start', '/* geist-faces:end */'
    a, b = text.index(start), text.index(end) + len(end)
    rules = []
    for weight in (300, 400, 500, 600, 700, 800):
        for slice_name in ('latin-ext', 'latin'):
            rules.append('@font-face {font-family: "Geist"; font-style: normal; font-weight: %d; font-display: swap; src: url("fonts/Geist-%s-%s.woff2") format("woff2"); unicode-range: %s}'
                         % (weight, slice_name, tag, GEIST_SLICES[slice_name]))
    block = ('/* geist-faces:start. Geist, the interface sans, served from this site (scripts/build-fonts.py rewrites this block). The two Latin\n'
             '   slices and code point ranges Google Fonts used, one rule per weight like its stylesheet, so text renders as it did. */\n'
             + '\n'.join(rules) + '\n' + end)
    css.write_text(text[:a] + block + text[b:], encoding='utf-8')


def build():
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer

    FONTS.mkdir(parents=True, exist_ok=True)

    # ---- Geist: the two Latin slices, as Google Fonts serves them ----
    for old in FONTS.glob('Geist-*-v*.woff2'):
        old.unlink()
    tag = None
    for slice_name, (url, digest) in GEIST_FILES.items():
        source = download(url, CACHE / ('geist-%s-%s.woff2' % (slice_name, digest[:8])))
        data = source.read_bytes()
        if hashlib.sha256(data).hexdigest() != digest:
            raise SystemExit('%s does not match its pinned hash; delete .font-cache and retry' % source.name)
        version = TTFont(io.BytesIO(data))['name'].getDebugName(5)  # "Version 1.800"
        match = re.search(r'(\d+)\.(\d+)', version)
        tag = 'v' + match.group(1) + match.group(2)
        target = FONTS / ('Geist-%s-%s.woff2' % (slice_name, tag))
        target.write_bytes(data)
        print('wrote', target.relative_to(ROOT), len(data), 'bytes')
    write_geist_faces(tag)

    # ---- Noto Sans SC: the characters the site uses ----
    found = collect_chars()
    chars = ''.join(sorted(found))
    source = download(NOTO_URL, CACHE / ('NotoSansSC-wght-%s.ttf' % NOTO_SHA[:8]))
    ofl = download(NOTO_OFL, CACHE / ('NotoSansSC-OFL-%s.txt' % NOTO_SHA[:8]))
    LICENSES.mkdir(parents=True, exist_ok=True)
    (LICENSES / 'notosanssc-OFL.txt').write_bytes(ofl.read_bytes())
    font = TTFont(str(source), recalcTimestamp=False)
    options = subset.Options()
    options.recalc_timestamp = False  # keep the build reproducible
    options.layout_features = ['*']
    options.name_IDs = ['*']
    options.notdef_outline = True
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=[ord(c) for c in chars])
    subsetter.subset(font)
    instancer.instantiateVariableFont(font, {'wght': NOTO_WEIGHTS}, inplace=True)
    font.flavor = 'woff2'
    buffer = io.BytesIO()
    font.save(buffer)
    data = buffer.getvalue()
    digest = hashlib.sha256(data).hexdigest()[:10]
    for old in FONTS.glob('NotoSansSC-*.woff2'):
        old.unlink()
    target = FONTS / ('NotoSansSC-%s.woff2' % digest)
    target.write_bytes(data)
    faces = ''.join(
        '@font-face{font-family:"Noto Sans SC";font-style:normal;font-weight:%d;font-display:swap;src:url("%s") format("woff2")}\n' % (weight, target.name)
        for weight in (300, 400, 500, 600, 700, 800, 900))
    SC_CSS.write_text(
        '/* Generated by scripts/build-fonts.py. Noto Sans SC (SIL OFL), cut down to ASCII and the Chinese characters the site uses.\n'
        '   One rule per weight, all on the same file, as Google Fonts did, so a weight like 450 lands on the same face as before.\n'
        '   Loaded only when a page is shown in Chinese. Run the script again when Chinese copy gains a new character. */\n' + faces, encoding='utf-8')
    SC_CHARS.write_text(chars + '\n', encoding='utf-8')
    glyphs = len(TTFont(str(target)).getGlyphOrder())
    print('wrote', target.relative_to(ROOT), target.stat().st_size, 'bytes,', glyphs, 'glyphs for', len(chars), 'characters')
    return 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--check', action='store_true', help='verify the subset covers every Chinese character the site uses (no network)')
    args = parser.parse_args()
    sys.exit(check() if args.check else build())
