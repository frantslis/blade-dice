const WORDS=[{1:'Soul/Acid',2:'Royale/Frontside',3:'Miszou/P-star',4:'Topside',5:'Torque/Makio',6:'Air Spin/Grab'},{1:'Regular',2:'Switch',3:'Fakie',4:'Alley-Oop',5:'Truespin',6:'Out'}];
const PIPS={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
const ROT={1:[90,0],2:[0,0],3:[0,-90],4:[0,90],5:[180,0],6:[-90,0]};
const stage=document.getElementById('stage'),btn=document.getElementById('btn'),out=document.getElementById('out');
const slots=[];
const cores=[1,2,3,4,5,6].map(k=>'<div class="core c'+k+'"></div>').join('');
for(let i=0;i<2;i++){
  const slot=document.createElement('div');slot.className='slot';
  let faces='';
  for(let f=1;f<=6;f++){
    let cells='';
    const parts=WORDS[i][f].split('/').map(p=>p.trim()),mx=Math.max(...parts.map(p=>p.length));
    cells='<b class="word"'+(mx>9?' style="font-size:calc(var(--s)*.12)"':'')+'>'+parts.join('<br>')+'</b>';
    faces+='<div class="face w f'+f+'">'+cells+'</div>';
  }
  slot.innerHTML='<div class="shadow"></div><div class="drop"><div class="cube">'+faces+cores+'</div></div>';
  stage.appendChild(slot);
  slots.push({shadow:slot.querySelector('.shadow'),drop:slot.querySelector('.drop'),cube:slot.querySelector('.cube')});
}
const rnd=()=>Math.random();
function finalT(v,yaw){const[a,b]=ROT[v];return[`rotateY(${yaw}deg) rotateX(${a}deg) rotateZ(${b}deg)`,a,b];}
slots.forEach(s=>{const v=1+Math.floor(rnd()*6);setHit(s,v);s.cube.style.transform=finalT(v,rnd()*360-180)[0];});
function setHit(s,v){s.cube.querySelectorAll('.face').forEach(f=>f.classList.toggle('hit',f.classList.contains('f'+v)));}
let busy=false;
function roll(){
  if(busy)return;busy=true;btn.disabled=true;out.textContent='';
  const vals=[];
  slots.forEach((s,i)=>{
    const v=1+Math.floor(rnd()*6);vals.push(v);setHit(s,v);
    const yaw=rnd()*360-180;
    const[end,a,b]=finalT(v,yaw);
    const sp=()=>360*(1+Math.floor(rnd()*2))*(rnd()<.5?1:-1);
    const start=`rotateY(${yaw+sp()}deg) rotateX(${a+sp()}deg) rotateZ(${b+sp()}deg)`;
    s.cube.style.transform=end;
    const delay=i*160,dur=1400;
    s.cube.animate([{transform:start},{transform:end}],{duration:1150,delay,easing:'cubic-bezier(.25,.6,.35,1)',fill:'backwards'});
    s.drop.animate([
      {transform:'translateY(-750px)',offset:0,easing:'cubic-bezier(.5,0,1,.7)'},
      {transform:'translateY(0)',offset:.5,easing:'cubic-bezier(0,.6,.5,1)'},
      {transform:'translateY(-55px)',offset:.68,easing:'cubic-bezier(.5,0,1,.7)'},
      {transform:'translateY(0)',offset:.82,easing:'cubic-bezier(0,.6,.5,1)'},
      {transform:'translateY(-12px)',offset:.91,easing:'cubic-bezier(.5,0,1,.7)'},
      {transform:'translateY(0)',offset:1}
    ],{duration:dur,delay,fill:'backwards'});
    const base='translateY(calc(var(--s)/2)) rotateX(90deg)';
    s.shadow.animate([
      {transform:base+' scale(.3)',opacity:0,offset:0},
      {transform:base+' scale(1)',opacity:1,offset:.5},
      {transform:base+' scale(.8)',opacity:.6,offset:.68},
      {transform:base+' scale(1)',opacity:1,offset:.82},
      {transform:base+' scale(.95)',opacity:.85,offset:.91},
      {transform:base+' scale(1)',opacity:1,offset:1}
    ],{duration:dur,delay,fill:'backwards'});
  });
  setTimeout(()=>{
    out.textContent=vals.map((v,i)=>WORDS[i][v].split('/').map(p=>p.trim()).join(' ')).join('\n');fitOut();
    try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}
    busy=false;btn.disabled=false;
  },1400+160+60);
}
btn.addEventListener('click',roll);
const tabs=document.querySelectorAll('.tab');
tabs.forEach(t=>t.addEventListener('click',()=>{
  tabs.forEach(x=>x.classList.toggle('on',x===t));
  document.getElementById('game').hidden=t.dataset.v!=='game';
  document.getElementById('rules').hidden=t.dataset.v!=='rules';
  if(t.dataset.v==='game')fitOut();
}));
function fitOut(){
  const box=document.getElementById('outBox');
  let fs=40;out.style.fontSize=fs+'px';
  while((out.offsetWidth>box.clientWidth||out.offsetHeight>box.clientHeight)&&fs>12){fs--;out.style.fontSize=fs+'px';}
}
window.addEventListener('resize',fitOut);
const langBtns=document.querySelectorAll('.seg button');
function setLang(l){
  langBtns.forEach(b=>b.classList.toggle('on',b.dataset.l===l));
  document.getElementById('r-ua').hidden=l!=='ua';
  document.getElementById('r-en').hidden=l!=='en';
  document.querySelector('.rbody').scrollTop=0;
  try{localStorage.setItem('blade-lang',l);}catch(e){}
}
langBtns.forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.l)));
let savedLang='ua';
try{savedLang=localStorage.getItem('blade-lang')||'ua';}catch(e){}
setLang(savedLang==='en'?'en':'ua');
