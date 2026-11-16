import { Fragment } from "react";

import type { ContentBody, ContentSection } from "~/lib/content/pages";

import { RichText, type RichTextProps } from "./rich-text";

export type ContentSectionsProps = Omit<RichTextProps, "html" | "children"> & {
  sections: readonly ContentSection[];
};

/** Структурований вміст (запасні сторінки й статті) тією самою типографікою, що й HTML із Shopify. */
export function ContentSections({ sections, ...props }: ContentSectionsProps) {
  return (
    <RichText {...props}>
      {sections.map((section) => (
        // Без обгортки: заголовки й блоки — прямі нащадки, як у HTML із Shopify.
        <Fragment key={section.heading}>
          <h2>{section.heading}</h2>
          {section.blocks.map((block, index) => {
            // Порядок блоків сталий: це статичний вміст, який не переставляється.
            if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
            const List = block.ordered ? "ol" : "ul";

            return (
              <List key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </List>
            );
          })}
        </Fragment>
      ))}
    </RichText>
  );
}

export type ContentBodyViewProps = Omit<RichTextProps, "html" | "children"> & {
  body: ContentBody;
};

/** Текст сторінки чи статті незалежно від джерела: HTML із магазину або запасні секції. */
export function ContentBodyView({ body, ...props }: ContentBodyViewProps) {
  return body.kind === "html" ? (
    <RichText html={body.html} {...props} />
  ) : (
    <ContentSections sections={body.sections} {...props} />
  );
}
