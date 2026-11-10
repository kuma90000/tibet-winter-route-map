import {trip,flights,places,getDays,altitudeRoute,checklist,sources} from './data.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const urlParams=new URLSearchParams(location.search);
const safeDay=value=>Math.max(0,Math.min(10,Number.isFinite(Number(value))?Math.trunc(Number(value)):0));
const state={day:safeDay(urlParams.get('day')),view:urlParams.get('view')==='table'?'table':'detail',ending:['buffer','early','shannan'].includes(urlParams.get('ending'))?urlParams.get('ending'):'buffer',filter:'all',stay:'songtsam',alt:'sleep',altPoint:0};
let photos={},stays={groups:[]},extraSources={},toastTimer,hasScrolled=false;
const storage={get(key,fallback){try{return JSON.parse(localStorage.getItem('tibet-b-detail-'+key))??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem('tibet-b-detail-'+key,JSON.stringify(value));return true}catch{return false}}};
const currentDays=()=>getDays(state.ending);
const photoAliases={baima:'kula',zongjiao:'lukhang'};
function photoFor(id){return photos[id]||photos[photoAliases[id]]||null}
function photoImage(id,extra=''){const p=photoFor(id);return p?`<img src="${esc(p.path)}" alt="${esc(p.caption)}" width="${p.width}" height="${p.height}" loading="lazy" ${extra}>`:''}
function photoNote(id){const p=photoFor(id);return p?.caption||'此点位的实景照片请查看下方官方资料页。'}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3300)}
function writeUrl(){const u=new URL(location.href);u.searchParams.set('day',state.day);u.searchParams.set('view',state.view);u.searchParams.set('ending',state.ending);history.replaceState(null,'',u)}
function scrollToId(id){document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}

