'use client';

export default function PlaceDetailLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        <div className="text-sm text-text-secondary">Loading...</div>
      </div>
    </div>
  );
}

