import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">找不到頁面</h2>
        <p className="text-gray-600 mb-6">您要尋找的頁面不存在</p>
        <Link
          href="/zh"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
        >
          返回首頁
        </Link>
      </div>
    </div>
  );
}


