import ProtectedRoute from '@/components/ProtectedRoute';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ⭐️ อนุญาตเฉพาะ 'SELLER' และ 'USER' (ถ้า User ทั่วไปเข้าหน้านี้ได้)
    // หรือถ้าหน้านี้สำหรับคนขายเท่านั้น ก็ใส่แค่ ['SELLER']
    <ProtectedRoute allowedRoles={['SELLER', 'USER']}>
      {children}
    </ProtectedRoute>
  );
}