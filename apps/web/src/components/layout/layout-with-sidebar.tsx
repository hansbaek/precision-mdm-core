import { motion, type Variants } from "framer-motion";
import { CircleIcon } from "lucide-react";
import { useNavigate } from "react-router";
import ProfileIcon from "./profile-icon";
import { useTranslation } from "react-i18next";
import ThemeIcon from "../theme/theme-icon";
import SettingIcon from "../setting/setting-icon";
import { SidebarInset, SidebarProvider } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { AppSidebar } from "../navbar/app-sidebar";

const variants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  enter: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

interface LayoutWithSidebarProps {
  title: string;
  children: React.ReactNode;
  withMotion?: boolean;
  headerButton?: React.ReactNode;
  hideSidebar?: boolean;
}

export const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({
  children,
  title,
  withMotion = true,
  headerButton,
  hideSidebar,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  //const [openSidebar, setOpenSidebar] = useState(true);

  if (hideSidebar) {
    return (
      <>
        <div className="bg-background-light dark:bg-background-dark font-display min-h-screen text-slate-900 dark:text-slate-100">
          <div className="relative flex min-h-screen w-full flex-col">
            <header className="px-6 py-3 sticky top-0 z-50 border-b shadow border-slate-200 bg-background">
              <div className="mx-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div
                    className="flex items-center gap-3 text-orange-500  cursor-pointer"
                    onClick={() => navigate("/")}
                  >
                    <div className="size-8 flex items-center justify-center bg-orange-500 rounded-lg text-white">
                      <CircleIcon />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight hidden sm:block text-orange-500">
                      DII FE Boilerplate
                    </h1>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="mr-2 dark:bg-slate-300"
                  />
                  <nav className="flex items-center space-x-1">
                    <span className="px-3 py-1.5 text-sm font-bold text-orange-500 bg-orange-50 dark:bg-orange-500/40 rounded-md">
                      {title}
                    </span>
                    <span
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-orange-500 hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700 rounded-md transition-all cursor-pointer"
                      onClick={() => navigate(-1)}
                    >
                      {t("navItem.goToPrev")}
                    </span>
                  </nav>
                </div>
                <div className="flex items-center gap-4 min-w-fit ml-auto mr-5">
                  {headerButton}
                  <ThemeIcon />
                  <SettingIcon />
                  <ProfileIcon />
                </div>
              </div>
            </header>
            <main className="flex-1 mx-auto w-full px-6 py-8 flex flex-col gap-8">
              <motion.div
                initial="hidden"
                animate="enter"
                exit="exit"
                variants={withMotion ? variants : undefined}
                transition={{ duration: 0.4, type: "tween" }}
              >
                {children}
              </motion.div>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>{title} | DII FE Boilerplate</title>
      <SidebarProvider className="flex flex-col">
        {/* <header className="sticky top-0 z-50 flex w-full items-center justify-between shrink-0 shadow-sm dark:shadow-white h-16 border-b"> */}
        <header className="sticky top-0 z-50 flex w-full items-center justify-between h-(--header-height) border-b bg-background shrink-0">
          <div className="w-(--sidebar-width) border-r p-3 flex items-center justify-between shrink-0">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="bg-orange-500 p-1.5 rounded-lg text-white">
                <CircleIcon />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight tracking-tight text-orange-500">
                  DII FE Boilerplate
                </h1>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider dark:text-white">
                  Page name
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 w-full ml-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-4 min-w-fit ml-auto mr-5">
            {headerButton}
            <ThemeIcon />
            <SettingIcon />
            <ProfileIcon />
          </div>
        </header>
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <div className="flex-1 flex flex-col overflow-auto w-full">
              <motion.div
                initial="hidden"
                animate="enter"
                exit="exit"
                variants={withMotion ? variants : undefined}
                transition={{ duration: 0.4, type: "tween" }}
              >
                {children}
              </motion.div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
};
