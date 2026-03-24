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
  filter: {
    bestMatch: "listing.property.filter.bestMatch",
    lowPrice: "listing.property.filter.lowPrice",
    highPrice: "listing.property.filter.highPrice",
    lowDeposit: "listing.property.filter.lowDeposit",
    highDeposit: "listing.property.filter.highDeposit",
    dateAdded: "listing.property.filter.dateAdded",
  },
  emptyState: {
    noResultsTitle: "listing.property.emptyState.noResults.title",
    noResultsSubtitle: "listing.property.emptyState.noResults.subtitle",
  },
  viewingRequest: {
    title: "listing.property.viewingRequest.title",
    contactMethod: "listing.property.viewingRequest.contactMethod",
    submit: "listing.property.viewingRequest.submit",
    notes: "listing.viewingRequest.notes",
    notesPlaceholder: "listing.viewingRequest.notesPlaceholder",
    date: {
      from: "property.view.booking.date.from",
      to: "property.view.booking.date.to",
    },
  },
  details: {
    listedOn: "listing.property.details.listedOn",
    sectionTitle: "listing.property.details.sectionTitle",
  },
  building: {
    label: "listing.property.building.label",
    seeMore: "listing.property.building.seeMore",
    seeMoreApartments: "listing.property.building.seeMoreApartments",
  },
  description: {
    sectionTitle: "listing.property.description.sectionTitle",
  },
  keyFeatures: {
    sectionTitle: "listing.property.key.features.sectionTitle",
  },
  recommendations: {
    title: "listing.property.recommendations.title",
    seeMore: "listing.property.recommendations.seeMore",
  },
  availability: {
    availableFrom: "listing.property.availability.availableFrom",
  },
  payments: {
    breakdownTitle: "listing.property.payments.breakdownTitle",
  },
  gallery: {
    viewFullscreen: "listing.property.gallery.viewFullscreen",
  },
  pricing: {
    bookRequested: "listing.property.pricing.bookRequested",
  },
};

export const listingNotificationKeys = {
  viewingRequestSentMessage: "listing.notification.viewingRequestSentMessage",
};

/** Property detail labels (Localazy) — e.g. PCM on cards / price blocks */
export const propertyDetailsKeys = {
  pcm: "property.details.pcm",
  btn: {
    book: "property.details.btn.book",
  },
  showMoreBtn: "property.details.show.more.btn",
};
