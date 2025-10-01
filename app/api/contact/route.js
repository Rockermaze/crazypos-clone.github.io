import { NextResponse } from 'next/server'

export async function POST(req){
  const data = await req.json() // name,email,message
  // TODO: send to your mail provider / Slack / Notion
  return NextResponse.json({ ok:true, received: data })
}
