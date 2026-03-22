'use client';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
export default function Page() {
  return (
    <div className="flex min-h-screen bg-[#EFEFEF]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Coming soon</div>
      </div>
    </div>
  );
}
