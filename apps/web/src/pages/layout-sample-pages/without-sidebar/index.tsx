import { LayoutWithSidebar } from "@/components/layout/layout-with-sidebar";

const LayoutWithoutSidebarSamplePage = () => {
  return (
    <LayoutWithSidebar title="Home" hideSidebar={true}>
      <div className="w-full h-full flex items-center justify-center">
        <div>Sidebar 숨김 샘플</div>
      </div>
    </LayoutWithSidebar>
  );
};

export default LayoutWithoutSidebarSamplePage;
