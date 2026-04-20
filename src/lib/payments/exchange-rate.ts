export async function getUsdToInrRate(): Promise<number> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Failed to fetch exchange rate')
  const data = await res.json()
  return data.rates.INR as number
}
