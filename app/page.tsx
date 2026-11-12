'use client';
import {useEffect,useState} from 'react';
type Category={id:string;name:string;symbol:string;color:string;glow:string};
type Tier={id:string;name:string;price:number};
type Card={name:string;rarity:string;category:string;tier:string;illustrativeValue:number};
type Owned=Card&{id:string};
type Data={balance:number;opened:number;owned:Owned[]};
const categories:Category[]=[{id:'pokemon',name:'Pokémon',symbol:'ϟ',color:'#ffd54f',glow:'#564719'},{id:'basketball',name:'Basketball',symbol:'★',color:'#f49a57',glow:'#59391d'},{id:'baseball',name:'Baseball',symbol:'◆',color:'#8acfff',glow:'#23425f'},{id:'onepiece',name:'One Piece',symbol:'☠',color:'#bc9bff',glow:'#493365'}];
const tiers:Tier[]=[{id:'standard',name:'Standard',price:10},{id:'elite',name:'Elite',price:50},{id:'legendary',name:'Legendary',price:100}];
const fresh=():Data=>({balance:250,opened:0,owned:[]});
const storageKey='vault-rips-rebuild-demo-v1';
const currency=(n:number)=>'$'+n.toFixed(2);
export default function Home(){
 const [view,setView]=useState<'home'|'collection'|'profile'>('home');
 const [category,setCategory]=useState('all');const [tier,setTier]=useState('all');
 const [data,setData]=useState<Data>(fresh);const [hydrated,setHydrated]=useState(false);
 const [selection,setSelection]=useState<{category:Category;tier:Tier}|null>(null);
 const [phase,setPhase]=useState<'confirm'|'spinning'|'result'>('confirm');
 const [card,setCard]=useState<Card|null>(null);const [openingId,setOpeningId]=useState('');
 const [error,setError]=useState('');
 useEffect(()=>{try{const v=localStorage.getItem(storageKey);if(v){const d=JSON.parse(v);if(typeof d.balance==='number'&&Array.isArray(d.owned)&&typeof d.opened==='number')setData(d)}}catch{}setHydrated(true)},[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(storageKey,JSON.stringify(data))},[data,hydrated]);
 const navigate=(v:'home'|'collection'|'profile')=>{if(phase==='spinning')return;setView(v);window.scrollTo({top:0,behavior:'smooth'})};
 const start=(c:Category,t:Tier)=>{setError('');setCard(null);setPhase('confirm');setSelection({category:c,tier:t})};
 async function rip(){if(!selection||phase!=='confirm')return;if(data.balance<selection.tier.price){setError('Insufficient demo credits.');return}setPhase('spinning');setError('');
 try{
 const response=await fetch('/api/demo/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:selection.category.id,tier:selection.tier.id})});
 if(!response.ok)throw new Error('Unable to open pack');
 const outcome=await response.json() as {openingId:string;card:Card};
 await new Promise(resolve=>setTimeout(resolve,6200));
 setData(d=>({...d,balance:d.balance-selection.tier.price,opened:d.opened+1}));
 setOpeningId(outcome.openingId);setCard(outcome.card);setPhase('result');
 }catch{setPhase('confirm');setError('Could not open the demo pack. Please try again.')}
 }
 function decide(decision:'sell'|'keep'){if(!card||!selection)return;const id=openingId;setData(d=>decision==='sell'?{...d,balance:d.balance+card.illustrativeValue}:{...d,owned:[...d.owned,{...card,id}]});setCard(null);setSelection(null);setPhase('confirm')}
 return <><header><div className="logo"><span className="logo-mark">R</span><div>VAULT RIPS<small>THE COLLECTIBLE EXPERIENCE</small></div></div><nav className="header-links" aria-label="Main navigation"><button className={view==='home'?'active':''} onClick={()=>navigate('home')}>DISCOVER</button><button className={view==='collection'?'active':''} onClick={()=>navigate('collection')}>MY COLLECTION</button><button className={view==='profile'?'active':''} onClick={()=>navigate('profile')}>PROFILE</button></nav><div className="balance"><span>DEMO CREDITS</span><strong>{currency(data.balance)}</strong></div></header>
 <main>{view==='home'&&<><section className="hero"><div><span className="eyebrow">WELCOME TO THE VAULT</span><h1>RIP IT.<br/>REVEAL IT.<br/><em>OWN IT.</em></h1><p>The rush of a slot. The thrill of a real collectible. Choose your pack, watch the reveal, and decide what to do with your hit.</p><button className="primary" onClick={()=>document.getElementById('packs')?.scrollIntoView({behavior:'smooth'})}>EXPLORE PACKS ↗</button></div><div className="stage" aria-hidden="true"><div className="hero-pack"><b>R</b><span>LEGENDARY</span><small>THE VAULT COLLECTION</small></div></div></section>
 <div className="section-head" id="packs"><div><span className="eyebrow">CHOOSE YOUR UNIVERSE</span><h2>THE PACK VAULT</h2></div><p>Four categories. Three tiers. Endless suspense.</p></div>
 <div className="filters" aria-label="Category filters">{[{id:'all',name:'All Packs'},...categories].map(c=><button key={c.id} className={'filter '+(category===c.id?'selected':'')} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div>
 <div className="filters tiers" aria-label="Tier filters">{[{id:'all',name:'All Tiers'},...tiers].map(t=><button key={t.id} className={'filter '+(tier===t.id?'selected':'')} onClick={()=>setTier(t.id)}>{t.name}</button>)}</div>
 <div className="packs">{categories.filter(c=>category==='all'||c.id===category).flatMap(c=>tiers.filter(t=>tier==='all'||t.id===tier).map(t=><article className="pack" key={c.id+t.id} style={{'--accent':c.color,'--glow':c.glow} as React.CSSProperties}><div className="pack-scene"><div className="foil"><b>R</b><span>{t.name.toUpperCase()}</span></div></div><div className="pack-content"><h3>{c.name}</h3><p>{t.name} collectible pack</p><div className="pack-bottom"><strong>{currency(t.price)}</strong><button onClick={()=>start(c,t)}>RIP PACK ↗</button></div></div></article>)))}</div>
 <div className="panel"><span className="eyebrow">THE COLLECTION</span><h2>YOUR HITS. YOUR VAULT.</h2><p>Keep your favorite cards or exchange their illustrative value for more demo credits.</p><button className="primary" onClick={()=>navigate('collection')}>VIEW COLLECTION ↗</button></div></>}
 {view==='collection'&&<><div className="section-head"><div><span className="eyebrow">YOUR PRIVATE VAULT</span><h2>MY COLLECTION</h2></div></div><div className="cards">{data.owned.length?data.owned.map((c,i)=>{const cat=categories.find(x=>x.id===c.category);return <article className="owned" key={c.id+i} style={{'--accent':cat?.color||'#c6ff39','--glow':cat?.glow||'#35421c'} as React.CSSProperties}><div className="owned-art">{cat?.symbol||'R'}</div><h3>{c.name}</h3><p>{c.rarity} · {c.tier}</p><strong>Illustrative value: {currency(c.illustrativeValue)}</strong></article>}):<div className="empty"><h2>THE VAULT IS EMPTY</h2><p>Open a pack and choose Keep to add a card.</p><button className="primary" onClick={()=>navigate('home')}>EXPLORE PACKS</button></div>}</div></>}
 {view==='profile'&&<><div className="section-head"><div><span className="eyebrow">YOUR DEMO ACCOUNT</span><h2>PLAYER PROFILE</h2></div></div><div className="stats"><div><span>Demo credits</span><strong>{currency(data.balance)}</strong></div><div><span>Packs opened</span><strong>{data.opened}</strong></div><div><span>Cards kept</span><strong>{data.owned.length}</strong></div></div><div className="panel"><h2>DEMO CONTROLS</h2><p>This prototype has no real-money functionality or physical card entitlement.</p><button className="secondary" onClick={()=>{if(window.confirm('Reset this browser demo?'))setData(fresh())}}>RESET DEMO</button></div></>}
 </main><footer><span>VAULT RIPS · FIRST PLAYABLE BUILD</span><span>SIMULATED CREDITS AND CARDS · NO REAL PAYMENTS OR PRIZES</span></footer>
 {selection&&<div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-box"><button className="close" aria-label="Close" disabled={phase==='spinning'} onClick={()=>{setSelection(null);setCard(null)}}>×</button>{phase==='confirm'&&<><span className="eyebrow">READY TO RIP?</span><h2 id="dialog-title">{selection.category.name} {selection.tier.name}</h2><p>Open for {currency(selection.tier.price)} in simulated credits. This is a development demo, not a real purchase.</p>{error&&<p role="alert">{error}</p>}<div className="actions"><button className="secondary" onClick={()=>setSelection(null)}>CANCEL</button><button className="primary" onClick={rip}>RIP FOR {currency(selection.tier.price)}</button></div></>}
 {phase==='spinning'&&<><span className="eyebrow">THE VAULT IS OPENING</span><h2 id="dialog-title">HERE WE GO...</h2><div className="reels spinning" aria-label="Pack reveal animation"><div className="reel">R</div><div className="reel">★</div><div className="reel">R</div></div><p>Locking in your reveal...</p></>}
 {phase==='result'&&card&&<><span className="eyebrow">YOU PULLED A {card.rarity} CARD</span><h2 id="dialog-title">{card.name}</h2><div className="result-card" style={{'--accent':selection.category.color,'--glow':selection.category.glow} as React.CSSProperties}>{selection.category.symbol}</div><p>Illustrative card value: <strong>{currency(card.illustrativeValue)}</strong></p><div className="actions"><button className="secondary" onClick={()=>decide('keep')}>KEEP CARD</button><button className="primary" onClick={()=>decide('sell')}>SELL FOR {currency(card.illustrativeValue)}</button></div><p className="notice">Demo only — no actual card ownership, buyback or payment.</p></>}</div></div>}
 </>;
}
