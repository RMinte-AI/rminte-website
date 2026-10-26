#!/usr/bin/env python3
"""Dedicated complete PDF font; never rewrites the site's UI subset."""
from pathlib import Path
import hashlib,json,shutil,urllib.request
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parents[2]
DEST=Path(__file__).resolve().parent/'document-assets'
CACHE=ROOT/'.font-cache'
SHA='a85815a42757630ce188fdad368c2dfc444d4773'
name='NotoSansSC-wght-a85815a4.ttf'
DEST.mkdir(exist_ok=True);CACHE.mkdir(exist_ok=True)
source=CACHE/name
if not source.exists():urllib.request.urlretrieve(f'https://raw.githubusercontent.com/google/fonts/{SHA}/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',source)
font=TTFont(source);font=instantiateVariableFont(font,{'wght':400},inplace=True)
points=sorted(font.getBestCmap())
font.flavor='woff2';file=DEST/'loan-sc.woff2';font.save(file)
license=CACHE/'NotoSansSC-OFL-a85815a4.txt'
if not license.exists():urllib.request.urlretrieve(f'https://raw.githubusercontent.com/google/fonts/{SHA}/ofl/notosanssc/OFL.txt',license)
shutil.copy2(license,DEST/'OFL.txt');shutil.copy2(ROOT/'website/sample-loan/assets/logo-print.svg',DEST/'logo.svg')
fonts=[{'family':'LoanSC','weight':400,'file':'loan-sc.woff2','sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'source':f'https://github.com/google/fonts/tree/{SHA}/ofl/notosanssc','license':'OFL.txt'}]
jp=CACHE/'NotoSansJP-wght-a85815a4.ttf';jp_license=CACHE/'NotoSansJP-OFL-a85815a4.txt'
if not jp.exists():urllib.request.urlretrieve(f'https://raw.githubusercontent.com/google/fonts/{SHA}/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',jp)
if not jp_license.exists():urllib.request.urlretrieve(f'https://raw.githubusercontent.com/google/fonts/{SHA}/ofl/notosansjp/OFL.txt',jp_license)
ext=TTFont(jp);ext=instantiateVariableFont(ext,{'wght':400},inplace=True);points=sorted(set(points)|set(ext.getBestCmap()));ext.flavor='woff2';fallback=DEST/'loan-ext.woff2';ext.save(fallback);shutil.copy2(jp_license,DEST/'OFL-JP.txt')
fonts.append({'family':'LoanExt','weight':400,'file':fallback.name,'sha256':hashlib.sha256(fallback.read_bytes()).hexdigest(),'source':f'https://github.com/google/fonts/tree/{SHA}/ofl/notosansjp','license':'OFL-JP.txt'})
manifest={'fonts':fonts,'codepoints':points}
(DEST/'manifest.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
print('Complete PDF fonts:',file.stat().st_size+fallback.stat().st_size,'bytes;',len(points),'codepoints; test 𠮷:',0x20BB7 in points)

# Preserve upstream license text while removing diff-only trailing whitespace.
for name in ('OFL.txt', 'OFL-JP.txt'):
    target=DEST/name
    target.write_text('\n'.join(line.rstrip() for line in target.read_text().splitlines())+'\n')
