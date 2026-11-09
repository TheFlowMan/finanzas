import {firebaseConfig as cfg} from './config.js';
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const eur=n=>n.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
const num=v=>parseFloat(String(v??'').replace(',','.'))||0;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const CATS={out:[['🛒','Compra'],['⛽','Gasolina'],['🚬','Tabaco'],['🍽️','Comer fuera'],['🏠','Casa'],['🎉','Ocio'],['💊','Salud'],['🚌','Transporte'],['👕','Ropa'],['📱','Suscripción'],['🎁','Capricho'],['❓','Otros']],in:[['💼','Nómina'],['➕','Extra'],['🎁','Regalo'],['❓','Otros']]};
let S={movs:[],rec:[],l0:0,h0:0,min:0},month=today().slice(0,7),tab='out',kind='out',cat='🛒',save=()=>{};
const commit=()=>{save();render()};

// Liquidez y hucha acumuladas hasta donde indique el filtro f
const calc=f=>{let l=+S.l0,h=+S.h0;S.movs.filter(f).forEach(x=>{
  if(x.t=='in')l+=x.a;else if(x.t=='out')l-=x.a;
  else if(x.dir=='save'){l-=x.a;h+=x.a}else{l+=x.a;h-=x.a}});return{l,h}};

function render(){
  const e=calc(x=>x.d.slice(0,7)<=month),s=calc(x=>x.d.slice(0,7)<month),g=e.l-S.min;
  $('#ml').textContent=new Date(month+'-15').toLocaleDateString('es-ES',{month:'long',year:'numeric'});
  $('#liq').textContent=eur(e.l);$('#huc').textContent=eur(e.h);
  $('#tip').textContent=!S.min?'Pulsa ⚙️ y fija tu liquidez mínima para recibir consejos.':
    g<0?`⚠️ Estás ${eur(-g)} por debajo de tu colchón de liquidez.`:
    g>0?`💡 Te sobran ${eur(g)} sobre tu colchón: podrías pasarlos a la hucha.`:'✅ Justo en tu colchón.';
  $$('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t==tab));
  let h='';
  if(tab=='in')h+=`<div class="r"><span class="ic">↪️</span><div><b>Saldo del mes anterior</b><small>automático</small></div><span class="am in">${eur(s.l)}</span></div>`;
  if(tab=='out'&&month<=today().slice(0,7)){
    const done=S.movs.filter(x=>x.d.startsWith(month)).map(x=>x.rid);
    S.rec.filter(r=>!done.includes(r.id)).forEach(r=>h+=`<div class="r pend"><span class="ic">${r.c}</span><div><b>${r.n}</b><small>fijo pendiente</small></div><button class="ok" data-ok="${r.id}">${eur(r.a)} ✓</button></div>`)}
  const rows=tab=='fix'?S.rec.map(r=>`<div class="r"><span class="ic">${r.c}</span><div><b>${r.n}</b><small>cada mes</small></div><span class="am out">${eur(r.a)}</span><button data-dr="${r.id}">✕</button></div>`)
    :S.movs.filter(x=>x.d.startsWith(month)&&x.t==tab).sort((a,b)=>b.d.localeCompare(a.d)).map(x=>
      `<div class="r"><span class="ic">${x.c}</span><div><b>${x.n}</b><small>${x.d.slice(8)}/${x.d.slice(5,7)}</small></div><span class="am ${x.t}">${eur(x.a)}</span><button data-del="${x.id}">✕</button></div>`);
  h+=rows.join('');
  $('#list').innerHTML=h||'<p class="vacio">Nada todavía. Pulsa + para añadir.</p>';
}

$('#list').onclick=e=>{const t=e.target.closest('button');if(!t)return;const{del,ok,dr}=t.dataset;
  if(del&&confirm('¿Borrar este movimiento?'))S.movs=S.movs.filter(x=>x.id!=del);
  else if(dr&&confirm('¿Quitar este gasto fijo?'))S.rec=S.rec.filter(x=>x.id!=dr);
  else if(ok){const r=S.rec.find(x=>x.id==ok),a=num(prompt('Importe',r.a));if(!a)return;
    S.movs.push({id:uid(),t:'out',a,c:r.c,n:r.n,d:month==today().slice(0,7)?today():month+'-28',rid:r.id})}
  else return;commit()};
$$('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;render()});
const shift=n=>{const d=new Date(month+'-15');d.setMonth(d.getMonth()+n);month=d.toISOString().slice(0,7);render()};
$('#pv').onclick=()=>shift(-1);$('#nx').onclick=()=>shift(1);

// Hoja para añadir
function setKind(k){kind=k;$$('#kd button').forEach(b=>b.classList.toggle('on',b.dataset.k==k));
  $('#cats').hidden=k=='mv';$('#dir').hidden=k!='mv';$('#fxl').hidden=k!='out';
  if(k!='mv'){cat=CATS[k][0][0];$('#cats').innerHTML=CATS[k].map(([i,n])=>`<button type="button" data-c="${i}" class="${i==cat?'on':''}"><span>${i}</span>${n}</button>`).join('')}}
$$('#kd button').forEach(b=>b.onclick=()=>setKind(b.dataset.k));
$('#cats').onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.c;$$('#cats button').forEach(x=>x.classList.toggle('on',x===b))};
$('#fab').onclick=()=>{setKind(tab=='in'||tab=='mv'?tab:'out');$('#dt').value=today();$('#sheet').hidden=false;$('#amt').focus()};
$('#sheet').onclick=e=>{if(e.target.id=='sheet')e.target.hidden=true};
$('#f').onsubmit=e=>{e.preventDefault();const a=num($('#amt').value);if(!a)return;
  const d=$('#dt').value||today(),note=$('#note').value.trim(),cn=kind=='mv'?'':CATS[kind].find(c=>c[0]==cat)[1];
  const x={id:uid(),t:kind,a,d,c:kind=='mv'?'🐷':cat,n:note||cn||($('#dir').value=='save'?'A la hucha':'De la hucha')};
  if(kind=='mv')x.dir=$('#dir').value;
  if(kind=='out'&&$('#fx').checked){const r={id:uid(),n:x.n,a,c:cat};S.rec.push(r);x.rid=r.id}
  S.movs.push(x);$('#sheet').hidden=true;e.target.reset();month=d.slice(0,7);tab=kind;commit()};

// Ajustes y copia de seguridad
$('#cfg').onclick=()=>{const g=(m,v)=>{const r=prompt(m,v);return r===null?v:num(r)};
  S.l0=g('Liquidez que tenías al empezar (€)',S.l0);S.h0=g('Hucha que tenías al empezar (€)',S.h0);S.min=g('Liquidez mínima que quieres mantener (€)',S.min);commit()};
$('#exp').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a.download='cuentas-'+today()+'.json';a.click()};

