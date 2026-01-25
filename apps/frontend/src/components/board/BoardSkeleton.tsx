'use client';

export default function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Board header skeleton */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <div className="w-32 h-6 bg-gray-200 rounded" />
          <div className="w-48 h-4 bg-gray-100 rounded hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-8 bg-gray-200 rounded-lg" />
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
        </div>
      </div>

      {/* Columns container skeleton */}
      <div className="flex-1 overflow-x-auto bg-gray-100">
        <div className="flex gap-4 p-6 min-h-full">
          {/* Column skeletons */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col w-72 min-w-[288px] bg-gray-50 rounded-xl"
            >
              {/* Column header skeleton */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" />
                  <div className="w-20 h-4 bg-gray-200 rounded" />
                  <div className="w-6 h-5 bg-gray-200 rounded-full" />
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded" />
              </div>

              {/* Card skeletons */}
              <div className="p-2 space-y-2">
                {[1, 2, 3].slice(0, 3 - i + 1).map((j) => (
                  <div
                    key={j}
                    className="p-3 bg-white rounded-lg shadow-sm border border-gray-100"
                  >
                    <div className="w-full h-4 bg-gray-200 rounded mb-2" />
                    <div className="w-3/4 h-3 bg-gray-100 rounded mb-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-5 bg-gray-100 rounded" />
                      <div className="w-16 h-5 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add column button skeleton */}
          <div className="w-72 min-w-[288px] h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
