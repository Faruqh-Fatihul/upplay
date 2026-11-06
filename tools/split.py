"""Pecah UpPlay satu-file menjadi index.html + css/*.css + js/*.js (urutan & perilaku sama)."""
import os, re, sys

src_path, out_dir = sys.argv[1], sys.argv[2]
html = open(src_path, encoding='utf-8').read()
os.makedirs(os.path.join(out_dir, 'css'), exist_ok=True)
os.makedirs(os.path.join(out_dir, 'js'), exist_ok=True)

out, i, n_css, n_js = [], 0, 0, 0
low = html.lower()
manifest = []

def slug(tag_open, kind, n):
    m = re.search(r'id\s*=\s*"([^"]+)"', tag_open)
    name = m.group(1) if m else ('main' if kind == 'js' else 'base')
    name = re.sub(r'[^a-zA-Z0-9_-]+', '-', name).strip('-').lower() or kind
    return '%02d-%s.%s' % (n, name, kind)

while True:
    nxt = [p for p in (low.find('<!--', i), low.find('<style', i), low.find('<script', i)) if p >= 0]
    if not nxt:
        out.append(html[i:]); break
    p = min(nxt)
    out.append(html[i:p])
    if low.startswith('<!--', p):
        e = low.find('-->', p) + 3
        out.append(html[p:e]); i = e; continue
    kind = 'css' if low.startswith('<style', p) else 'js'
    close = '</style>' if kind == 'css' else '</script>'
    te = low.find('>', p) + 1
    tag_open = html[p:te]
    e = low.find(close, te)
    body = html[te:e]
    end = e + len(close)
    if kind == 'js' and re.search(r'\ssrc\s*=', tag_open):
        out.append(html[p:end]); i = end; continue          # skrip eksternal tetap
    if kind == 'js' and re.search(r'type\s*=\s*"(?!text/javascript)', tag_open):
        out.append(html[p:end]); i = end; continue          # skrip non-JS tetap inline
    if kind == 'css':
        n_css += 1; fn = slug(tag_open, 'css', n_css)
        open(os.path.join(out_dir, 'css', fn), 'w', encoding='utf-8').write(body.strip('\n') + '\n')
        idm = re.search(r'id\s*=\s*"([^"]+)"', tag_open)
        out.append('<link rel="stylesheet" href="css/%s"%s>' % (fn, ' data-layer="%s"' % idm.group(1) if idm else ''))
    else:
        n_js += 1; fn = slug(tag_open, 'js', n_js)
        open(os.path.join(out_dir, 'js', fn), 'w', encoding='utf-8').write(body.strip('\n') + '\n')
        idm = re.search(r'id\s*=\s*"([^"]+)"', tag_open)
        out.append('<script src="js/%s"%s></script>' % (fn, ' data-layer="%s"' % idm.group(1) if idm else ''))
    manifest.append((kind, fn))
    i = end

open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(''.join(out))
print('css:', n_css, 'js:', n_js)
