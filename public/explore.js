// Static archive pages share the production site's Analytics property.
if (['trivia.rocks','www.trivia.rocks'].includes(location.hostname)) {
 window.dataLayer=window.dataLayer||[];
 window.gtag=function(){window.dataLayer.push(arguments)};
 window.gtag('js',new Date());window.gtag('config','G-QK6FDXGTSJ');
 const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-QK6FDXGTSJ';document.head.append(script);
}
const input=document.querySelector('#artist-search'), genre=document.querySelector('#artist-genre');
if(input&&genre){let catalog;let request;const original=document.querySelector('#artist-results').innerHTML;
 const run=async()=>{const status=document.querySelector('#artist-status');if(!input.value&&!genre.value){document.querySelector('#artist-results').innerHTML=original;document.querySelector('.pagination').hidden=false;status.textContent='';return;}try{catalog ||= await (request ||= fetch('/explore-data/artists.json').then(r=>{if(!r.ok)throw Error();return r.json()}));
 const matches=catalog.filter(a=>a.name.toLocaleLowerCase().includes(input.value.toLocaleLowerCase().trim())&&(!genre.value||a.genres.includes(genre.value)));
 const results=document.querySelector('#artist-results');results.replaceChildren();
 for(const a of matches.slice(0,100)){const link=document.createElement('a');link.className='card';link.href='/explore/artists/'+a.slug+'/';const name=document.createElement('strong');name.textContent=a.name;link.append(name,document.createTextNode(a.songs+' songs · '+a.entries.toLocaleString()+' appearances'));results.append(link);}
 status.textContent=matches.length+' matches'+(matches.length>100?' · Showing the first 100. Narrow your search to see more.':'');
 document.querySelector('.pagination').hidden=Boolean(input.value||genre.value);
 }catch{request=null;status.textContent='Search is unavailable. Browse the artist directory below.'}};
 input.addEventListener('input',run);genre.addEventListener('change',run);
}

// Inspect real weekly ranks by mouse, touch, or arrow keys; the full history
// remains readable and linked without JavaScript.
for (const svg of document.querySelectorAll('.rank-journey')) {
  const series=JSON.parse(svg.dataset.series);
  const section=svg.closest('.song-chart');
  const inspector=section.querySelector('.journey-inspect');
  const value=inspector.querySelector('.journey-value');
  const link=inspector.querySelector('.journey-week');
  const time=date=>Date.parse(date+'T00:00:00Z');
  const first=time(series[0][0]),last=time(series.at(-1)[0]);
  let selected=series.findIndex(point=>point[1]===Math.min(...series.map(p=>p[1])));
  const marker=document.createElementNS('http://www.w3.org/2000/svg','circle');
  marker.setAttribute('r','5');marker.setAttribute('class','journey-cursor');
  svg.append(marker);svg.setAttribute('tabindex','0');
  svg.setAttribute('aria-label',svg.getAttribute('aria-label')+' Use left and right arrow keys to inspect weekly positions.');
  const show=index=>{
    selected=Math.max(0,Math.min(series.length-1,index));const [date,rank]=series[selected];
    marker.setAttribute('cx',last===first?'320':String(46+(time(date)-first)/(last-first)*548));
    marker.setAttribute('cy',String(22+(rank-1)/(Number(svg.dataset.ceiling)-1)*142));
    value.textContent=date+' · No. '+rank;link.href='/explore/charts/'+svg.dataset.genre+'/'+date+'/';
  };
  inspector.hidden=false;show(selected);
  const inspectPointer=event=>{
    const matrix=svg.getScreenCTM();if(!matrix)return;
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());
    const date=first+Math.max(0,Math.min(1,(point.x-46)/548))*(last-first);
    let low=0,high=series.length-1;while(low<high){const mid=Math.floor((low+high)/2);if(time(series[mid][0])<date)low=mid+1;else high=mid;}
    if(low>0&&date-time(series[low-1][0])<time(series[low][0])-date)low--;
    value.removeAttribute('aria-live');show(low);
  };
  svg.addEventListener('pointermove',inspectPointer);
  svg.addEventListener('pointerdown',inspectPointer);
  svg.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();value.setAttribute('aria-live','polite');
    show(event.key==='Home'?0:event.key==='End'?series.length-1:selected+(event.key==='ArrowRight'?1:-1));
  });
}

// Release metadata is cached once per album and loaded only for visible chart
// rows, keeping the historical HTML export small and avoiding catalog API calls.
const releaseRequests=new Map();
function loadRelease(id) {
 if(!/^\d+$/.test(id))return Promise.reject(Error('Invalid release ID'));
 if(!releaseRequests.has(id))releaseRequests.set(id,fetch('/release-data/'+id+'.json').then(r=>{if(!r.ok)throw Error('Release unavailable');return r.json()}));
 return releaseRequests.get(id);
}
function storeLink(url) {
 const target=new URL(url);if(target.protocol!=='https:'||!['music.apple.com','itunes.apple.com'].includes(target.hostname))throw Error('Invalid store URL');
 const a=document.createElement('a');a.href=target.href;a.target='_blank';a.rel='noopener noreferrer';return a;
}
async function showChartRelease(container) {
 try {
  const release=await loadRelease(container.dataset.release);
  const artwork=new URL(release.artwork);if(artwork.protocol!=='https:'||!artwork.hostname.endsWith('.mzstatic.com'))throw Error('Invalid artwork');
  const wrap=document.createElement('span');wrap.className='chart-release-content';
  const cover=storeLink(release.url);const img=document.createElement('img');img.className='chart-cover';img.src=release.artwork;img.alt=release.album+' cover';img.width=56;img.height=56;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>cover.remove());cover.append(img);
  const text=document.createElement('span');const name=document.createElement('span');name.className='release-name';name.textContent=release.album;
  const badge=storeLink(release.url);const logo=document.createElement('img');logo.src='/brand/listen-on-apple-music.svg';logo.alt='Listen on Apple Music (opens in a new tab)';logo.width=100;logo.height=29;logo.className='store-badge';badge.append(logo);
  text.append(name,badge);wrap.append(cover,text);container.replaceChildren(wrap);
 } catch { container.remove(); }
}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);showChartRelease(entry.target);}},{rootMargin:'150px'});document.querySelectorAll('.chart-release').forEach(el=>observer.observe(el));}
else document.querySelectorAll('.chart-release').forEach(showChartRelease);
document.querySelectorAll('.song-cover,.release-cover').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;}));
