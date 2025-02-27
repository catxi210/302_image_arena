import ModelGenTop from "./model-gen/top";
import { ModelGenBottom } from "./model-gen/bottom";

export default function ModelGen() {
  return (
    <div className="flex size-full flex-col gap-4">
      <div className="@container">
        <div className="rounded-lg border bg-card text-card-foreground">
          <div className="grid gap-4 p-4">
            <ModelGenTop />
            <ModelGenBottom />
          </div>
        </div>
      </div>
    </div>
  );
}
