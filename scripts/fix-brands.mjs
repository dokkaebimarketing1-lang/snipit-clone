const SUPA = 'https://hofitquynnpzvolrmumf.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvZml0cXV5bm5wenZvbHJtdW1mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzYzODA3NiwiZXhwIjoyMDg5MjE0MDc2fQ.wtxcKd6N6SRFsRMSm0HSE7sipWegvhxcCnt96oySIzc';
const UID = '73e36032-c92f-48ce-9e9c-429194bc543c';
const H = { 'apikey': SK, 'Authorization': 'Bearer ' + SK, 'Content-Type': 'application/json' };

async function main() {
  // 1. Fix all Unknown brands
  const r1 = await fetch(`${SUPA}/rest/v1/saved_ads?brand_name=eq.Unknown&user_id=eq.${UID}`, {
    method: 'PATCH',
    headers: { ...H, 'Prefer': 'return=representation' },
    body: JSON.stringify({ brand_name: '커브 레퍼런스' })
  });
  const d1 = await r1.json();
  console.log('Fixed Unknown:', Array.isArray(d1) ? d1.length : 0);

  // 2. Verify
  const r2 = await fetch(`${SUPA}/rest/v1/saved_ads?select=id&brand_name=eq.Unknown&user_id=eq.${UID}`, { headers: H });
  const d2 = await r2.json();
  console.log('Remaining Unknown:', d2.length);

  // 3. Total count
  const r3 = await fetch(`${SUPA}/rest/v1/saved_ads?select=id&user_id=eq.${UID}`, { headers: H });
  const d3 = await r3.json();
  console.log('Total ads:', d3.length);
}
main().catch(console.error);