// Datos: local (modo prueba) o Firebase (sincronizado)
async function init(){
  if(!cfg){S={...S,...JSON.parse(localStorage.getItem('fin')||'{}')};save=()=>localStorage.setItem('fin',JSON.stringify(S));return render()}
  $('#login').hidden=false;$('#out').hidden=false;
  const V='https://www.gstatic.com/firebasejs/10.12.2/';
  const[{initializeApp},A,F]=await Promise.all([import(V+'firebase-app.js'),import(V+'firebase-auth.js'),import(V+'firebase-firestore.js')]);
  const app=initializeApp(cfg),auth=A.getAuth(app),db=F.getFirestore(app);let unsub;
  A.onAuthStateChanged(auth,u=>{unsub&&unsub();$('#login').hidden=!!u;if(!u)return;
    const ref=F.doc(db,'users',u.uid);save=()=>F.setDoc(ref,S);
    unsub=F.onSnapshot(ref,s=>{if(s.exists())S={...S,...s.data()};render()});render()});
  $('#lf').onsubmit=async e=>{e.preventDefault();$('#err').textContent='';
    try{await(e.submitter.id=='up'?A.createUserWithEmailAndPassword:A.signInWithEmailAndPassword)(auth,$('#em').value,$('#pw').value)}
    catch(x){$('#err').textContent='No se pudo entrar: '+x.code}};
  $('#out').onclick=()=>A.signOut(auth);
}
init();
