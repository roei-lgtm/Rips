import { randomInt, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
export const runtime='nodejs';
const categories=['pokemon','basketball','baseball','onepiece'] as const;
const tiers=['standard','elite','legendary'] as const;
const cards:Record<string,string[]>={pokemon:['Thunder Legend','Mystic Dragon','Electric Guardian','Ancient Flame'],basketball:['Court Icon','Rookie Sensation','Championship Legend','All-Star Signature'],baseball:['Diamond Legend','Rookie Slugger','Home Run Hero','Golden Glove'],onepiece:['Grand Captain','Ocean Legend','Treasure Hunter','Pirate King']};
export async function POST(req:Request){
  let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
  if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid request'},{status:400});
  const b=body as Record<string,unknown>;
  if(typeof b.category!=='string'||!categories.includes(b.category as typeof categories[number])||typeof b.tier!=='string'||!tiers.includes(b.tier as typeof tiers[number]))return NextResponse.json({error:'Unknown pack'},{status:400});
  // DEMO ONLY: server generates illustrative outcome; no charge, inventory allocation or real entitlement.
  const pool=cards[b.category];const idx=randomInt(10000);
  const rarity=idx<100?'MYTHIC':idx<900?'LEGENDARY':idx<3400?'EPIC':'RARE';
  const multiplier=rarity==='MYTHIC'?8:rarity==='LEGENDARY'?3:rarity==='EPIC'?1.2:0.4;
  const price={standard:10,elite:50,legendary:100}[b.tier as typeof tiers[number]];
  return NextResponse.json({openingId:randomUUID(),card:{name:pool[randomInt(pool.length)],rarity,category:b.category,tier:b.tier,illustrativeValue:Math.round(price*multiplier)},demo:true,disclaimer:'No purchase, payout, or physical entitlement occurred.'},{headers:{'Cache-Control':'no-store'}});
}
