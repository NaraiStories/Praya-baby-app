import { useState, useEffect } from "react";
import { WHO, whoAssess } from "./data/who";
import { ML, AREAS } from "./data/milestones";
import { AD } from "./data/activities";
import { MPASI, KR, parseMeal, MPASI_NOTES } from "./data/mpasi";

const TABS = ['Aktivitas','Jadwal','Tumbuh','Milestone','MPASI','Tracker'];
const MONTH_COLORS = {sleep:'#8b5cf6',feed:'#10b981',move:'#f59e0b',sense:'#3b82f6',lang:'#ec4899'};
const SCHED_LABELS = {sleep:'Tidur',feed:'Makan',move:'Gerak',sense:'Sensori',lang:'Bahasa'};

function save(key, val, setter) { setter(val); try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} }
function load(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch(e){ return def; } }

export default function App() {
  const [month, setMonth] = useState(6);
  const [tab, setTab] = useState(0);
  const [growthLog, setGrowthLog] = useState(() => load('bg', []));
  const [gForm, setGForm] = useState({ date: new Date().toISOString().slice(0,10), w: '', h: '' });
  const [gMetric, setGMetric] = useState('w');
  const [mm, setMm] = useState(6);
  const [mw, setMw] = useState(0);
  const [recipe, setRecipe] = useState(null);
  const [rOpen, setROpen] = useState(null);
  const [checked, setChecked] = useState(() => load('bc', {}));
  const [catOpen, setCatOpen] = useState(null);
  const [miles, setMiles] = useState(() => load('bm', []));
  const [maOpen, setMaOpen] = useState(null);

  const ad = AD[month] || AD[6];
  const ml = ML[month] || [];

  // ── TAB: AKTIVITAS ──
  function TabAktivitas() {
    return (
      <div>
        <div style={{background:'#eff6ff',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:13,color:'#1e40af'}}>
          <strong>Bulan {month}:</strong> {ad.ms}
        </div>
        {Object.entries(ad.cats).map(([cat, acts]) => (
          <div key={cat} style={{marginBottom:10,border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden'}}>
            <button onClick={() => setCatOpen(catOpen===cat ? null : cat)}
              style={{width:'100%',padding:'10px 14px',background:catOpen===cat?'#dbeafe':'#f9fafb',border:'none',textAlign:'left',fontWeight:600,fontSize:14,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              {cat} <span>{catOpen===cat?'▲':'▼'}</span>
            </button>
            {catOpen===cat && acts.map(a => {
              const key = `${month}-${a.id}`;
              const done = checked[key];
              return (
                <div key={a.id} style={{padding:'10px 14px',borderTop:'1px solid #e5e7eb',display:'flex',gap:10,alignItems:'flex-start'}}>
                  <input type="checkbox" checked={!!done} onChange={e => {
                    const next = {...checked, [key]: e.target.checked};
                    save('bc', next, setChecked);
                  }} style={{marginTop:3}} />
                  <div>
                    <div style={{fontWeight:500,fontSize:14}}>{a.n} <span style={{color:'#6b7280',fontWeight:400,fontSize:12}}>({a.d})</span></div>
                    <div style={{fontSize:12,color:'#6b7280',marginTop:2}}>💡 {a.t}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ── TAB: JADWAL ──
  function TabJadwal() {
    return (
      <div>
        <div style={{marginBottom:12,fontSize:13,color:'#6b7280'}}>Jadwal sampel bulan {month} — sesuaikan dengan ritme bayi.</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
          {Object.entries(SCHED_LABELS).map(([tp,lb]) => (
            <span key={tp} style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:MONTH_COLORS[tp]+'22',color:MONTH_COLORS[tp],fontWeight:600}}>{lb}</span>
          ))}
        </div>
        {(ad.sch||[]).map((s,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,padding:'8px 12px',borderRadius:8,background:MONTH_COLORS[s.tp]+'11',borderLeft:`4px solid ${MONTH_COLORS[s.tp]}`}}>
            <span style={{fontWeight:700,fontSize:13,width:44,color:MONTH_COLORS[s.tp]}}>{s.t}</span>
            <span style={{fontSize:13}}>{s.l}</span>
          </div>
        ))}
      </div>
    );
  }

  // ── TAB: TUMBUH ──
  function TabTumbuh() {
    const assess = growthLog.length > 0 ? whoAssess(growthLog[growthLog.length-1].month, growthLog[growthLog.length-1].w, growthLog[growthLog.length-1].h) : null;
    const latest = growthLog[growthLog.length-1];
    
    function addEntry() {
      if (!gForm.w || !gForm.h) return;
      const entry = { date: gForm.date, month, w: parseFloat(gForm.w), h: parseFloat(gForm.h) };
      const next = [...growthLog, entry];
      save('bg', next, setGrowthLog);
      setGForm(f => ({...f, w:'', h:''}));
    }

    // SVG charts
    const chartW = 300, chartH = 140;
    const wData = WHO.map(r => ({ m: r[0], p3: r[1], p50: r[3], p97: r[5] }));
    const hData = WHO.map(r => ({ m: r[0], p3: r[6], p50: r[8], p97: r[10] }));
    const minM = 5, maxM = 12;
    const minW = 5.5, maxW = 12.5;
    const minH = 60, maxH = 83;
    const mx = m => ((m - minM) / (maxM - minM)) * (chartW - 40) + 20;
    const myw = w => chartH - 20 - ((w - minW) / (maxW - minW)) * (chartH - 30);
    const myh = h => chartH - 20 - ((h - minH) / (maxH - minH)) * (chartH - 30);

    return (
      <div>
        <div style={{background:'#f0fdf4',borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{fontWeight:700,marginBottom:8}}>Catat Pertumbuhan</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
            <div>
              <label style={{fontSize:12,color:'#6b7280'}}>Tanggal</label>
              <input type="date" value={gForm.date} onChange={e => setGForm(f=>({...f,date:e.target.value}))}
                style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #d1fae5',fontSize:13,boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:12,color:'#6b7280'}}>Bulan ke-</label>
              <select value={month} onChange={e => setMonth(+e.target.value)}
                style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #d1fae5',fontSize:13}}>
                {[5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:'#6b7280'}}>Berat (kg)</label>
              <input type="number" step="0.1" placeholder="mis: 7.5" value={gForm.w} onChange={e => setGForm(f=>({...f,w:e.target.value}))}
                style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #d1fae5',fontSize:13,boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{fontSize:12,color:'#6b7280'}}>Tinggi (cm)</label>
              <input type="number" step="0.1" placeholder="mis: 67.0" value={gForm.h} onChange={e => setGForm(f=>({...f,h:e.target.value}))}
                style={{width:'100%',padding:'6px 8px',borderRadius:6,border:'1px solid #d1fae5',fontSize:13,boxSizing:'border-box'}} />
            </div>
          </div>
          <button onClick={addEntry} style={{width:'100%',background:'#16a34a',color:'#fff',border:'none',borderRadius:8,padding:'10px',fontWeight:700,fontSize:14,cursor:'pointer'}}>
            Simpan Data
          </button>
        </div>

        {assess && latest && (
          <div style={{background:assess.wOk && assess.hOk ? '#f0fdf4' : '#fef2f2',borderRadius:10,padding:14,marginBottom:14}}>
            <div style={{fontWeight:700,marginBottom:6}}>Hasil Terakhir — Bulan {latest.month}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <div style={{textAlign:'center',background:'#fff',borderRadius:8,padding:10}}>
                <div style={{fontSize:22,fontWeight:800,color:assess.wOk?'#16a34a':'#dc2626'}}>{latest.w} kg</div>
                <div style={{fontSize:12,color:'#6b7280'}}>Berat · {assess.wPct}</div>
              </div>
              <div style={{textAlign:'center',background:'#fff',borderRadius:8,padding:10}}>
                <div style={{fontSize:22,fontWeight:800,color:assess.hOk?'#16a34a':'#dc2626'}}>{latest.h} cm</div>
                <div style={{fontSize:12,color:'#6b7280'}}>Tinggi · {assess.hPct}</div>
              </div>
            </div>
            {(!assess.wOk || !assess.hOk) && (
              <div style={{marginTop:8,padding:8,background:'#fef2f2',borderRadius:8,color:'#dc2626',fontSize:13}}>
                ⚠️ Di luar rentang normal WHO. Konsultasikan dengan dokter anak.
              </div>
            )}
          </div>
        )}

        {/* SVG Charts */}
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e5e7eb',padding:12,marginBottom:14}}>
          <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>📊 Grafik Berat vs WHO (Laki-laki)</div>
          <svg width={chartW} height={chartH} style={{display:'block',margin:'0 auto'}}>
            <polygon points={[...wData.map(d=>({m:d.m,v:d.p3})),...[...wData].reverse().map(d=>({m:d.m,v:d.p97}))].map(d=>`${mx(d.m)},${myw(d.v)}`).join(' ')} fill="#dcfce7" opacity="0.7"/>
            <polyline points={wData.map(d=>`${mx(d.m)},${myw(d.p50)}`).join(' ')} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="4,3"/>
            {growthLog.length > 1 && <polyline points={growthLog.map(d=>`${mx(d.month)},${myw(d.w)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="2"/>}
            {growthLog.map((d,i) => <circle key={i} cx={mx(d.month)} cy={myw(d.w)} r="4" fill="#2563eb"/>)}
            {[5,6,7,8,9,10,11,12].map(m => <text key={m} x={mx(m)} y={chartH-4} textAnchor="middle" fontSize="9" fill="#9ca3af">{m}</text>)}
            <text x="2" y="12" fontSize="9" fill="#6b7280">kg</text>
            <text x={chartW/2} y={chartH} fontSize="9" fill="#6b7280" textAnchor="middle">bulan</text>
          </svg>
          <div style={{display:'flex',gap:12,fontSize:11,color:'#6b7280',marginTop:4,justifyContent:'center',marginBottom:12}}>
            <span style={{background:'#dcfce7',padding:'1px 6px',borderRadius:3,color:'#16a34a'}}>P3–P97</span>
            <span style={{color:'#16a34a'}}>── P50</span>
            <span style={{color:'#2563eb'}}>── Data kamu</span>
          </div>

          <div style={{fontWeight:600,marginBottom:8,fontSize:13}}>📊 Grafik Tinggi vs WHO (Laki-laki)</div>
          <svg width={chartW} height={chartH} style={{display:'block',margin:'0 auto'}}>
            <polygon points={[...hData.map(d=>({m:d.m,v:d.p3})),...[...hData].reverse().map(d=>({m:d.m,v:d.p97}))].map(d=>`${mx(d.m)},${myh(d.v)}`).join(' ')} fill="#dbeafe" opacity="0.7"/>
            <polyline points={hData.map(d=>`${mx(d.m)},${myh(d.p50)}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,3"/>
            {growthLog.length > 1 && <polyline points={growthLog.map(d=>`${mx(d.month)},${myh(d.h)}`).join(' ')} fill="none" stroke="#dc2626" strokeWidth="2"/>}
            {growthLog.map((d,i) => <circle key={i} cx={mx(d.month)} cy={myh(d.h)} r="4" fill="#dc2626"/>)}
            {[5,6,7,8,9,10,11,12].map(m => <text key={m} x={mx(m)} y={chartH-4} textAnchor="middle" fontSize="9" fill="#9ca3af">{m}</text>)}
            <text x="2" y="12" fontSize="9" fill="#6b7280">cm</text>
            <text x={chartW/2} y={chartH} fontSize="9" fill="#6b7280" textAnchor="middle">bulan</text>
          </svg>
          <div style={{display:'flex',gap:12,fontSize:11,color:'#6b7280',marginTop:4,justifyContent:'center'}}>
            <span style={{background:'#dbeafe',padding:'1px 6px',borderRadius:3,color:'#2563eb'}}>P3–P97</span>
            <span style={{color:'#2563eb'}}>── P50</span>
            <span style={{color:'#dc2626'}}>── Data kamu</span>
          </div>
        </div>

        {growthLog.length > 0 && (
          <div style={{border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'8px 14px',background:'#f9fafb',fontWeight:600,fontSize:13}}>Riwayat</div>
            {[...growthLog].reverse().slice(0,10).map((d,i) => (
              <div key={i} style={{padding:'8px 14px',borderTop:'1px solid #e5e7eb',fontSize:13,display:'flex',justifyContent:'space-between'}}>
                <span>{d.date} · Bln {d.month}</span>
                <span style={{fontWeight:600}}>{d.w}kg / {d.h}cm</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── TAB: MILESTONE ──
  function TabMilestone() {
    const redFlags = ml.filter(m => !miles.includes(m.id) && m.flag === 'r');
    const total = ml.length;
    const done = ml.filter(m => miles.includes(m.id)).length;

    return (
      <div>
        {redFlags.length > 0 && (
          <div style={{background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:10,padding:12,marginBottom:14}}>
            <div style={{fontWeight:700,color:'#dc2626',marginBottom:6}}>⚠️ Perlu Perhatian</div>
            {redFlags.map(m => (
              <div key={m.id} style={{fontSize:13,color:'#dc2626',marginBottom:3}}>• {m.text}</div>
            ))}
            <div style={{fontSize:12,color:'#991b1b',marginTop:6}}>Konsultasikan dengan dokter anak segera.</div>
          </div>
        )}

        <div style={{textAlign:'center',margin:'0 0 16px',padding:14,background:'#f0fdf4',borderRadius:10}}>
          <div style={{fontSize:32,fontWeight:800,color:'#16a34a'}}>{done}/{total}</div>
          <div style={{fontSize:13,color:'#6b7280'}}>Milestone bulan {month} tercapai</div>
          <div style={{height:8,background:'#d1fae5',borderRadius:4,marginTop:8}}>
            <div style={{height:'100%',background:'#16a34a',borderRadius:4,width:`${(done/total)*100}%`,transition:'width 0.3s'}}/>
          </div>
        </div>

        {Object.entries(AREAS).map(([akey, aval]) => {
          const aItems = ml.filter(m => m.area === akey);
          if (!aItems.length) return null;
          return (
            <div key={akey} style={{marginBottom:10,border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden'}}>
              <button onClick={() => setMaOpen(maOpen===akey ? null : akey)}
                style={{width:'100%',padding:'10px 14px',background:maOpen===akey?'#f0fdf4':'#f9fafb',border:'none',textAlign:'left',fontWeight:600,fontSize:14,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span>{aval.icon} {aval.label}</span>
                <span style={{fontSize:12,color:'#6b7280'}}>{aItems.filter(m=>miles.includes(m.id)).length}/{aItems.length} {maOpen===akey?'▲':'▼'}</span>
              </button>
              {maOpen===akey && aItems.map(m => {
                const achieved = miles.includes(m.id);
                const isRed = m.flag === 'r';
                return (
                  <div key={m.id} style={{padding:'10px 14px',borderTop:'1px solid #e5e7eb',display:'flex',gap:10,alignItems:'flex-start',background:achieved?'#f0fdf4':'#fff'}}>
                    <button onClick={() => {
                      const next = achieved ? miles.filter(x=>x!==m.id) : [...miles,m.id];
                      save('bm', next, setMiles);
                    }} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',padding:0,lineHeight:1}}>
                      {achieved ? '✅' : isRed ? '🚨' : '⬜'}
                    </button>
                    <div>
                      <div style={{fontSize:13}}>{m.text}</div>
                      {isRed && !achieved && <div style={{fontSize:11,color:'#dc2626',marginTop:2}}>Konsul dokter jika belum tercapai</div>}
                      {m.flag==='a' && <div style={{fontSize:11,color:'#7c3aed',marginTop:2}}>🚀 Milestone lebih cepat</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ── TAB: MPASI ──
  function TabMPASI() {
    const mMonths = [6,7,8,9,10,11,12];
    const weeks = MPASI[mm] || MPASI[6];
    const wData = weeks[mw+1] || [];
    const DAYS = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
    const MEALS = [
      {key:1,label:'🌅 Sarapan'},
      {key:2,label:'☀️ Makan Siang'},
      {key:3,label:'🌙 Makan Malam'},
      {key:4,label:'🍎 Snack'},
    ];

    function RecipeModal() {
      if (!recipe) return null;
      const keys = parseMeal(recipe);
      return (
        <div onClick={() => setRecipe(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div onClick={e => e.stopPropagation()} style={{background:'#fff',borderRadius:'16px 16px 0 0',padding:20,maxHeight:'80vh',overflowY:'auto',width:'100%',maxWidth:480}}>
            <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>🍳 Cara Membuat</div>
            <div style={{fontSize:13,color:'#374151',marginBottom:12,background:'#f9fafb',padding:10,borderRadius:8}}>{recipe}</div>
            {keys.length === 0 && <div style={{color:'#6b7280',fontSize:13}}>Ikuti resep dasar sesuai isi menu.</div>}
            {keys.map(k => {
              const r = KR[k];
              if (!r) return null;
              const open = rOpen === k;
              return (
                <div key={k} style={{marginBottom:8,border:'1px solid #e5e7eb',borderRadius:8,overflow:'hidden'}}>
                  <button onClick={() => setROpen(open ? null : k)}
                    style={{width:'100%',padding:'8px 12px',background:open?'#eff6ff':'#f9fafb',border:'none',textAlign:'left',fontWeight:600,fontSize:13,cursor:'pointer',display:'flex',justifyContent:'space-between'}}>
                    {r.n} <span>{open?'▲':'▼'}</span>
                  </button>
                  {open && (
                    <div style={{padding:'8px 12px'}}>
                      {r.steps.map((s,i) => (
                        <div key={i} style={{fontSize:12,color:'#374151',marginBottom:4,display:'flex',gap:6}}>
                          <span style={{fontWeight:700,color:'#3b82f6',minWidth:16}}>{i+1}.</span> {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button onClick={() => setRecipe(null)} style={{width:'100%',marginTop:12,background:'#1e40af',color:'#fff',border:'none',borderRadius:8,padding:10,fontWeight:700,cursor:'pointer'}}>Tutup</button>
          </div>
        </div>
      );
    }

    const notes = MPASI_NOTES[mm];

    return (
      <div>
        <div style={{background:'#fef3c7',borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:12,color:'#92400e'}}>
          🚨 <strong>Alergi:</strong> Telur & seafood dihapus. Ikan air tawar mulai bln 8 dengan observasi 5 hari. Konsul SpA untuk rencana uji provokasi telur.
        </div>

        {/* Month selector */}
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:6,marginBottom:12}}>
          {mMonths.map(m => (
            <button key={m} onClick={() => { setMm(m); setMw(0); }}
              style={{padding:'6px 12px',borderRadius:20,border:'none',background:mm===m?'#1e40af':'#e5e7eb',color:mm===m?'#fff':'#374151',fontWeight:mm===m?700:400,cursor:'pointer',whiteSpace:'nowrap',fontSize:13}}>
              Bln {m}
            </button>
          ))}
        </div>

        {/* Week selector */}
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {[0,1,2,3].map(w => (
            <button key={w} onClick={() => setMw(w)}
              style={{flex:1,padding:'6px 0',borderRadius:8,border:'none',background:mw===w?'#eff6ff':'#f3f4f6',color:mw===w?'#1e40af':'#374151',fontWeight:mw===w?700:400,cursor:'pointer',fontSize:13}}>
              Minggu {w+1}
            </button>
          ))}
        </div>

        {/* Monthly notes */}
        {notes && (
          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:10,padding:12,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:'#15803d'}}>📋 Panduan Bulan {mm}</div>
            <div style={{display:'grid',gap:6,marginBottom:8}}>
              <div style={{fontSize:12,color:'#374151'}}><span style={{fontWeight:600}}>Tekstur:</span> {notes.tekstur}</div>
              <div style={{fontSize:12,color:'#374151'}}><span style={{fontWeight:600}}>Frekuensi:</span> {notes.frekuensi}</div>
              <div style={{fontSize:12,color:'#374151'}}><span style={{fontWeight:600}}>Porsi:</span> {notes.porsi}</div>
            </div>
            <div style={{background:'#fff',borderRadius:8,padding:8}}>
              {notes.tips.map((tip,i) => (
                <div key={i} style={{fontSize:12,color:'#374151',marginBottom:i<notes.tips.length-1?4:0,lineHeight:1.4}}>• {tip}</div>
              ))}
            </div>
            {notes.allergyNote && (
              <div style={{marginTop:8,fontSize:12,color:'#b45309',background:'#fef3c7',borderRadius:6,padding:'6px 8px'}}>
                🔎 {notes.allergyNote}
              </div>
            )}
          </div>
        )}

        {wData.map((day, di) => (
          <div key={di} style={{marginBottom:12,border:'1px solid #e5e7eb',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'8px 14px',background:'#eff6ff',fontWeight:700,fontSize:13,color:'#1e40af'}}>
              {DAYS[di]} — Hari {day[0]}
            </div>
            {MEALS.map(({key, label}) => (
              <div key={key} style={{padding:'8px 14px',borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'#6b7280',fontWeight:600}}>{label}</div>
                  <div style={{fontSize:13,color:'#374151',marginTop:2,lineHeight:1.4}}>
                    {day[key] === '-' ? <span style={{color:'#9ca3af',fontStyle:'italic'}}>Belum mulai</span> :
                   day[key] === '--' ? <span style={{color:'#d1d5db',fontStyle:'italic'}}>—</span> :
                   day[key].includes('⚠️') ? <span style={{color:'#d97706'}}>{day[key]}</span> : day[key]}
                  </div>
                </div>
                {day[key] && day[key] !== '-' && day[key] !== '--' && (
                  <button onClick={() => { setRecipe(day[key]); setROpen(null); }}
                    style={{background:'#eff6ff',color:'#1e40af',border:'none',borderRadius:6,padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}}>
                    🍳 Resep
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
        <RecipeModal />
      </div>
    );
  }

  // ── TAB: TRACKER ──
  function TabTracker() {
    const allActs = Object.values(ad.cats).flat();
    const done = allActs.filter(a => checked[`${month}-${a.id}`]).length;
    const cats = Object.entries(ad.cats);

    return (
      <div>
        <div style={{textAlign:'center',padding:16,background:'#eff6ff',borderRadius:10,marginBottom:14}}>
          <div style={{fontSize:32,fontWeight:800,color:'#1e40af'}}>{done}/{allActs.length}</div>
          <div style={{fontSize:13,color:'#6b7280'}}>Aktivitas hari ini selesai</div>
          <div style={{height:8,background:'#bfdbfe',borderRadius:4,marginTop:8}}>
            <div style={{height:'100%',background:'#1e40af',borderRadius:4,width:`${allActs.length?(done/allActs.length)*100:0}%`,transition:'width 0.3s'}}/>
          </div>
        </div>
        {cats.map(([cat, acts]) => {
          const catDone = acts.filter(a => checked[`${month}-${a.id}`]).length;
          return (
            <div key={cat} style={{marginBottom:8,padding:'10px 14px',background:'#f9fafb',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontWeight:600,fontSize:13}}>{cat}</span>
                <span style={{fontSize:12,color:'#6b7280'}}>{catDone}/{acts.length}</span>
              </div>
              <div style={{height:6,background:'#e5e7eb',borderRadius:3}}>
                <div style={{height:'100%',background:'#3b82f6',borderRadius:3,width:`${acts.length?(catDone/acts.length)*100:0}%`}}/>
              </div>
            </div>
          );
        })}
        <button onClick={() => {
          const next = {...checked};
          allActs.forEach(a => { next[`${month}-${a.id}`] = false; });
          save('bc', next, setChecked);
        }} style={{width:'100%',marginTop:8,padding:10,background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:8,fontWeight:700,cursor:'pointer'}}>
          Reset Tracker Hari Ini
        </button>
      </div>
    );
  }

  const COMPONENTS = [TabAktivitas, TabJadwal, TabTumbuh, TabMilestone, TabMPASI, TabTracker];
  const Current = COMPONENTS[tab];

  return (
    <div style={{maxWidth:480,margin:'0 auto',fontFamily:'system-ui,sans-serif',background:'#f9fafb',minHeight:'100vh'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e40af,#3b82f6)',color:'#fff',padding:'16px 16px 12px'}}>
        <div style={{fontSize:18,fontWeight:800}}>👶 Baby Dev</div>
        <div style={{fontSize:12,opacity:0.85,marginBottom:10}}>Panduan Tumbuh Kembang Bayi Laki-laki</div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <span style={{fontSize:13,opacity:0.8}}>Bulan:</span>
          <div style={{display:'flex',gap:4}}>
            {[5,6,7,8,9,10,11,12].map(m => (
              <button key={m} onClick={() => setMonth(m)}
                style={{padding:'3px 8px',borderRadius:12,border:'none',background:month===m?'#fff':'rgba(255,255,255,0.25)',color:month===m?'#1e40af':'#fff',fontWeight:month===m?700:400,cursor:'pointer',fontSize:12}}>
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',overflowX:'auto',background:'#fff',borderBottom:'2px solid #e5e7eb'}}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{padding:'10px 12px',border:'none',background:'none',fontWeight:tab===i?700:400,color:tab===i?'#1e40af':'#6b7280',borderBottom:tab===i?'2px solid #1e40af':'2px solid transparent',cursor:'pointer',fontSize:12,whiteSpace:'nowrap',marginBottom:-2}}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{padding:14}}>
        <Current />
      </div>
    </div>
  );
}
