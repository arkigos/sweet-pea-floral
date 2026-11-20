/* The basket: what, delivery or pickup, when, and the card. Stops before payment.
   Everything stays in this browser (localStorage). Nothing is sent anywhere. */
(function(){
'use strict';
var SP=window.SP;if(!SP)return;
var ROOT=new URL('..',document.currentScript.src).href,by={};SP.products.forEach(function(p){by[p.slug]=p});
var TEL='tel:+1'+SP.phone.replace(/\D/g,''),KEY='sp-basket-v1';

/* Shop rules. The zip list and holidays are assumptions to confirm with the shop. */
var CUTOFF=12*60;                       /* same-day delivery if ordered before noon, shop time */
var ZIPS={'84003':'American Fork','84004':'Alpine','84043':'Lehi','84048':'Lehi','84062':'Pleasant Grove','84042':'Lindon',
  '84057':'Orem','84058':'Orem','84059':'Orem','84097':'Orem','84601':'Provo','84602':'Provo','84604':'Provo','84606':'Provo',
  '84045':'Saratoga Springs','84663':'Springville','84660':'Spanish Fork','84664':'Mapleton'};
function holiday(y,m,d){
  if((m===1&&d===1)||(m===7&&d===4)||(m===12&&d===25))return true;
  if(m===11){var first=new Date(Date.UTC(y,10,1)).getUTCDay(),thu=1+((4-first+7)%7)+21;return d===thu}  /* Thanksgiving */
  return false;
}

var st={items:[],mode:'',zip:'',date:'',note:''};
try{var raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&raw.items){st=raw;st.items=st.items.filter(function(i){return by[i.slug]})}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function $(n){return '$'+(n%1?n.toFixed(2):n)}
function count(){return st.items.reduce(function(a,i){return a+i.qty},0)}
function subtotal(){return st.items.reduce(function(a,i){return a+i.qty*i.price},0)}
function hasDance(){return st.items.some(function(i){return by[i.slug].tags[0]==='dance'})}
function mode(){return hasDance()?'pickup':st.mode}

/* dates, in the shop's time zone */
var DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function now(){var o={};new Intl.DateTimeFormat('en-US',{timeZone:SP.tz,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){o[p.type]=+p.value});
  return{y:o.year,m:o.month,d:o.day,min:(o.hour%24)*60+o.minute}}
function dates(){
  var n=now(),md=mode(),dance=hasDance(),out=[];
  for(var i=0;i<45&&out.length<9;i++){
    var t=new Date(Date.UTC(n.y,n.m-1,n.d+i)),dow=t.getUTCDay(),h=SP.hours[dow],y=t.getUTCFullYear(),m=t.getUTCMonth()+1,d=t.getUTCDate();
    if(!h||holiday(y,m,d))continue;
    if(dance&&dow!==5&&dow!==6)continue;
    if(i===0&&(md==='pickup'?n.min>=h[1]*60-30:n.min>=CUTOFF))continue;
    out.push({iso:y+'-'+('0'+m).slice(-2)+'-'+('0'+d).slice(-2),label:i===0?'Today':i===1?'Tomorrow':DOW[dow]+', '+MON[m-1]+' '+d,
      long:(i===0?'today, ':i===1?'tomorrow, ':'')+['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow]+' '+MON[m-1]+' '+d,hours:h});
  }
  return out;
}
function hr(h){return (h>12?h-12:h)+(h>=12?' pm':' am')}
function ready(){var md=mode(),ds=dates();return st.items.length&&md&&ds.some(function(d){return d.iso===st.date})&&(md==='pickup'||!!ZIPS[st.zip])}

/* markup */
var ICON={basket:'<path d="M4 10h16l-1.6 9H5.6zM9 10l3-6 3 6"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>',out:'<path d="M8 16 16 8M9 8h7v7"/>',phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'};
function ico(n){return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">'+ICON[n]+'</svg>'}
var btn=document.createElement('button');btn.type='button';btn.className='btn gl sm bk-open';btn.setAttribute('aria-label','Open your basket');
var top=document.querySelector('.top'),call=top&&top.querySelector('.btn');if(top)top.insertBefore(btn,call);
var wrap=document.createElement('div');wrap.className='bk';wrap.hidden=true;
wrap.innerHTML='<div class="bk-panel" role="dialog" aria-modal="true" aria-label="Your basket"><header><h2>Your basket</h2><button class="rnd" type="button" data-bk-close aria-label="Close basket">'+ico('x')+'</button></header><div class="bk-body"></div></div>';
document.body.appendChild(wrap);
var body=wrap.querySelector('.bk-body'),paying=false,lastFocus=null;

function paintBtn(){var c=count();btn.innerHTML=ico('basket')+'<span>Basket</span>'+(c?'<b>'+c+'</b>':'')}
function zipMsg(){
  if(!st.zip)return '';
  if(st.zip.length<5)return '<span class="bk-hint">Five digits, please.</span>';
  return ZIPS[st.zip]?'<span class="bk-ok">Yes, we deliver to '+ZIPS[st.zip]+'.</span>':'<span class="bk-no">That zip is outside our delivery area. Call us at <a href="'+TEL+'">'+SP.phone+'</a> and we will see what we can do.</span>';
}
function foot(){
  var md=mode(),ds=dates(),d=ds.filter(function(x){return x.iso===st.date})[0],need=[];
  if(!md)need.push('delivery or pickup');else if(md==='delivery'&&!ZIPS[st.zip])need.push('a zip code we deliver to');
  if(!d)need.push('a day');
  if(paying&&ready())return '<div class="bk-pay"><p class="mono">this is where payment goes</p><p><b>Payment is not connected yet.</b> This is a preview of the new way to order, so nothing has been ordered or sent.</p><p>To order today, use our current store or call.</p>'+
    st.items.map(function(i){var p=by[i.slug];return '<a class="btn gl sm" href="'+p.url+'" target="_blank" rel="noopener">'+esc(p.name)+' on our current store '+ico('out')+'</a>'}).join('')+
    '<a class="btn sm" href="'+TEL+'">'+ico('phone')+'Call '+SP.phone+'</a><button class="bk-link" type="button" data-bk-back>Back to the basket</button></div>';
  return '<dl class="bk-sum"><div><dt>Flowers</dt><dd>'+$(subtotal())+'</dd></div>'+
    '<div><dt>'+(md==='pickup'?'Pickup':'Delivery')+'</dt><dd>'+(md==='pickup'?'at the shop, no charge':'fee added at payment')+'</dd></div>'+
    '<div><dt>Tax</dt><dd>added at payment</dd></div></dl>'+
    (ready()?'<p class="bk-recap">'+(md==='pickup'?'Ready for pickup ':'Delivered to '+ZIPS[st.zip]+' ')+esc(d.long)+'.</p>':'<p class="bk-hint">Still needed: '+need.join(' and ')+'.</p>')+
    '<button class="btn" type="button" data-bk-pay'+(ready()?'':' disabled')+'>Continue to payment</button>';
}
function render(){
  paintBtn();
  if(!st.items.length){body.innerHTML='<div class="bk-empty"><p class="mono">nothing in here yet</p><p>Find something you like and add it. Or tell us the occasion and budget and we will design it.</p><a class="btn gl" href="'+SP.designersChoice.url+'" target="_blank" rel="noopener">Designer\'s Choice from $'+SP.designersChoice.from_+'</a></div>';return}
  var md=mode(),dance=hasDance(),ds=dates();
  if(st.date&&!ds.some(function(d){return d.iso===st.date})){st.date='';save()}
  body.innerHTML=
  '<ul class="bk-items">'+st.items.map(function(i,k){var p=by[i.slug];return '<li><img src="'+ROOT+p.img+'" alt=""><div><b>'+esc(p.name)+'</b><span>'+(i.tier?esc(i.tier)+' · ':'')+$(i.price)+'</span>'+
    '<div class="bk-qty"><button type="button" data-bk-qty="'+k+':-1" aria-label="One fewer">−</button><i>'+i.qty+'</i><button type="button" data-bk-qty="'+k+':1" aria-label="One more">+</button><button class="bk-link" type="button" data-bk-qty="'+k+':0">Remove</button></div></div></li>'}).join('')+'</ul>'+

  '<section><p class="mono">how should it get there?</p>'+
  (dance?'<p class="bk-note">Dance flowers are pickup only, Friday 10 to 4 or Saturday 10 to 2'+(st.items.length>1?', so this whole basket is set to pickup.':'.')+'</p>':
   '<div class="bk-seg"><button class="pill" type="button" data-bk-mode="delivery" aria-pressed="'+(md==='delivery')+'">Deliver it</button><button class="pill" type="button" data-bk-mode="pickup" aria-pressed="'+(md==='pickup')+'">I will pick it up</button></div>')+
  (md==='delivery'?'<label class="bk-zip">Zip code it is going to<input id="bk-zip" inputmode="numeric" autocomplete="off" maxlength="5" value="'+esc(st.zip)+'" placeholder="84003"></label><p id="bk-zipmsg" aria-live="polite">'+zipMsg()+'</p>':'')+
  (md==='pickup'?'<p class="bk-note">Pick up at '+esc(SP.address)+'.</p>':'')+'</section>'+

  (md?'<section><p class="mono">'+(md==='pickup'?'what day will you come by?':'what day should it arrive?')+'</p><div class="bk-days">'+ds.map(function(d){return '<button class="pill" type="button" data-bk-date="'+d.iso+'" aria-pressed="'+(st.date===d.iso)+'">'+d.label+'</button>'}).join('')+'</div>'+
   (md==='pickup'&&st.date?'<p class="bk-note">We are open '+(function(d){return hr(d.hours[0])+' to '+hr(d.hours[1])})(ds.filter(function(d){return d.iso===st.date})[0])+' that day.</p>':'')+
   (md==='delivery'?'<p class="bk-hint">Order by noon for delivery the same day. Later than these days? Call us.</p>':'')+'</section>':'')+

  '<section><p class="mono">what should the card say?</p><div class="bk-card"><textarea id="bk-note" maxlength="200" rows="4" placeholder="Happy birthday, Mom. Love you." aria-label="Card message">'+esc(st.note)+'</textarea></div><p class="bk-hint"><span id="bk-left">'+(200-st.note.length)+'</span> characters left. Leave it blank for no card.</p></section>'+
  '<div id="bk-foot" class="bk-foot">'+foot()+'</div>';
}
function paintFoot(){var f=document.getElementById('bk-foot');if(f)f.innerHTML=foot()}

function open(){lastFocus=document.activeElement;paying=false;render();wrap.hidden=false;document.documentElement.classList.add('bk-lock');requestAnimationFrame(function(){wrap.classList.add('on')});wrap.querySelector('[data-bk-close]').focus({preventScroll:true})}
function close(){wrap.classList.remove('on');document.documentElement.classList.remove('bk-lock');setTimeout(function(){wrap.hidden=true},260);if(lastFocus&&lastFocus.focus)lastFocus.focus({preventScroll:true})}
function add(slug,tier,price){
  var p=by[slug];if(!p||p.oos)return;
  var it=st.items.filter(function(i){return i.slug===slug&&i.tier===tier})[0];
  if(it)it.qty=Math.min(9,it.qty+1);else st.items.push({slug:slug,tier:tier,price:price,qty:1});
  save();open();
}

document.addEventListener('click',function(e){
  var t=e.target.closest('[data-add],.bk-open,[data-bk-close],[data-bk-qty],[data-bk-mode],[data-bk-date],[data-bk-pay],[data-bk-back]');
  if(!t){if(e.target===wrap)close();return}
  if(t.dataset.add){
    var p=by[t.dataset.add],box=t.closest('.d-body,.pp')||document,r=box.querySelector('input[name=tier]:checked');
    var tier=r?r.dataset.tier:(p.tiers.length?(p.tiers.filter(function(x){return x[1]===p.price})[0]||p.tiers[0])[0]:''),price=r?+r.value:p.price;
    add(p.slug,tier,price);
  }
  else if(t.classList.contains('bk-open'))open();
  else if('bkClose' in t.dataset)close();
  else if(t.dataset.bkQty){var a=t.dataset.bkQty.split(':'),k=+a[0],dq=+a[1];if(dq===0)st.items.splice(k,1);else{st.items[k].qty=Math.max(1,Math.min(9,st.items[k].qty+dq))}paying=false;save();render()}
  else if(t.dataset.bkMode){st.mode=t.dataset.bkMode;paying=false;save();render()}
  else if(t.dataset.bkDate){st.date=t.dataset.bkDate;paying=false;save();render()}
  else if('bkPay' in t.dataset){if(ready()){paying=true;paintFoot();document.getElementById('bk-foot').scrollIntoView({block:'end'})}}
  else if('bkBack' in t.dataset){paying=false;paintFoot()}
});
wrap.addEventListener('input',function(e){
  if(e.target.id==='bk-zip'){st.zip=e.target.value.replace(/\D/g,'').slice(0,5);if(e.target.value!==st.zip)e.target.value=st.zip;paying=false;save();document.getElementById('bk-zipmsg').innerHTML=zipMsg();paintFoot()}
  else if(e.target.id==='bk-note'){st.note=e.target.value.slice(0,200);save();document.getElementById('bk-left').textContent=200-st.note.length}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!wrap.hidden){e.stopImmediatePropagation();close()}},true);
paintBtn();
window.SPCart={add:add,open:open};
})();
