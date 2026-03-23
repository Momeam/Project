// lib/data.ts
// สำหรับการใช้ Mock data ค้นหา ให้ใช้ lib/types.ts แทน

export type SearchParams = {
  query?: string
  type?: string
  tags?: string | string[]
}

export async function searchProperties() {
  // ใช้ Mock data จาก types.ts แทน
  return []
}