import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { LogOutIcon, UserIcon } from "lucide-react";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useAuthStore } from "@/hooks/use-auth-store";
import { useUserProfile } from "@/hooks/use-user-profile";

const languages = {
  en: { nativeName: "English" },
  kr: { nativeName: "Korean" },
};

type languageKeys = keyof typeof languages;

const ProfileIcon = () => {
  const { t, i18n } = useTranslation();

  const logout = useAuthStore((state) => state.logout);
  const userProfile = useUserProfile((state) => state.userProfile);
  const handleClickLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-initial">
      <div>
        <Popover>
          <PopoverTrigger className="flex items-center justify-center">
            <UserIcon
              size={24}
              className="text-slate-700  hover:text-orange-600 transition-all cursor-pointer dark:text-white"
            />
          </PopoverTrigger>
          <PopoverContent align="center" className="mr-5">
            <div className="grid gap-4">
              <div className="space-y-4">
                <h4 className="font-bold">{t(`navbar.profile.userProfile`)}</h4>
              </div>
              <hr />
              <div className="grid gap-2">
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="font-semibold">ID</Label>
                  <span>{userProfile.userId}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="font-semibold">
                    {t(`navbar.profile.name`)}
                  </Label>
                  <span>
                    {i18n.resolvedLanguage === "en"
                      ? userProfile.userNameEng
                      : userProfile.userName}
                  </span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="font-semibold">
                    {t(`navbar.profile.teamName`)}
                  </Label>
                  <span>
                    {i18n.resolvedLanguage === "en"
                      ? userProfile.teamNameEng
                      : userProfile.teamName}
                  </span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label className="font-semibold">
                    {t(`navbar.profile.role`)}
                  </Label>
                  <span>{userProfile.role}</span>
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label className="font-semibold">
                    {t(`navbar.profile.language`)}
                  </Label>
                  <div className="flex items-center gap-2">
                    {Object.keys(languages).map((lng) => (
                      <div
                        key={lng}
                        className={`p-1 rounded-lg hover:bg-orange-500 hover:text-white transition-all cursor-pointer ${
                          i18n.resolvedLanguage === lng
                            ? "bg-orange-400 text-white"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          i18n.changeLanguage(lng);
                        }}
                      >
                        {languages[lng as languageKeys].nativeName}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <hr />
              <Button
                onClick={handleClickLogout}
                className="text-lg font-semibold cursor-pointer"
              >
                <LogOutIcon />
                {t(`logout`)}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ProfileIcon;
