/**
 * Listing / property page copy (Localazy keys).
 * Use with useTranslation: t(listingPropertyKeys.viewingRequest.title), etc.
 *
 * Units page (/app/units): title, subtitle, results.description ({number} = count).
 */
export const listingPropertyKeys = {
  title: "listing.property.title",
  subtitle: "listing.property.subtitle",
  /** e.g. "{number} items" — replace {number} with total count */
  resultsDescription: "listing.property.results.description",
  card: {
    beds: "listing.property.card.beds",
    bath: "listing.property.card.bath",
    sqFt: "listing.property.card.sq.ft",
    priceMonth: "listing.property.card.price.month",
  },
  viewingRequest: {
    title: "listing.property.viewingRequest.title",
    contactMethod: "listing.property.viewingRequest.contactMethod",
    submit: "listing.property.viewingRequest.submit",
  },
};
