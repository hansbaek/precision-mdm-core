import { Link } from "react-router";
import { Layout } from "../components/layout/layout-simple";

export const NotFoundPage = () => {
  return (
    <Layout withMotion={false}>
      <div className="h-screen flex flex-col items-center justify-center">
        <h2 className="font-semibold text-2xl mb-3">Page Not Found</h2>
        <h2 className="font-medium text-base mb-5">
          The page you're looking for does not exist or has moved.
        </h2>
        <Link className="hover:underline text-info" to="/">
          Go back home &rarr;
        </Link>
      </div>
    </Layout>
  );
};
