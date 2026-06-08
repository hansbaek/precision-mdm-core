import { motion, type Variants } from "framer-motion";

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

interface LayoutProps {
  children: React.ReactNode;
  withMotion?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  withMotion = true,
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={withMotion ? variants : undefined}
      transition={{ duration: 0.4, type: "tween" }}
    >
      {children}
    </motion.div>
  );
};
