import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="container flex flex-col items-center justify-center text-center"
      style={{ padding: "var(--spacing-3xl) 1rem", gap: "var(--spacing-md)", minHeight: "60vh" }}
    >
      <div
        className="flex items-center justify-center rounded-2xl bg-accent text-primary"
        style={{ width: "4rem", height: "4rem" }}
      >
        <Compass size={30} />
      </div>
      <h1 className="font-serif font-bold" style={{ fontSize: "var(--font-size-display)" }}>
        404
      </h1>
      <p className="text-muted-foreground" style={{ fontSize: "1.05rem", maxWidth: "26rem" }}>
        这里空空如也 —— 你要找的页面可能已被移动或删除。
      </p>
      <Button asChild style={{ marginTop: "var(--spacing-sm)" }}>
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  );
};

export default NotFound;
