import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonLd, serializeJsonLd } from "./json-ld";

const BACKSLASH = String.fromCharCode(92);
const ESCAPED_LT = BACKSLASH + "u003c";
const HOSTILE = { name: "</script><script>alert(1)</script>" };

describe("serializeJsonLd", () => {
  it("замінює «<» на JSON-escape з шести символів", () => {
    const json = serializeJsonLd({ a: "<" });

    expect(ESCAPED_LT).toHaveLength(6);
    expect(ESCAPED_LT.charCodeAt(0)).toBe(92);
    expect(json).toBe(`{"a":"${ESCAPED_LT}"}`);
    expect(json).not.toContain("<");
  });

  it("після JSON.parse дані ті самі", () => {
    const json = serializeJsonLd(HOSTILE);

    expect(json).not.toContain("</script>");
    expect(JSON.parse(json)).toEqual(HOSTILE);
  });
});

describe("JsonLd", () => {
  it("рендерить script application/ld+json з екранованим вмістом і nonce", () => {
    const { container } = render(<JsonLd data={HOSTILE} nonce="abc123" />);
    const scripts = container.querySelectorAll("script");

    expect(scripts).toHaveLength(1);
    const script = scripts[0] as HTMLScriptElement;
    expect(script.type).toBe("application/ld+json");
    expect(script.nonce).toBe("abc123");
    expect(script.innerHTML).toContain(ESCAPED_LT);
    expect(script.innerHTML).not.toContain("<");
    expect(JSON.parse(script.innerHTML)).toEqual(HOSTILE);
  });

  it("для масиву рендерить окремий script на кожен вузол", () => {
    const { container } = render(
      <JsonLd data={[{ "@type": "WebSite" }, { "@type": "FAQPage" }]} />,
    );

    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(2);
  });
});
