import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-16 text-center">
        <div className="inline-block max-w-2xl">
          <h1 className={title({ size: "lg" })}>
            Build your ideal{" "}
            <span className={title({ color: "violet" })}>
              focus environment
            </span>
            .
          </h1>
          <p className={subtitle({ class: "mt-4 text-muted" })}>
            Curate ambient soundscapes, customize your focus timer, and create
            your cozy workspace.
          </p>
        </div>
      </section>
    </DefaultLayout>
  );
}
