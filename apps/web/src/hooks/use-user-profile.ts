import { create } from "zustand";
import { type UserProfile } from "@/types";

type UserProfileStore = {
  userProfile: UserProfile;
  setProfile: (profile: UserProfile) => void;
};

export const useUserProfile = create<UserProfileStore>((set) => ({
  userProfile: {
    userId: "",
    userName: "",
    userNameEng: "",
    teamName: "",
    teamNameEng: "",
    role: "",
  },
  setProfile: (profile: UserProfile) => set({ userProfile: { ...profile } }),
}));
