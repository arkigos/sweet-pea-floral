"""Builds one real page per design at p/<slug>/index.html from assets/products.js.

Run from the site folder:  python tools/build_pages.py
"""
import html, json, os, shutil

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = open(os.path.join(HERE, 'assets', 'products.js'), encoding='utf8').read()
SP = json.loads(raw[raw.index('{'):raw.rindex('}') + 1])
P = SP['products']
TEL = 'tel:+1' + ''.join(c for c in SP['phone'] if c.isdigit())

SECTION = {'everyday': 'Everyday flowers', 'sympathy': 'Sympathy & funeral', 'dance': 'Dance flowers', 'plants': 'Plants & gifts'}
LOOK = {'best': 'Best sellers', 'soft': 'Soft & pastel', 'bright': 'Bright', 'country': 'Country', 'fall': 'Fall colors',
        'service': 'For the service', 'home': 'For the home', 'casket': 'Casket sprays', 'wreath': 'Wreaths',
        'corsage': 'Corsages', 'bout': 'Boutonnieres'}
# where "back" goes: the reason this design is filed under on the home page
BACK = [('birthday', lambda p: 'birthday' in p['tags'], 'Flowers for a birthday'),
        ('anniversary', lambda p: 'anniversary' in p['tags'], 'Flowers for an anniversary'),
        ('because', lambda p: p['tags'][0] == 'everyday', 'Just because'),
        ('sympathy', lambda p: p['tags'][0] == 'sympathy', 'Sympathy flowers'),
        ('dance', lambda p: p['tags'][0] == 'dance', 'Flowers for the dance'),
        ('plants', lambda p: p['tags'][0] == 'plants', 'Plants & gifts')]

e = html.escape


def money(n):
    return '$' + (('%.2f' % n) if n % 1 else str(int(n)))


def low(p):
    return min([t[1] for t in p['tiers']] or [p['price']])


def frm(p):
    return ('from ' if len(p['tiers']) > 1 else '') + money(low(p))


ICON = {
    'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    'out': '<path d="M8 16 16 8M9 8h7v7"/>',
}


def ico(n):
    return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % ICON[n]


