import { type CommonReturnType, axiosInstance } from ".";

export const signIn = (data: {
  userId: string;
  password: string;
}): Promise<CommonReturnType<string>> =>
  axiosInstance.post("/signin", data).then((res) => res.data);
