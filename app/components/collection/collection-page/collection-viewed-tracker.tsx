import { AnalyticsEvent } from "@shopify/hydrogen";
import { useEffect } from "react";

type CollectionViewedTrackerProps = {
  collection: { id: string; handle: string };
};

/** Подія аналітики Shopify «колекцію переглянуто»: один раз на колекцію. Нічого не рендерить. */
export function CollectionViewedTracker({ collection }: CollectionViewedTrackerProps) {
  const { id, handle } = collection;

  useEffect(() => {
    window.Shopify?.analytics?.publish(AnalyticsEvent.COLLECTION_VIEWED, {
      collection: { id, handle },
    });
  }, [id, handle]);

  return null;
}
