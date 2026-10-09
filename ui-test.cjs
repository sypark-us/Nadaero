const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e));
let timers=[],serial=0,cancelled=new Set();
const dom=new JSDOM(html,{url:'https://nadaero.test',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.CSS={escape:s=>s};w.setTimeout=f=>{timers.push({f,id:++serial});return serial};w.clearTimeout=id=>cancelled.add(id)}});
const w=dom.window,d=w.document,e=s=>w.eval(s);
const click=s=>{assert(d.querySelector(s),'Missing '+s);d.querySelector(s).click()};
const flush=()=>{let n=0;while(timers.length){assert(++n<1000,'Runaway timer');const t=timers.shift();if(!cancelled.has(t.id))t.f()}};
click('#start');assert(d.querySelector('.map'));click('[data-n="1"]');click('#f');assert.equal(d.querySelectorAll('.grid').length,2);click('#go');flush();assert(d.querySelector('#intent').textContent.includes('다음 합 적 행동'));assert.equal(d.querySelectorAll('.card').length,4);
// All target flows are exercised with a controlled hand in the rendered battle.
e("B.hand=['집중 공격','선봉 명령','전열 교대','군령 비축'];B.cmd=4;save();");
e('renderBattle(B.node.id,true)');flush();
click('.card[data-i="0"]');assert(!d.querySelector('#target').hidden);click('[data-target]');flush();assert.equal(e('B.focusLeft'),2);assert(d.querySelector('#target').hidden);
click('.card[data-i="0"]');click('[data-target="hero"]');flush();assert.equal(e('B.first'),'hero');
click('.card[data-i="0"]');assert(d.querySelector('[data-target]'));click('[data-target]');flush();assert.equal(e('B.swapCount'),1);assert.equal(d.querySelectorAll('.grid').length,2);
click('[data-keep="0"]');assert.equal(e('B.keep'),0);click('#next');flush();assert.equal(e('B.round'),1);assert.equal(e('B.hand[0]'),'군령 비축');
const stored=w.localStorage.getItem('jinhyung-v2');e('S=null;B=null;boot({})');assert.equal(w.localStorage.getItem('jinhyung-v2'),stored);click('#cont');flush();assert.equal(e('B.round'),1);assert(d.querySelector('#intent'));
click('#skip');flush();assert.equal(e('B'),null);assert(d.querySelector('.sheet')||d.querySelector('#again'));
// Force a reward with both hero and officer level choices, then restore it.
e("S=fresh('테스트');S.hero.exp=35;vetOf('유비').xp=45;startBattle(NODES[1]);result(NODES[1],true,['hero','유비'])");
assert(d.querySelector('[data-o]'));d.querySelectorAll('.sheet').forEach(x=>x.remove());e('S=null;B=null;boot({})');click('#cont');assert(d.querySelector('[data-o]'));click('[data-o]');assert(d.querySelector('[data-k]'));click('[data-k="atk"]');assert(d.querySelector('[data-i]'));click('[data-i]');assert(!e('S.pending'));assert.equal(e('S.hero.atk'),10);
assert.deepEqual(errors,[]);console.log('PASS UI: start, formation, target cards, swap, hold, round, reload, result, reward restoration');dom.window.close();
