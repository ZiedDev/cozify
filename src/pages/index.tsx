import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center text-center">
        <div className="max-w-4xl space-y-6">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-medium">
            Build your ideal{" "}
            <span className="text-accent font-serif italic font-normal">
              focus environment
            </span>
            .
          </h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
