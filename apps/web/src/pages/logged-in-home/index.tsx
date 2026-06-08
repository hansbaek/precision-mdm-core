import { LayoutWithSidebar } from "@/components/layout/layout-with-sidebar";

const LoggedInHomePage = () => {
  return (
    <LayoutWithSidebar title="Home">
      <div className="w-full h-full flex items-center justify-center">
        <div>로그인 되었을 때</div>
      </div>
    </LayoutWithSidebar>
  );
};

export default LoggedInHomePage;