function renderDayNav(days){
 $('#day-nav').innerHTML=days.map((d,i)=>`<button id="day-tab-${i}" class="day-tab" role="tab" aria-controls="day-detail" aria-selected="${i===state.day}" tabindex="${i===state.day?0:-1}" data-day="${i}"><strong>${d.date}</strong><span>${d.weekday} · D${String(i+1).padStart(2,'0')}</span></button>`).join('');
 $('#day-detail').setAttribute('aria-labelledby','day-tab-'+state.day);
}
function renderDay(){
 const days=currentDays(),d=days[state.day],index=state.day,photo=photoFor(d.photo);
 renderDayNav(days);
 const caution=index===3?'<strong>新措可删减，白天转场优先。</strong> 若选走新措， 约7–9小时车程＋2–3小时轻徒步，连餐休约10–13小时；完整徒步或冬季延误可能更久。':index===4?'<strong>28日周一，布宫看外景。</strong> 入宫安排29日。12月19日起关注官方放票，22日再确认。':index===6?'<strong>白天通过高山口。</strong> 羊湖、普莫短停，随后翻过蒙达拉，下降到洛扎住宿。':index===7?'<strong>白马优先，天气决定。</strong> 1月1日留给补走或休整，不叠加更远的高线。':'';
 $('#day-detail').innerHTML=`<article class="day-shell"><div class="day-top"><figure class="day-photo">${photo?photoImage(d.photo):'<div class="place-empty">'+esc(d.area)+'</div>'}<figcaption class="day-photo-caption">${esc(photoNote(d.photo))}</figcaption>${photo?`<button class="photo-credit" data-photo="${esc(d.photo)}" aria-label="查看当天照片来源">来源 ↗</button>`:''}</figure><div class="day-summary"><div class="day-label"><span>DAY ${String(index+1).padStart(2,'0')} / ${esc(d.area)}</span><strong>${esc(d.date)} ${esc(d.weekday)}</strong></div><h3>${esc(d.title)}</h3><p class="day-route">${esc(d.subtitle)}</p><div class="day-stats"><div class="day-stat"><span>车程</span><strong>${esc(d.drive)}</strong></div><div class="day-stat"><span>游玩 / 徒步</span><strong>${esc(d.visit)}</strong></div><div class="day-stat"><span>今晚住哪里</span><strong>${d.stay?esc(d.stay)+' · 约'+d.alt+'米':'返程日，不安排住宿'}</strong></div><div class="day-stat"><span>沿途海拔</span><strong>${esc(d.high)}</strong></div></div></div></div><div class="day-body"><div class="day-body-grid"><div><h4 class="minor-heading">这一天，怎么过。</h4><div class="schedule">${d.schedule.map(([when,what])=>`<div class="schedule-row"><span>${esc(when)}</span><div>${esc(what)}</div></div>`).join('')}</div></div><div class="day-attention"><h4 class="minor-heading">出发前，再看一眼。</h4><ul class="day-notes">${d.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>${caution?`<p class="day-caution">${caution}</p>`:''}</div></div><div class="day-stops"><h4 class="minor-heading">今天可以去的地方</h4><div class="stop-links">${d.points.length?d.points.map(id=>`<button class="stop-link" data-place="${id}">${esc(places[id].name)} <span>＋</span></button>`).join(''):'<span class="fine-print">今天以转场、休息或返程为主，不再叠加大景点。</span>'}${d.stay?`<button class="stop-link" data-day-stay="${index}">查看住宿选择 <span>↗</span></button>`:''}</div></div></div><div class="day-controls"><button data-step="-1" ${index===0?'disabled':''}>← 前一天</button><span>${index+1} / 11</span><button data-step="1" ${index===10?'disabled':''}>后一天 →</button></div></article>`;
 $('#overview-table').innerHTML=`<table><thead><tr><th>日期</th><th>今天怎么走</th><th>车程</th><th>游玩 / 徒步</th><th>住宿 / 海拔</th></tr></thead><tbody>${days.map((a,i)=>`<tr><td><button data-day="${i}" aria-label="查看${esc(a.date)}详细安排">${a.date}</button><small>${a.weekday} · D${i+1}</small></td><td>${esc(a.subtitle)}<small>${esc(a.high)}</small></td><td>${esc(a.drive)}</td><td>${esc(a.visit)}</td><td>${a.stay?esc(a.stay)+`<small>约${a.alt}米</small>`:'返程'}</td></tr>`).join('')}</tbody></table>`;
 applyView();
}
function applyView(){const table=state.view==='table';$('#day-detail').hidden=table;$('#overview-table').hidden=!table;$('#day-nav').hidden=table;$$('[data-view]').forEach(b=>{const yes=b.dataset.view===state.view;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes))})}
function selectDay(value,scroll=true){state.day=safeDay(value);state.view='detail';renderDay();if(state.alt==='sleep'){state.altPoint=Math.min(state.day,9);renderAltitude()}writeUrl();if(scroll)scrollToId('itinerary');requestAnimationFrame(()=>$('#day-tab-'+state.day)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'}))}

const galleryIds=['namcha','basum','xincuo','pumo','yamdrok','baima','barkhor','potala','zongjiao','jeba','dunes','sekhar','yumbu','samye'];
function renderPlaces(){
 const ids=galleryIds.filter(id=>state.filter==='all'||(state.filter==='雪山'?['雪山','徒步'].includes(places[id].category):state.filter==='湖泊'?['湖泊','村落','河谷'].includes(places[id].category):['人文','城市'].includes(places[id].category)));
 $('#places-grid').innerHTML=ids.map(id=>{const p=places[id],key=id==='zongjiao'?'lukhang':p.photo,photo=photoFor(key),optional=['yumbu','samye','sekhar'].includes(id);return `<button class="place-card" data-place="${id}" aria-label="查看${esc(p.name)}游览详情"><div class="place-card-visual">${photo?photoImage(key):'<div class="place-empty">寺院 · 人文</div>'}<span class="place-tag">${optional?'条件可选':esc(p.category)}</span></div><div class="place-card-text"><h3>${esc(p.name)}</h3><span class="plus" aria-hidden="true">＋</span><p>${esc(p.time)}</p>${id==='baima'?'<p class="place-photo-note">图为库拉岗日群峰，非白马湖面</p>':id==='sekhar'?'<p class="place-photo-note">打开查看官方寺院图片资料</p>':''}</div></button>`}).join('');
 $$('[data-filter]').forEach(b=>{const yes=b.dataset.filter===state.filter;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes))});
}
function photoCreditMarkup(key){const p=photoFor(key);if(!p)return '';return `${esc(p.title)} · ${esc(p.author)} · ${p.licenseUrl?`<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a>`:esc(p.license)} · ${esc(p.date)}<br>${esc(p.changes)} <a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">查看原图与授权 ↗</a>`}
function openDialog(html){$('#dialog-content').innerHTML=html;$('#detail-dialog').showModal();document.body.style.overflow='hidden';$('#detail-dialog').scrollTop=0}
function openPlace(id){
 const p=places[id];if(!p)return;const key=id==='zongjiao'?'lukhang':p.photo,ph=photoFor(key);
 const map='https://uri.amap.com/search?keyword='+encodeURIComponent(p.query)+'&view=map';
 const source=id==='baima'?'https://wlt.xizang.gov.cn/xccx/lytg/202509/t20250918_500487.html':id==='sekhar'?'https://lyfzj.shannan.gov.cn/zjsn/jdjs/201903/t20190308_37443.html':p.source;
 openDialog(`${ph?`<figure class="dialog-image">${photoImage(key)}<figcaption class="dialog-caption">${esc(photoNote(key))}</figcaption></figure>`:''}<div class="dialog-copy"><p class="eyebrow">${esc(p.en)} / ${esc(p.area)}</p><h2 id="dialog-title">${esc(p.name)}</h2><p class="dialog-intro">${esc(p.intro)}</p><div class="dialog-facts"><div><span>预留时间</span><strong>${esc(p.time)}</strong></div><div><span>海拔参考</span><strong>${esc(p.alt)}</strong></div></div><p>${esc(p.body)}</p><ul>${p.tips.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><div class="dialog-actions"><a class="button button-dark" href="${esc(map)}" target="_blank" rel="noopener noreferrer">在地图中搜索 ↗</a><a class="text-link" href="${esc(source)}" target="_blank" rel="noopener noreferrer">${id==='baima'||id==='sekhar'?'官方介绍与实景图':'查看资料来源'} ↗</a></div>${ph?`<div class="dialog-credit">${photoCreditMarkup(key)}</div>`:''}</div>`);
 $('#detail-dialog').setAttribute('aria-labelledby','dialog-title');
}
function openPhoto(id){const p=photoFor(id);if(!p)return;openDialog(`<figure class="dialog-image">${photoImage(id)}<figcaption class="dialog-caption">${esc(p.caption)}</figcaption></figure><div class="dialog-copy"><p class="eyebrow">PHOTOGRAPHY / 真实历史影像</p><h2 id="dialog-title">${esc(p.title)}</h2><p>${esc(p.caption)}</p><div class="dialog-credit">${photoCreditMarkup(id)}</div></div>`);$('#detail-dialog').setAttribute('aria-labelledby','dialog-title')}

