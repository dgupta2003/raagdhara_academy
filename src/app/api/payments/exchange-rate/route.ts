import { NextResponse } from 'next/server'
import { getUsdToInrRate } from '@/lib/payments/exchange-rate'

export async function GET() {
  try {
    const rate = await getUsdToInrRate()
    return NextResponse.json({ rate })
  } catch {
    return NextResponse.json({ rate: 85 })
  }
}
