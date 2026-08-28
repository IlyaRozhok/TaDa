export const generalKeys = {
  switchMode: {
    operators: "landing.operators.web.header.segment.1",
    tenants: "landing.operators.web.header.segment.2",
  },
  social: {
    label: "landing.operators.web.sm.subtitle",
    title: "landing.operators.web.sm.title",
    subtitle: "landing.operators.web.sm.description",
    ctaVideo: "landing.operators.web.sm.primary.btn",
    ctaInstagram: "landing.operators.web.sm.secondary.btn",
    gradientTextTop: "landing.operators.web.sm.text1",
    gradientTextBottom: "landing.operators.web.sm.text2",
  },
  footer: {
    companyNumberLabel: "landing.operators.web.footer.cn.title",
    companyNumberText: "landing.operators.web.footer.cn.text",
    addressLabel: "landing.operators.web.footer.address.title",
    addressText: "landing.operators.web.footer.address.text",
    followUs: "landing.operators.web.footer.sm.title",
    instagramText: "landing.operators.web.footer.sm.text",
    country: "landing.operators.web.footer.country",
    allRightsReserved: "landing.operators.web.footer.copy",
  },
  modalForm: {
    operatorTitle: "landing.operators.web.spotlight.btn",
    tenantTitle: "landing.tenant.web.hero.btn",
    firstNameLabel: "landing.operators.web.contact.popup.name.title",
    firstNamePlaceholder: "landing.operators.web.contact.popup.name.text",
    lastNameLabel: "landing.operators.web.contact.popup.lastname.title",
    lastNamePlaceholder: "landing.operators.web.contact.popup.lastname.text",
    emailLabel: "landing.operators.web.contact.popup.email.title",
    emailPlaceholder: "landing.operators.web.contact.popup.email.text",
    phoneLabel: "landing.operators.web.contact.popup.phone.title",
    phonePlaceholder: "landing.operators.web.contact.popup.phone.text",
    operatorCtaButton: "landing.operators.web.contact.popup.btn",
    tenantCtaButton: "landing.tenant.web.hero.btn",
  },
  /**
   * "Book a call" modal copy. The whole modal reads the same on both landings,
   * the reason list included — the landing is recorded as the request's
   * `source`, not as a separate vocabulary.
   *
   * None of these are in Localazy yet; every consumer reads them through
   * `translateWithFallback` with an English fallback, so the modal renders
   * correctly until the owner adds them. See docs/STATUS.md.
   */
  bookACall: {
    // The header pill that opens the modal reads `title` too — the pill and the
    // modal heading must never say different things.
    title: "book.call.title",
    subtitle: "book.call.subtitle",
    // The fields are numbered rather than named because that is the owner's
    // scheme; `title` is the label and `subtitle` the placeholder. field3 is
    // the phone, which reuses the profile settings keys — see BookACallModal.
    reasonLabel: "book.call.field1.title",
    reasonPlaceholder: "book.call.field1.subtitle",
    nameLabel: "book.call.field2.title",
    namePlaceholder: "book.call.field2.subtitle",
    preferredTimeLabel: "book.call.field4.title",
    preferredTimePlaceholder: "book.call.field4.subtitle",
    notesLabel: "book.call.field5.title",
    notesPlaceholder: "book.call.field5.subtitle",
    submit: "book.call.btn",
    submitting: "book.call.btn.pending",
    /**
     * The reason options, one flat list for both landings. The keys are
     * positional (`option1`…`option10`) because that is the owner's scheme;
     * the object key stays the stable slug, which is what the backend stores.
     * Reordering the list means renumbering the keys.
     */
    reason: {
      units_to_fill: "book.call.field1.option1",
      see_demo: "book.call.field1.option2",
      pricing_and_terms: "book.call.field1.option3",
      landlord_to_let: "book.call.field1.option4",
      agent_partner: "book.call.field1.option5",
      connect_feed: "book.call.field1.option6",
      looking_for_home: "book.call.field1.option7",
      finish_rental_cv: "book.call.field1.option8",
      question_about_property: "book.call.field1.option9",
      something_else: "book.call.field1.option10",
    },
    /** Toast copy. Both outcomes use the shared `notify` toaster. */
    notification: {
      complete: "book.call.notification.complete",
      error: "book.call.notification.error",
    },
    validation: {
      required: "book.call.validation.required",
      phoneTooShort: "book.call.validation.phone",
    },
  },
  toast: {
    /** Success toast shown after a link is copied to the clipboard */
    copySuccess: "toast.copy.success",
  },
};
