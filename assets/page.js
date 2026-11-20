/* Design pages: live shop status (Mountain Time) and the size picker. */
(function(){
'use strict';
var TZ='America/Denver',HOURS=[null,[10,16],[10,16],[10,16],[10,16],[10,16],[10,14]];
var DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function now(){var o={};new Intl.DateTimeFormat('en-US',{timeZone:TZ,weekday:'long',hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){o[p.type]=p.value});return{d:DAYS.indexOf(o.weekday),m:(+o.hour%24)*60+ +o.minute}}
function hr(h){return (h>12?h-12:h)+(h>=12?' pm':' am')}
function nextOpen(d){for(var i=1;i<=7;i++){var k=(d+i)%7;if(HOURS[k])return{k:k,i:i}}}
function status(){
  var n=now(),h=HOURS[n.d],r={pre:''};
  if(h&&n.m>=h[0]*60&&n.m<h[1]*60){r.open=true;r.line='Open until '+hr(h[1])}
  else if(h&&n.m<h[0]*60)r.line='Opens '+hr(h[0]);
  else{var x=nextOpen(n.d);r.line='Opens '+(x.i===1?'tomorrow':DAYS[x.k].slice(0,3))+' '+hr(HOURS[x.k][0])}
  if(h&&n.m<720){var left=720-n.m,t=(left>=60?Math.floor(left/60)+' h ':'')+(left%60)+' min';r.sameDay=true;r.deliv='Order in the next '+t+' for delivery today.';r.pre='Delivery ';r.line='today · order in '+t.replace(' h ','h ').replace(' min','m')}
  else{var y=nextOpen(n.d);r.deliv=(h?'Past noon? Call and we will check on today. ':'')+'Next delivery day: '+(y.i===1?'tomorrow':DAYS[y.k])+'.'}
  return r;
}
function tick(){
  var s=status();
  document.querySelectorAll('[data-live]').forEach(function(e){var k=e.dataset.live;
    if(k==='dot')e.classList.toggle('on',!!(s.open||s.sameDay));else if(k==='open')e.textContent=s.line;else if(k==='pre')e.textContent=s.pre;else if(k==='deliv')e.textContent=s.deliv});
}
tick();setInterval(tick,30000);
document.addEventListener('change',function(e){var r=e.target;if(r.name!=='tier')return;
  var n=+r.value;document.getElementById('pr').textContent='$'+(n%1?n.toFixed(2):n);document.getElementById('tn').textContent=r.dataset.tier});
})();
