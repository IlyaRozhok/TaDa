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
   * "Book a call" modal chrome — everything that reads the same on both
   * landings. The audience-specific half (the reason list) lives in
   * `tenantKeys.bookACall` / `operatorKeys.bookACall`.
   *
   * None of these are in Localazy yet; every consumer reads them through
   * `translateWithFallback` with an English fallback, so the modal renders
   * correctly until the owner adds them. See docs/STATUS.md.
   */
  bookACall: {
    /**
     * The header pill that opens the modal. Not a modal field, so it keeps the
     * landing-scoped key it shipped with while the fields move to `book.call.`.
     */
    headerCta: "landing.common.web.bookacall.header.btn",
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
    time: {
      morning: "book.call.field4.option1",
      afternoon: "book.call.field4.option2",
      evening: "book.call.field4.option3",
      asap: "book.call.field4.option4",
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
