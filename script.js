const SIDES={1:'side1',2:'side2',3:'side3',4:'side4',5:'side5',6:'side6'};
const IGO1=['Alleyoop/(inspin 180)','In spin/360','Truspin/(outspin 180)','Out spin/360','Half cab/(in spin 180)','Full cab/(in spin 360)','Fakie/out spin 180','Fakie/outspin 360','Fakie/(zero spin)','Darkside','Disaster'];
const IGO3=['Zero spin','180','360','180/re-wind','360/re-wind','540','540/re-wind'];
const IGO2=["Acid", "Citric Acid", "Hot Dog", "Makio", "Mistrial", "Mizou", "Negative Tea Kettle", "PStar", "Sidewalk", "Soul", "Stub Soul", "Tea Kettle", "Torque Soul", "X Grind", "Negative Miszou", "Negative Mistral", "Negative P-star", "Negative Soul", "Negative Acid", "Negative makio", "switch Acid", "switch Citric Acid", "switch Hot Dog", "switch Makio", "switch Mistrial", "switch Mizou", "switch Negative Tea Kettle", "switch PStar", "switch Sidewalk", "switch Soul", "switch Stub Soul", "switch Tea Kettle", "switch Torque Soul", "switch X Grind", "switch Negative Miszou", "switch Negative Mistral", "switch Negative P-star", "switch Negative Soul", "switch Negative Acid", "switch Negative makio", "Backside", "Backside Backslide", "Backside Cab driver", "Backside Darkslide", "Backside Fastslide", "Backside Full Torque", "Backside Pudslide", "Backside Royale", "Backside Tabernacle", "Backside Torque", "Backside Unity", "Backside Wheelbarrow", "Backslide", "Cab driver", "Darkslide", "Fastslide", "Frontside", "Full Torque", "Pudslide", "Royale", "Tabernacle", "Torque", "Unity", "Wheelbarrow", "switch Backside", "switch Backside Backslide", "switch Backside Cab driver", "switch Backside Darkslide", "switch Backside Fastslide", "switch Backside Full Torque", "switch Backside Pudslide", "switch Backside Royale", "switch Backside Tabernacle", "switch Backside Torque", "switch Backside Unity", "switch Backside Wheelbarrow", "switch Backslide", "switch Cab driver", "switch Darkslide", "switch Fastslide", "switch Frontside", "switch Full Torque", "switch Pudslide", "switch Royale", "switch Tabernacle", "switch Torque", "switch Unity", "switch Wheelbarrow", "Backside Savannah (AO BS Unity)", "Cloudy Night (AO Topside PStar)", "Fishbrain (Topside Makio)", "Kindgrind (AO Topside Mizou)", "Misfit (AO Topside Mistrial)", "Overpuss (Topside Mistrial)", "Savannah (AO Unity)", "Soyale (AO Torque Soul)", "Sunny Day (Topside PStar)", "Sweatstance (Topside Mizou)", "UFO (Low FS or BS)", "Top soul", "Top acid", "switch Backside Savannah (AO BS Unity)", "switch Cloudy Night (AO Topside PStar)", "switch Fishbrain (Topside Makio)", "switch Kindgrind (AO Topside Mizou)", "switch Misfit (AO Topside Mistrial)", "switch Overpuss (Topside Mistrial)", "switch Savannah (AO Unity)", "switch Soyale (AO Torque Soul)", "switch Sunny Day (Topside PStar)", "switch Sweatstance (Topside Mizou)", "switch UFO (Low FS or BS)", "switch Top soul", "switch Top acid"];
const MODES={
  classic:{n:2,words:[{1:'Soul/Acid',2:'Royale/Frontside',3:'Miszou/P-star',4:'Topside',5:'Torque/Makio',6:'Air Spin/Grab'},{1:'Regular',2:'Switch',3:'Fakie',4:'Alley-Oop',5:'Truespin',6:'Out'}]},
  igo:{n:3,words:[SIDES,SIDES,SIDES],lists:[IGO1,IGO2,IGO3]}
};
const ROT={1:[90,0],2:[0,0],3:[0,-90],4:[0,90],5:[180,0],6:[-90,0]};
const game=document.getElementById('game'),stage=document.getElementById('stage'),btn=document.getElementById('btn'),out=document.getElementById('out');
const slots=[];
let WORDS=MODES.classic.words,busy=false,gen=0;
const cores=[1,2,3,4,5,6].map(k=>'<div class="core c'+k+'"></div>').join('');
const rnd=()=>Math.random();
function finalT(v,yaw){const[a,b]=ROT[v];return[`rotateY(${yaw}deg) rotateX(${a}deg) rotateZ(${b}deg)`,a,b];}
function setHit(s,v){s.cube.querySelectorAll('.face').forEach(f=>f.classList.toggle('hit',f.classList.contains('f'+v)));}
function wrapWords(t,W){
  const o=[];let c='';
  t.split(/\s+/).forEach(w=>{if(c&&(c+' '+w).length>W){o.push(c);c=w;}else c=c?c+' '+w:w;});
  if(c)o.push(c);return o;
}
function wordHTML(txt){
  let parts;
  if(txt.includes('/'))parts=txt.split('/').map(p=>p.trim());
  else{const i=txt.indexOf(' (');parts=i>0?wrapWords(txt.slice(0,i),11).concat(wrapWords(txt.slice(i+1),11)):wrapWords(txt,11);}
  const mx=Math.max(...parts.map(p=>p.length)),f=Math.min(.145,.85/(mx*.6),.8/(parts.length*1.2));
  return '<b class="word" style="font-size:calc(var(--s)*'+f.toFixed(3)+')">'+parts.join('<br>')+'</b>';
}
function faceNormals(v,yaw){
  const[a,b]=ROT[v],N={1:[0,0,1],6:[0,0,-1],3:[1,0,0],4:[-1,0,0],2:[0,-1,0],5:[0,1,0]},r=d=>d*Math.PI/180;
  const cz=Math.cos(r(b)),sz=Math.sin(r(b)),cx=Math.cos(r(a)),sx=Math.sin(r(a)),cy=Math.cos(r(yaw)),sy=Math.sin(r(yaw));
  const out={};
  for(const f in N){
    let[x,y,z]=N[f];
    [x,y]=[x*cz-y*sz,x*sz+y*cz];
    [y,z]=[y*cx-z*sx,y*sx+z*cx];
    [x,z]=[x*cy+z*sy,-x*sy+z*cy];
    out[f]={x,y,z};
  }
  return out;
}
function assignList(s,v,yaw,idx){
  const r=faceNormals(v,yaw),L=s.list.length,at=k=>s.list[((idx+k)%L+L)%L],all=[1,2,3,4,5,6];
  const side=all.filter(f=>f!==v&&Math.abs(r[f].y)<.5);
  const fr=side.filter(f=>r[f].z>0).sort((p,q)=>r[p].x-r[q].x),bk=side.filter(f=>r[f].z<=0).sort((p,q)=>r[p].x-r[q].x);
  const bot=all.find(f=>r[f].y>.5);
  const map={[v]:0,[fr[0]]:-1,[fr[1]]:1,[bk[0]]:-2,[bk[1]]:2,[bot]:5};
  for(const f in map)s.cube.querySelector('.face.f'+f).innerHTML=wordHTML(at(map[f]));
}
function buildGame(key){
  const m=MODES[key];gen++;busy=false;btn.disabled=false;
  WORDS=m.words;game.dataset.n=m.n;out.textContent='';
  stage.innerHTML='';slots.length=0;
  for(let i=0;i<m.n;i++){
    const slot=document.createElement('div');slot.className='slot';
    let faces='';
    for(let f=1;f<=6;f++){
      faces+='<div class="face w f'+f+'">'+wordHTML(WORDS[i][f])+'</div>';
    }
    slot.innerHTML='<div class="shadow"></div><div class="drop"><div class="cube">'+faces+cores+'</div></div>';
    stage.appendChild(slot);
    slots.push({shadow:slot.querySelector('.shadow'),drop:slot.querySelector('.drop'),cube:slot.querySelector('.cube'),list:m.lists&&m.lists[i]});
  }
  slots.forEach(s=>{
    const v=1+Math.floor(rnd()*6),yaw=s.list?45:rnd()*360-180;
    if(s.list)assignList(s,v,yaw,Math.floor(rnd()*s.list.length));
    setHit(s,v);s.cube.style.transform=finalT(v,yaw)[0];
  });
}
function roll(){
  if(busy)return;busy=true;btn.disabled=true;out.textContent='';
  const g=gen,labels=[];
  slots.forEach((s,i)=>{
    const v=1+Math.floor(rnd()*6);setHit(s,v);
    const yaw=s.list?45+(rnd()-.5)*20:rnd()*360-180;
    if(s.list){const idx=Math.floor(rnd()*s.list.length);assignList(s,v,yaw,idx);labels.push(s.list[idx]);}
    else labels.push(WORDS[i][v]);
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
    if(g!==gen)return;
    out.textContent=labels.map(t=>t.split('/').map(p=>p.trim()).join(' ')).join('\n');fitOut();
    try{navigator.vibrate&&navigator.vibrate(30);}catch(e){}
    busy=false;btn.disabled=false;
  },1400+160*(slots.length-1)+60);
}
btn.addEventListener('click',roll);
buildGame('classic');
const tabs=document.querySelectorAll('.tab'),nav=document.querySelector('nav');
function showView(v){
  nav.hidden=v==='mode';
  tabs.forEach(x=>x.classList.toggle('on',x.dataset.v===v));
  ['mode','game','rules'].forEach(id=>{document.getElementById(id).hidden=id!==v;});
  if(v==='game')fitOut();
}
tabs.forEach(t=>t.addEventListener('click',()=>showView(t.dataset.v)));
document.querySelectorAll('.mode[data-mode]').forEach(b=>b.addEventListener('click',()=>{buildGame(b.dataset.mode);showView('game');}));
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
