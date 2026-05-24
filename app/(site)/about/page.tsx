import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { RequisitesBlock } from "@/components/legal/requisites-block";
import { pageTitle, SITE_DESCRIPTION, SITE_NAME } from "@/lib/brand";
import { getLegalEntityEmail, LEGAL_DOCUMENT_DATE } from "@/lib/legal";

export const metadata: Metadata = {
  title: pageTitle("О сервисе"),
  description: `Информация о сервисе ${SITE_NAME} и реквизиты продавца.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const contactEmail = getLegalEntityEmail();

  return (
    <LegalPage
      title="О сервисе"
      description={`Информация для пользователей. Обновлено ${LEGAL_DOCUMENT_DATE}`}
    >
      <LegalSection title={`Сервис ${SITE_NAME}`}>
        <p>{SITE_DESCRIPTION}</p>
        <p>
          Мы помогаем разработчикам оформить доступ к подпискам Codex, Cursor и Claude на
          выбранный срок: сравните тарифы на{" "}
          <Link href="/#pricing">главной странице</Link>, оплатите заказ и получите
          инструкции по активации в личном кабинете.
        </p>
      </LegalSection>

      <LegalSection title="Как связаться">
        <p>
          Вопросы по заказам и активации:{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>
        <p>
          Юридические вопросы и запросы по персональным данным — на тот же адрес с пометкой
          «Персональные данные» в теме письма.
        </p>
      </LegalSection>

      <LegalSection title="Документы">
        <ul>
          <li>
            <Link href="/terms">Пользовательское соглашение (публичная оферта)</Link>
          </li>
          <li>
            <Link href="/privacy">Политика конфиденциальности</Link>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Реквизиты продавца">
        <p>
          В соответствии с требованиями законодательства РФ о защите прав потребителей и о
          размещении информации о продавце на сайте дистанционной торговли ниже указаны
          сведения о владельце Сервиса.
        </p>
        <RequisitesBlock />
      </LegalSection>
    </LegalPage>
  );
}
