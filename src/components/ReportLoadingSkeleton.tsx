export default function ReportLoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-pulse">
      {/* Skeleton badge */}
      <div className="flex flex-col items-center">
        <div className="w-48 h-12 bg-gray-200 rounded-full mb-4"></div>
        <div className="w-64 h-4 bg-gray-200 rounded"></div>
      </div>
      {/* Skeleton block cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div className="w-32 h-5 bg-gray-200 rounded"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
        </div>
      ))}
      {/* Skeleton symbolic proof */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 border-l-4 border-gray-200">
        <div className="w-40 h-5 bg-gray-200 rounded mb-4"></div>
        {[1, 2].map((i) => (
          <div key={i} className="w-full h-8 bg-gray-200 rounded mb-2"></div>
        ))}
      </div>
      {/* Skeleton buttons */}
      <div className="flex justify-center gap-4">
        <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
        <div className="w-32 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}