function stayGroups(){
 const groups=structuredClone(stays.groups||[]),f=groups.find(g=>g.id==='flex');
 if(f&&state.ending==='early'){f.summary='若白马已完成且道路允许，1月1日提前回拉萨；这晚需另订。';f.hotel='拉萨住宿待定';f.alt='区域约3650米'}
 if(f&&state.ending==='shannan'){f.summary='若白马已完成且道路允许，1月1日转场泽当；这晚需另订。';f.hotel='泽当住宿待定';f.alt='区域约3550米'}
 return groups;
}
function hotelGallery(g){
 const list=g.photos||[];
 if(!list.length)return `<div class="hotel-photo-pending"><span aria-hidden="true">▧</span><div><strong>${esc(g.photoPendingTitle||'酒店照片待补充')}</strong><p>${esc(g.photoPending||'住宿尚未确定，确认酒店后再附对应门店照片。')}</p></div></div>`;
 return `<div class="hotel-gallery count-${list.length}" aria-label="${esc(g.hotel)}照片">${list.map((p,i)=>`<figure class="hotel-photo"><button type="button" data-hotel-photo="${g.id}:${i}" aria-label="放大${esc(p.title)}"><img src="${esc(p.url)}" alt="${esc(p.alt)}" width="${p.width||1000}" height="${p.height||667}" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="hotel-photo-fallback" hidden>照片暂时无法加载，请查看下方来源页。</span><span class="hotel-photo-zoom" aria-hidden="true">放大 ↗</span></button><figcaption><strong>${esc(p.title)}</strong><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.credit)} ↗</a></figcaption></figure>`).join('')}</div><p class="hotel-photo-disclaimer">${esc(g.photoNote||'门店公开展示图，仅供了解环境，不代表已订房型、窗景或入住季节。')}<br>图片版权归原权利人所有，外链展示；核对于2026.11.10。</p>`;
}
function bindHotelPhotoFallbacks(){
 document.querySelectorAll('.hotel-photo img,.hotel-dialog-image img,.hotel-feature-photo img').forEach(img=>{
 const failed=()=>{img.hidden=true;const note=img.parentElement.querySelector('.hotel-photo-fallback');if(note)note.hidden=false;};
 img.addEventListener('error',failed,{once:true});if(img.complete&&img.naturalWidth===0)failed();
 });
}
function openHotelPhoto(value){
 const [group,index]=value.split(':'),g=stayGroups().find(a=>a.id===group),p=g?.photos?.[Number(index)];if(!p)return;
 openDialog(`<figure class="hotel-dialog-image"><img src="${esc(p.url)}" alt="${esc(p.alt)}" width="${p.width||1000}" height="${p.height||667}" referrerpolicy="no-referrer"><span class="hotel-photo-fallback" hidden>照片暂时无法加载，请查看来源页。</span></figure><div class="dialog-copy"><p class="eyebrow">HOTEL PHOTOGRAPH</p><h2 id="dialog-title">${esc(p.title)}</h2><p>${esc(g.photoNote||'门店公开展示图，不代表已订房型、窗景或入住季节。')}</p><div class="dialog-credit">${esc(p.credit)} · 图片版权归原权利人所有，未取得开放转载许可，本站采用外链展示。<br><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">查看门店与图片来源 ↗</a></div></div>`);
 $('#detail-dialog').setAttribute('aria-labelledby','dialog-title');bindHotelPhotoFallbacks();
}
function renderStays(){
 const groups=stayGroups();if(!groups.length){$('#stay-panel').innerHTML='<p class="load-error">住宿资料暂未加载成功，请刷新页面。以实际订单为准。</p>';return}
 if(!groups.some(g=>g.id===state.stay))state.stay='songtsam';const g=groups.find(g=>g.id===state.stay);
 $('#stay-tabs').innerHTML=groups.map(a=>`<button role="tab" id="stay-tab-${a.id}" aria-controls="stay-panel" aria-selected="${a.id===state.stay}" tabindex="${a.id===state.stay?0:-1}" data-stay="${a.id}">${esc(a.title)}</button>`).join('');
 $('#stay-panel').setAttribute('aria-labelledby','stay-tab-'+g.id);
 $('#stay-panel').innerHTML=`<div class="stay-area-heading"><div><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p></div><span>${esc(g.dates)} · ${esc(g.alt)}</span></div><article class="hotel-card"><span class="hotel-type">${esc(g.status)}</span><h4>${esc(g.hotel)}</h4>${hotelGallery(g)}<ul>${g.checks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${g.link?`<a class="text-link" href="${esc(g.link)}" target="_blank" rel="noopener noreferrer">${esc(g.linkLabel)} ↗</a>`:''}</article>`;
 $('#stay-note').textContent=stays.note;bindHotelPhotoFallbacks();
}
function stayForDay(i){return i===0?'sosong':i===1?'jeba':i===2?'songtsam':[6,7].includes(i)?'lozha':i===8?'flex':i===9?'airport':'lhasa'}
function renderFlights(){
 $('#flight-grid').innerHTML=flights.map(f=>`<article class="hotel-card"><span class="hotel-type">${esc(f.date)} · ${esc(f.status)}</span><h3>${esc(f.number)}</h3><p class="flight-route">${esc(f.route)}</p><strong class="flight-time">${esc(f.time)}</strong><p>${esc(f.note)}</p></article>`).join('');
}

