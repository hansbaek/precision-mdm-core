import { LayoutWithSidebar } from "@/components/layout/layout-with-sidebar";

const LayoutWithSidebarSamplePage = () => {
  return (
    <LayoutWithSidebar title="Home">
      <div className="w-full h-full flex items-center justify-center">
        <div>Sidebar 표시 샘플</div>
      </div>
    </LayoutWithSidebar>
  );
};

export default LayoutWithSidebarSamplePage;
