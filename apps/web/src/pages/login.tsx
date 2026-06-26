import { EyeOffIcon, EyeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { signIn } from "@/api/auth";
import { applySession } from "@/hooks/use-session";
import { Spinner } from "@/components/ui/spinner";
import { USER_ID_STORAGE } from "@/constants";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const [isShowPassword, setIsShowPassword] = useState(false);

  const [isRememberChecked, setIsRememberChecked] = useState(false);

  useEffect(() => {
    const savedUserId = localStorage.getItem(USER_ID_STORAGE);
    if (savedUserId) {
      setUserId(savedUserId);
      setIsRememberChecked(true);
    }
  }, []);

  const handleRememberChange = (checked: boolean) => {
    setIsRememberChecked(checked);

    if (checked) {
      localStorage.setItem(USER_ID_STORAGE, userId);
    } else {
      localStorage.removeItem(USER_ID_STORAGE);
    }
  };

  const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await signIn({
        userId,
        password,
      });

      if (!res.ok) {
        toast.error(res.error ?? t(`error.default`));
        return;
      }

      if (res.result) {
        toast.success(t(`success`));

        if (isRememberChecked) {
          localStorage.setItem(USER_ID_STORAGE, userId);
        } else {
          localStorage.removeItem(USER_ID_STORAGE);
        }
        // 토큰·프로필·권한을 스토어에 반영하고 보호 라우트로 이동.
        applySession(res.result);
        navigate("/", { replace: true });
      }
    } catch (e) {
      if (e instanceof AxiosError) {
        toast.error(e.response?.data.error);
      } else {
        toast.error(t(`error.default`));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // <div className="font-display bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">

    // </div>
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative z-10 w-80 max-w-md bg-white dark:bg-slate-900 shadow-sm rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 pt-4">
        <div className="mt-4 flex flex-col items-center text-nowrap">
          <h1 className="block text-xl text-[#707786] antialiased font-hankook">
            <span className="dark:text-white">Welcome to </span>
            <span className="text-orange-500 font-medium">T:MDM</span>
          </h1>
        </div>

        <form action="#" className="px-8 py-6" method="POST">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                className="w-full rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 h-12 px-4 transition-colors text-sm antialiased"
                id="userId"
                placeholder={t(`loginPage.userId`)}
                required={true}
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <div className="relative">
              <input
                className="w-full rounded-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100  h-12 px-4 transition-colors text-sm antialiased"
                id="password"
                placeholder={t(`loginPage.password`)}
                required={true}
                type={isShowPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                type="button"
                onClick={() => {
                  setIsShowPassword((prev) => !prev);
                }}
              >
                {isShowPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-start text-xs mt-3">
            <input
              type="checkbox"
              className="cursor-pointer"
              checked={isRememberChecked}
              onChange={(e) => {
                handleRememberChange(e.target.checked);
              }}
            />
            <span
              className="ml-2 cursor-pointer text-muted-foreground"
              onClick={() => {
                handleRememberChange(!isRememberChecked);
              }}
            >
              {t("loginPage.rememberId")}
            </span>
          </div>
          <button
            className="w-full  h-11 mt-4 text-sm bg-black text-white font-bold py-3 px-4 flex items-center justify-center transition-transform cursor-pointer rounded-xs dark:bg-slate-600"
            onClick={handleLogin}
          >
            {loading ? <Spinner /> : t(`loginPage.login`)}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
