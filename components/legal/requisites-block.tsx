import { getLegalEntity } from "@/lib/legal";
import { SITE_DOMAIN } from "@/lib/brand";

export function RequisitesBlock() {
  const entity = getLegalEntity();

  if (!entity) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <p>
          Реквизиты продавца не заполнены. Укажите переменные{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">LEGAL_*</code> в файле{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> на сервере (см.{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code>).
        </p>
      </div>
    );
  }

  const ogrnLabel = entity.form === "ООО" ? "ОГРН" : "ОГРНИП";

  return (
    <dl className="grid gap-3 rounded-xl border border-border bg-card p-5 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
      <dt className="font-medium text-muted-foreground">Наименование</dt>
      <dd>{entity.name}</dd>

      <dt className="font-medium text-muted-foreground">Организационная форма</dt>
      <dd>{entity.form}</dd>

      <dt className="font-medium text-muted-foreground">ИНН</dt>
      <dd>{entity.inn}</dd>

      <dt className="font-medium text-muted-foreground">{ogrnLabel}</dt>
      <dd>{entity.ogrn}</dd>

      <dt className="font-medium text-muted-foreground">Юридический адрес</dt>
      <dd>{entity.legalAddress}</dd>

      <dt className="font-medium text-muted-foreground">Электронная почта</dt>
      <dd>
        <a href={`mailto:${entity.email}`}>{entity.email}</a>
      </dd>

      {entity.phone && (
        <>
          <dt className="font-medium text-muted-foreground">Телефон</dt>
          <dd>
            <a href={`tel:${entity.phone.replace(/\s/g, "")}`}>{entity.phone}</a>
          </dd>
        </>
      )}

      <dt className="font-medium text-muted-foreground">Сайт</dt>
      <dd>
        <a href={`https://${SITE_DOMAIN}`} rel="noopener noreferrer">
          {SITE_DOMAIN}
        </a>
      </dd>
    </dl>
  );
}
