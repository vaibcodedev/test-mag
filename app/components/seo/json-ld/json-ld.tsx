const BACKSLASH = String.fromCharCode(92);
/** Символ «менше» як JSON-escape: зворотна коса, «u003c». */
const ESCAPED_LT = `${BACKSLASH}u003c`;

/**
 * JSON для вставки в <script>. Символ «<» замінюється на JSON-escape, щоб рядок
 * на кшталт «</script>» у даних з адмінки не закрив тег і не відкрив XSS.
 * Після JSON.parse значення лишається тим самим.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).split("<").join(ESCAPED_LT);
}

export type JsonLdProps = {
  /** Один вузол schema.org або кілька: кожен отримає свій <script>. */
  data: object | object[];
  /** Nonce із Content-Security-Policy. */
  nonce?: string;
};

/** Структуровані дані schema.org у <script type="application/ld+json">. */
export function JsonLd({ data, nonce }: JsonLdProps) {
  const nodes = Array.isArray(data) ? data : [data];

  return (
    <>
      {nodes.map((node, index) => (
        <script
          // Порядок вузлів сталий: список збирається на сервері й не переставляється.
          key={index}
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
    </>
  );
}
