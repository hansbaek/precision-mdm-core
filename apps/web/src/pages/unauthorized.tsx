import { Layout } from "@/components/layout/layout-simple";
import { Link } from "react-router";

export const UnauthorizedPage = () => {
  return (
    <Layout withMotion={false}>
      <div className="h-screen flex flex-col items-center justify-center">
        <h2 className="font-semibold text-2xl mb-3">Unauthorized</h2>
        <h2 className="font-medium text-base mb-5">
          You are not authorized to view this page.
        </h2>
        <Link className="hover:underline text-blue-600" to="/">
          Go back home &rarr;
        </Link>
      </div>
    </Layout>
  );
};