def page(p):
    sec = p['tags'][0]
    d = 0
    for i, t in enumerate(p['tiers']):
        if t[1] == p['price']:
            d = i
    shown = p['tiers'][d][1] if p['tiers'] else p['price']
    kick = ' · '.join([SECTION[sec]] + [LOOK[t] for t in p['tags'][1:] if t in LOOK])
    back = next(b for b in BACK if b[1](p))
    rel = sorted([x for x in P if x is not p and x['tags'][0] == sec and not x['oos']],
                 key=lambda x: -(len(set(x['tags']) & set(p['tags'])) - abs(low(x) - low(p)) / 400))[:3]
    if sec == 'dance':
        nxt = ['The order button takes you to this design in our store. Choose your size there.',
               'Choose pickup and pick the day.',
               'Pick it up at the shop Friday 10 to 4 or Saturday 10 to 2.']
    else:
        nxt = ['The order button takes you to this design in our store. Choose your size there.',
               'Choose delivery or pickup and pick the day. You can add something special if you like.',
               'We make it by hand, then deliver it or have it ready for you at the shop. ' + SP['policy']['substitution']]
    tiers = ''
    if len(p['tiers']) > 1:
        tiers = '<div class="pills" role="radiogroup" aria-label="Size">' + ''.join(
            '<label><input type="radio" name="tier" data-tier="%s" value="%s"%s><span>%s<b>%s</b></span></label>'
            % (e(t[0]), t[1], ' checked' if i == d else '', e(t[0]), money(t[1])) for i, t in enumerate(p['tiers'])) + '</div>'
    small = 'Sold out right now' if p['oos'] else (e(p['tiers'][d][0]) if len(p['tiers']) > 1 else '')
    if p['oos']:
        acts = '<a class="btn" href="%s">%sCall to ask about this one</a>' % (TEL, ico('phone'))
    else:
        acts = ('<a class="btn" href="%s" target="_blank" rel="noopener">Order this %s</a>'
                '<a class="btn gl" href="%s">%sCall instead</a>') % (e(p['url']), ico('out'), TEL, ico('phone'))
    today = '' if sec == 'dance' else '<p class="today"><i class="dot" data-live="dot"></i><span data-live="deliv"></span></p>'
    relh = ''
    if rel:
        relh = '<p class="mono" style="margin-top:26px">More like this</p><div class="rel">' + ''.join(
            '<a href="../%s/"><img loading="lazy" src="../../%s" alt="">%s<span>%s</span></a>' % (x['slug'], x['img'], e(x['name']), frm(x))
            for x in rel) + '</div>'
    desc = e(p['desc'])
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#f6eedf">
<title>{e(p['name'])} | Sweet Pea Floral</title>
<meta name="description" content="{desc}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 29C9 22 6 17 6 12a10 10 0 0 1 20 0c0 5-3 10-10 17z' fill='%23a4527c'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lobster&family=Caveat:wght@500;600;700&family=IM+Fell+English:ital@0;1&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<link rel="stylesheet" href="../../assets/site.css">
</head>
<body>
<header class="top wrap">
  <a class="word" href="../../"><svg class="sprig" viewBox="0 0 120 210" width="19" height="33" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M62 206C54 160 72 120 58 78 50 52 64 30 60 8"/></g><g fill="currentColor" opacity=".85"><path d="M60 170C40 166 26 152 24 138c18 2 32 14 36 32z"/><path d="M63 150c18-6 30-20 30-34-17 3-29 16-30 34z"/><path d="M58 104C40 102 28 90 26 78c16 1 29 11 32 26z"/><path d="M60 52c12-6 19-17 18-27-12 4-19 14-18 27z"/></g><ellipse cx="88" cy="88" rx="13" ry="10" fill="#c9868c"/><ellipse cx="30" cy="46" rx="12" ry="9" fill="#d9a5ad"/><ellipse cx="62" cy="10" rx="8" ry="9" fill="#c9868c"/></svg>Sweet Pea <b>Floral</b></a>
  <a class="live" href="../../#visit"><i class="dot" data-live="dot"></i><span><span class="pre" data-live="pre"></span><span data-live="open">American Fork</span></span></a>
  <a class="btn sm" href="{TEL}" aria-label="Call the shop">{ico('phone')}<span>{SP['phone']}</span></a>
</header>
<main class="wrap">
  <a class="back" href="../../#/for/{back[0]}">&larr; {back[2]}</a>
  <article class="pp">
    <div class="shot"><img src="../../{p['img']}" alt="{e(p['name'])}"></div>
    <div>
      <p class="mono">{e(kick)}</p>
      <h1>{e(p['name'])}</h1>
      <p class="price"><span id="pr">{money(shown)}</span><small id="tn">{small}</small></p>
      <p class="desc">{desc}</p>
      {tiers}
      {today}
      <div class="acts">{acts}</div>
      <p class="mono" style="margin-top:30px">What happens next</p>
      <ol class="next">{''.join('<li><span>%s</span></li>' % e(n) for n in nxt)}</ol>
      {relh}
    </div>
  </article>
</main>
<footer><div class="wrap">
  <span>Sweet Pea Floral · {e(SP['address'])}</span>
  <a href="https://www.instagram.com/sweet_pea_floral/" target="_blank" rel="noopener">Instagram</a>
  <a href="https://www.facebook.com/sweetpeafloralandgift" target="_blank" rel="noopener">Facebook</a>
  <span>Design prototype. Ordering opens the shop's current store.</span>
</div></footer>
<script src="../../assets/page.js"></script>
</body>
</html>
'''


out = os.path.join(HERE, 'p')
if os.path.isdir(out):
    shutil.rmtree(out)
for p in P:
    d = os.path.join(out, p['slug'])
    os.makedirs(d)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf8').write(page(p))
print('built', len(P), 'pages')