function altitudeData(){return state.alt==='sleep'?currentDays().slice(0,10).map(d=>({name:d.date,alt:d.alt,note:d.stay})):altitudeRoute}
function renderAltitude(){
 const values=altitudeData();state.altPoint=Math.max(0,Math.min(values.length-1,state.altPoint));const selected=values[state.altPoint];
 $('#altitude-readout').innerHTML=`<strong>${selected.alt.toLocaleString()}<small>米</small></strong><span>${esc(state.alt==='sleep'?selected.note:selected.name)}</span><em>${esc(state.alt==='sleep'?selected.name+' · 住宿区域参考':selected.note)}</em>`;
 const compact=innerWidth<760,W=compact?520:1100,H=compact?260:280,left=compact?48:53,right=compact?18:25,top=25,bottom=40,min=state.alt==='sleep'?2500:3000,max=state.alt==='sleep'?4500:5600;
 const x=i=>left+i/(values.length-1)*(W-left-right), y=v=>top+(max-v)/(max-min)*(H-top-bottom);
 const pts=values.map((d,i)=>[x(i),y(d.alt)]),line=pts.map(p=>p.join(',')).join(' '),base=H-bottom;
 const area=`M${pts[0][0]} ${base} L${pts.map(p=>p.join(' ')).join(' L')} L${pts.at(-1)[0]} ${base}Z`;
 const ticks=state.alt==='sleep'?[3000,3500,4000,4500]:[3000,4000,5000];
 $('#altitude-chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="alt-title"><title id="alt-title">${state.alt==='sleep'?'每晚住宿海拔':'山南路线节点海拔'}，米，节点近似值，非实测轨迹</title><defs><linearGradient id="alt-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#91bdd2" stop-opacity=".2"/><stop offset="100%" stop-color="#91bdd2" stop-opacity=".01"/></linearGradient></defs>${ticks.map(t=>`<line class="chart-grid" x1="${left}" x2="${W-right}" y1="${y(t)}" y2="${y(t)}"/><text class="chart-axis-label" x="0" y="${y(t)+4}">${t}</text>`).join('')}<path d="${area}" fill="url(#alt-fill)"/><polyline points="${line}" class="chart-line"/><line x1="${x(state.altPoint)}" x2="${x(state.altPoint)}" y1="${y(selected.alt)}" y2="${base}" stroke="#94b3c4" stroke-dasharray="3 6" opacity=".4"/>${values.map((v,i)=>`<g data-chart-point="${i}" style="cursor:pointer"><circle cx="${x(i)}" cy="${y(v.alt)}" r="16" fill="transparent"/><circle class="chart-point ${i===state.altPoint?'active':''}" cx="${x(i)}" cy="${y(v.alt)}" r="${i===state.altPoint?6.5:4}"/><text class="chart-x-label" text-anchor="middle" x="${x(i)}" y="${H-15}">${esc(compact&&i%3!==0&&i!==values.length-1?'':v.name)}</text></g>`).join('')}</svg>`;
 $('#altitude-points').innerHTML=values.map((v,i)=>`<button data-alt-point="${i}" class="${i===state.altPoint?'selected':''}" aria-pressed="${i===state.altPoint}" aria-label="${esc(v.name)}，${v.alt}米">${esc(v.name)} · ${v.alt}</button>`).join('');
 $('#altitude-caption').textContent=state.alt==='sleep'?'显示10晚住宿区域的近似海拔，非每家酒店的实测值。1月3日为返程日，无住宿柱点；1月1日住宿未定，图中海拔仅为区域参考；选择不同收尾时图表同步更新。':'依次为去程与白马徒步节点，横轴等距示意，不表示实际里程或连续地形。观景支线按条件选择，较高点并非必须到达。';
 $$('[data-alt]').forEach(b=>{const yes=b.dataset.alt===state.alt;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes))});
}
function renderRouteMap(){
 const nodes=[['林芝机场',560,75,0],['索松村',635,135,0],['结巴 / 巴松措',510,40,2],['新措',560,14,3],['拉萨',140,65,4],['羊湖',90,145,6],['普莫雍措',85,225,6],['洛扎',170,270,6],['白马 / 色乡',260,285,7],['贡嘎机场',140,110,9]],path='560,75 635,135 560,75 510,40 560,14 510,40 140,65 90,145 85,225 170,270 260,285 170,270 140,110';
 $('#route-map').innerHTML=`<svg viewBox="0 0 760 330" role="img" aria-label="B路线示意：林芝、索松、巴松措、新措、拉萨、羊湖、普莫雍措、洛扎、白马林措"><path d="M10 235Q220 115 380 200T750 160 M10 245Q220 125 380 210T750 170 M10 255Q220 135 380 220T750 180" fill="none" stroke="#34404a" stroke-width="1"/><text x="520" y="290" fill="#566875" font-size="14" letter-spacing="7">喜马拉雅山脉</text><polyline points="${path}" fill="none" stroke="#8db6ca" stroke-width="2" opacity=".9"/>${state.ending==='shannan'?'<path d="M260 285 280 115 140 65" fill="none" stroke="#d8b996" stroke-width="2" stroke-dasharray="6 5"/><circle cx="280" cy="115" r="4" fill="#d8b996"/><text x="295" y="120" fill="#d8b996" font-size="12">泽当 · 可选</text>':''}${nodes.map(([name,x,y,day])=>`<g role="button" tabindex="0" data-day="${day}" aria-label="查看${esc(name)}日程"><rect x="${x-45}" y="${y-12}" width="90" height="43" fill="transparent"/><circle cx="${x}" cy="${y}" r="4.5" fill="#c2d8e4"/><text x="${x}" y="${y+23}" text-anchor="middle" font-size="12" fill="#b9c8d1">${name}</text></g>`).join('')}</svg>`;
}
function renderEnding(){
 $$('[data-ending]').forEach(b=>{const yes=b.dataset.ending===state.ending;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',String(yes));b.querySelector('b').textContent=yes?'✓':'＋'});
 $('#ending-status').textContent=state.ending==='buffer'?'当前安排：1日保留补走或附近休整且住宿待订，2日前往已订的贡嘎机场店。若天气仍不允许入山，尊重现场管理，不强行补走。':state.ending==='early'?'当前安排：仅在31日已完成白马且道路可通行时，1日回拉萨且住宿需另订，2日市区休整后去贡嘎机场店。逐日行程、住宿提示和海拔图已同步。':'当前安排：仅在31日已完成白马且接线可通行时，1日转泽当且住宿需另订，2日游览后去贡嘎机场店；不再保留1日补走白马。';
}
function renderReferences(){
 const extras=Object.entries(extraSources).map(([id,s])=>({id,title:s.title,org:s.org,date:s.date||'专业资料',url:s.url,note:id==='nia'?'电子边境管理区通行证适用条件与官方办理流程。':id==='baima_old_close'?'历史积雪关闭公告，仅说明冬季可能临时关闭，不能代表2026年底状态。':id==='seka'?'赛卡古托寺官方基础资料与实景介绍。':'高海拔旅行健康信息，不能代替个人医疗评估。'}));
 $('#source-list').innerHTML=[...sources,...extras].map(s=>`<article class="source-item"><div><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><small>${esc(s.org)} · ${esc(s.date)}</small></div><p>${esc(s.note)}</p></article>`).join('');
 $('#credits-list').innerHTML=`<div class="credits-grid">${Object.entries(photos).map(([id,p])=>`<div class="credit-item"><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.title)} ↗</a>${esc(p.author)} · ${p.licenseUrl?`<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a>`:esc(p.license)}<br>${esc(p.date)}<br>${esc(p.caption)}<br>${esc(p.changes)}</div>`).join('')}</div>`;
}
function renderHotelCredits(){
 const entries=stayGroups().filter(g=>g.photos?.length);
 $('#credits-list').insertAdjacentHTML('beforeend',`<h3 class="hotel-credits-title">酒店照片</h3><p class="hotel-photo-disclaimer">酒店照片与上方开放许可景观图分开管理。以下为酒店官网或预订平台的外链展示图，版权归原权利人所有，未取得开放转载许可；不代表房型承诺或冬季实况。</p><div class="credits-grid">${entries.map(g=>`<div class="credit-item"><strong>${esc(g.hotel)}</strong>${g.photos.map(p=>`<a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.title)} · ${esc(p.credit)} ↗</a>`).join('')}${g.photoNote?`<p>${esc(g.photoNote)}</p>`:''}</div>`).join('')}</div>`);
}
function renderChecklist(){const saved=storage.get('checks',[]);let group='';$('#checklist').innerHTML=checklist.map(([g,t],i)=>{const title=g!==group?`<p class="check-group">${esc(g)}</p>`:'';group=g;return title+`<label class="check-row"><input type="checkbox" id="check-${i}" data-check="${i}" ${saved[i]?'checked':''}><span>${esc(t)}</span></label>`}).join('');$('#trip-notes').value=storage.get('notes','');updateCheckProgress()}
function updateCheckProgress(){const n=$$('[data-check]').filter(c=>c.checked).length;$('#check-count').textContent=n+' / '+checklist.length;$('#check-progress').style.width=n/checklist.length*100+'%'}
function exportText(){
 let text=`藏冬 · 我们的西藏行程\n2026.12.23重庆中转｜12.24—01.03西藏11天10晚｜林芝进、贡嘎出\n收尾：${{buffer:'保留白马天气机动',early:'白马已完成后提前回拉萨',shannan:'白马已完成后加山南'}[state.ending]}\n\n`;
 currentDays().forEach((d,i)=>{text+=`${d.date} ${d.weekday} / D${i+1}｜${d.title}\n${d.subtitle}\n车程：${d.drive}\n游玩：${d.visit}\n住宿：${d.stay?d.stay+' · 约'+d.alt+'米':'返程'}\n沿途海拔：${d.high}\n${d.schedule.map(([a,b])=>a+'：'+b).join('\n')}\n注意：\n${d.notes.map(n=>'· '+n).join('\n')}\n\n`});
 text+='沿途点位\n'+[...new Set(currentDays().flatMap(d=>d.points))].map(id=>{const p=places[id];return `${p.name}｜${p.alt}｜${p.time}\n${p.body}\n${p.tips.map(t=>'· '+t).join('\n')}`}).join('\n\n')+'\n\n';
 text+='住宿与确认状态\n'+stayGroups().map(g=>`${g.dates}｜${g.hotel}｜${g.status}\n${g.summary}\n核对：${g.checks.join('；')}`).join('\n\n');
 text+='\n\n航班安排（北京时间）\n'+flights.map(f=>`${f.date} ${f.number}｜${f.route}｜${f.time}｜${f.status}\n${f.note}`).join('\n\n');
 text+='\n\n出发前的重要事项\n'+$$('.practical-list details').map(d=>d.querySelector('summary').textContent.replace('＋','').trim()+'\n'+[...d.querySelectorAll('p')].map(p=>p.textContent).join('\n')+'\n'+[...d.querySelectorAll('a')].map(a=>a.href).join('\n')).join('\n\n');
 text+='\n\n出发清单\n'+checklist.map(([,t],i)=>`${$('#check-'+i)?.checked?'☑':'☐'} ${t}`).join('\n');const notes=$('#trip-notes').value.trim();if(notes)text+='\n\n本机备忘（主动导出）\n'+notes;
 text+='\n\n资料核对：'+trip.updated+'。车程、海拔为规划估算；未来天气、景区开放、道路与房态临行复核。照片为真实历史影像。\n'+sources.map(s=>s.title+' '+s.url).join('\n');
 return text;
}
async function copyText(text,message){try{if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');await navigator.clipboard.writeText(text);toast(message)}catch{$('#copy-fallback').value=text;$('#copy-dialog').showModal();$('#copy-fallback').select()}}
function preparePrint(){let el=$('#print-content');if(!el){el=document.createElement('article');el.id='print-content';el.className='print-content';document.body.appendChild(el)}el.innerHTML=`<h1>藏冬 · 我们的西藏行程</h1><p>2026.12.23重庆中转 · 12.24—01.03西藏11天10晚 · 林芝进、贡嘎出<br>收尾：${{buffer:'保留白马天气机动',early:'白马已完成后提前返拉萨',shannan:'白马已完成后加山南'}[state.ending]}</p>${currentDays().map((d,i)=>`<section class="print-day"><h2>${d.date} ${d.weekday} · D${i+1} ${esc(d.title)}</h2><p>${esc(d.subtitle)}<br>车程：${esc(d.drive)} · 游玩：${esc(d.visit)}<br>住宿：${d.stay?esc(d.stay)+' · 约'+d.alt+'米':'返程'}<br>沿途海拔：${esc(d.high)}</p><ul>${d.schedule.map(([a,b])=>`<li>${esc(a)}：${esc(b)}</li>`).join('')}${d.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></section>`).join('')}<h3>住宿与确认状态</h3>${stayGroups().map(g=>`<section class="print-day"><h2>${esc(g.dates)} · ${esc(g.title)}</h2><p>${esc(g.alt)}</p><ul><li>${esc(g.hotel)} · ${esc(g.status)}<br>${esc(g.checks.join('；'))}</li></ul></section>`).join('')}<h3>航班安排（北京时间）</h3>${flights.map(f=>`<p>${esc(f.date)} ${esc(f.number)} · ${esc(f.route)}<br>${esc(f.time)} · ${esc(f.status)}<br>${esc(f.note)}</p>`).join('')}<h3>出发清单</h3><p class="print-notes">${esc(checklist.map(([,t],i)=>`${$('#check-'+i)?.checked?'☑':'☐'} ${t}`).join('\n'))}</p>${$('#trip-notes').value.trim()?`<h3>本机备忘</h3><p class="print-notes">${esc($('#trip-notes').value)}</p>`:''}<h3>资料来源</h3><p class="print-notes">核对日期：${trip.updated}\n车程、海拔为估算；开放、道路、房态临行核实。\n${esc(sources.map(s=>s.title+'\n'+s.url).join('\n'))}</p>`}

document.addEventListener('click',async e=>{
 const b=e.target.closest('button,[data-day],[data-chart-point]');if(!b)return;
 if(b.dataset.day!==undefined){selectDay(b.dataset.day);return}
 if(b.dataset.step!==undefined){selectDay(state.day+Number(b.dataset.step));return}
 if(b.dataset.view){state.view=b.dataset.view;applyView();writeUrl();return}
 if(b.dataset.place){openPlace(b.dataset.place);return}
 if(b.dataset.photo){openPhoto(b.dataset.photo);return}
 if(b.dataset.hotelPhoto){openHotelPhoto(b.dataset.hotelPhoto);return}
 if(b.dataset.filter){state.filter=b.dataset.filter;renderPlaces();return}
 if(b.dataset.stay){state.stay=b.dataset.stay;renderStays();return}
 if(b.dataset.dayStay!==undefined){state.stay=stayForDay(Number(b.dataset.dayStay));renderStays();scrollToId('stays');return}
 if(b.dataset.ending){state.ending=b.dataset.ending;renderDay();renderStays();renderEnding();renderAltitude();renderRouteMap();writeUrl();toast('收尾安排已同步到行程、住宿和海拔图');return}
 if(b.dataset.alt){state.alt=b.dataset.alt;state.altPoint=state.alt==='sleep'?Math.min(state.day,9):6;renderAltitude();return}
 if(b.dataset.altPoint!==undefined||b.dataset.chartPoint!==undefined){state.altPoint=Number(b.dataset.altPoint??b.dataset.chartPoint);renderAltitude();return}
 if(b.dataset.action==='share'){writeUrl();const u=new URL(location.href);u.hash='itinerary';await copyText(u.toString(),'分享链接已复制，包含当前日期与收尾安排');return}
 if(b.dataset.action==='copy'){await copyText(exportText(),'完整行程、住宿状态与本机备忘已复制');return}
 if(b.dataset.action==='download'){const blob=new Blob([exportText()],{type:'text/plain;charset=utf-8'}),href=URL.createObjectURL(blob),link=document.createElement('a');link.href=href;link.download='藏冬-西藏B线详细行程.txt';link.click();setTimeout(()=>URL.revokeObjectURL(href),1000);toast('详细行程已保存，含住宿状态与本机备忘');return}
 if(b.dataset.action==='print'){preparePrint();window.print();return}
 if(b.dataset.action==='close-dialog')$('#detail-dialog').close();
 if(b.dataset.action==='close-copy')$('#copy-dialog').close();
});
document.addEventListener('keydown',e=>{
 const tab=e.target.closest('[role="tab"]');if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const day=tab.dataset.day!==undefined,items=day?currentDays():stayGroups(),current=day?state.day:items.findIndex(g=>g.id===state.stay),next=e.key==='Home'?0:e.key==='End'?items.length-1:(current+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;if(day){selectDay(next,false);$('#day-tab-'+next)?.focus()}else{state.stay=items[next].id;renderStays();$('#stay-tab-'+state.stay)?.focus()}return}
 const map=e.target.closest('#route-map [data-day]');if(map&&['Enter',' '].includes(e.key)){e.preventDefault();selectDay(map.dataset.day)}
});
$('#detail-dialog').addEventListener('close',()=>{document.body.style.overflow=''});
for(const id of ['detail-dialog','copy-dialog'])$('#'+id).addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const box=e.currentTarget.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)e.currentTarget.close()});
$('#checklist').addEventListener('change',()=>{const ok=storage.set('checks',$$('[data-check]').map(c=>c.checked));updateCheckProgress();if(!ok)toast('浏览器未允许本机保存，请导出行程保留记录')});
$('#trip-notes').addEventListener('input',()=>{const ok=storage.set('notes',$('#trip-notes').value);$('#save-state').textContent=ok?'已保存在本机；不会自动同步给旅伴。':'浏览器未允许保存，请复制或下载行程保留备忘。'});
window.addEventListener('beforeprint',preparePrint);
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderAltitude,120)});
window.addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);state.day=safeDay(p.get('day'));state.ending=['buffer','early','shannan'].includes(p.get('ending'))?p.get('ending'):'buffer';state.view=p.get('view')==='table'?'table':'detail';renderAll()});
window.addEventListener('scroll',()=>{if(hasScrolled)return;hasScrolled=true;requestAnimationFrame(()=>{const height=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=(height>0?scrollY/height*100:0)+'%';hasScrolled=false})},{passive:true});
function renderAll(){renderDay();renderPlaces();renderStays();renderAltitude();renderRouteMap();renderEnding();writeUrl()}
async function readJSON(path){const r=await fetch(path);if(!r.ok)throw new Error(path+' '+r.status);return r.json()}
const loaded=await Promise.allSettled([readJSON('assets/photos.json'),readJSON('stays.json'),readJSON('practical-sources.json')]);
if(loaded[0].status==='fulfilled')photos=loaded[0].value;
if(loaded[1].status==='fulfilled')stays=loaded[1].value;
if(loaded[2].status==='fulfilled')extraSources=loaded[2].value;
renderChecklist();renderAll();renderFlights();renderReferences();renderHotelCredits();
if(loaded.some(r=>r.status==='rejected'))toast('部分参考资料未能加载，请刷新页面重试');
