import { Toaster } from "sonner";
import ReservasMap from "@/components/ReservasMap";

export default function App() {
  return (
    <>
      <Toaster position="bottom-left" richColors />
      <ReservasMap />
    </>
  );
}
