import fs from 'node:fs';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local',quiet:true});
const charts=JSON.parse(fs.readFileSync('lib/charts.json','utf8'));
fs.mkdirSync('.cache/explore',{recursive:true});
const refresh=process.argv.includes('--refresh');
const filter=process.argv.find(arg=>arg.startsWith('--chart='))?.slice(8);
const queue=charts.filter(c=>!filter||c.slug===filter);
if(!queue.length)throw Error('Unknown chart');
async function worker(){while(queue.length){const chart=queue.shift();const file=`.cache/explore/${chart.slug}.json`;if(fs.existsSync(file)&&!refresh)continue;
 const rows=[]; let cursor=null;
 for(;;){const url=new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/v_chart_entries`);url.search=new URLSearchParams({select:'date,song,artist,this_week,last_week,peak_position,weeks_on_chart',chart:`eq.${chart.slug}`,order:'date.asc,this_week.asc',limit:'1000'});
 if(cursor)url.searchParams.set('or',`(date.gt.${cursor.date},and(date.eq.${cursor.date},this_week.gt.${cursor.this_week}))`);
 let data; for(let attempt=0;attempt<4;attempt++){try{const response=await fetch(url,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY},signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(`${response.status}`);data=await response.json();break;}catch(error){if(attempt===3)throw error;await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}
 rows.push(...data);cursor=data.at(-1);if(data.length<1000)break;
 }
 fs.writeFileSync(file+`.${process.pid}.tmp`,JSON.stringify(rows));fs.renameSync(file+`.${process.pid}.tmp`,file);console.log(`${chart.name}: ${rows.length} entries`);
}}
await Promise.all(Array.from({length:3},worker));
