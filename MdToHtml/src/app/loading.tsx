import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-morandi-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-morandi-500" />
        <p className="text-lg font-medium text-morandi-700 animate-pulse">
          加载中...
        </p>
      </div>
    </div>
  );
}
