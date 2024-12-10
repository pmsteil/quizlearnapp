import LeftColumn from './columns/LeftColumn';
import CenterColumn from './columns/CenterColumn';
import RightColumn from './columns/RightColumn';

export default function DashboardContent() {
  return (
    <main className="flex-1 container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <LeftColumn />
        </div>
        <div className="md:col-span-6">
          <CenterColumn />
        </div>
        <div className="md:col-span-3">
          <RightColumn />
        </div>
      </div>
    </main>
  );
}
