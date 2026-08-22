import DefaultLayout from "@/layouts/default";
import { Timer } from "@/components/timer";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center flex-1 py-12 md:py-20">
        <Timer />
      </section>
    </DefaultLayout>
  );
}
