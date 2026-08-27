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
    headerCta: "landing.common.web.bookacall.header.btn",
    title: "landing.common.web.bookacall.title",
    subtitle: "landing.common.web.bookacall.subtitle",
    reasonLabel: "landing.common.web.bookacall.reason.title",
    reasonPlaceholder: "landing.common.web.bookacall.reason.placeholder",
    nameLabel: "landing.common.web.bookacall.name.title",
    namePlaceholder: "landing.common.web.bookacall.name.placeholder",
    emailLabel: "landing.common.web.bookacall.email.title",
    emailPlaceholder: "landing.common.web.bookacall.email.placeholder",
    phoneLabel: "landing.common.web.bookacall.phone.title",
    phonePlaceholder: "landing.common.web.bookacall.phone.placeholder",
    preferredTimeLabel: "landing.common.web.bookacall.time.title",
    preferredTimePlaceholder: "landing.common.web.bookacall.time.placeholder",
    notesLabel: "landing.common.web.bookacall.notes.title",
    notesPlaceholder: "landing.common.web.bookacall.notes.placeholder",
    submit: "landing.common.web.bookacall.submit.btn",
    submitting: "landing.common.web.bookacall.submit.pending",
    success: "landing.common.web.bookacall.success",
    error: "landing.common.web.bookacall.error",
    time: {
      morning: "landing.common.web.bookacall.time.morning",
      afternoon: "landing.common.web.bookacall.time.afternoon",
      evening: "landing.common.web.bookacall.time.evening",
      asap: "landing.common.web.bookacall.time.asap",
    },
    validation: {
      required: "landing.common.web.bookacall.validation.required",
      invalidEmail: "landing.common.web.bookacall.validation.email",
      phoneTooShort: "landing.common.web.bookacall.validation.phone",
    },
  },
  toast: {
    /** Success toast shown after a link is copied to the clipboard */
    copySuccess: "toast.copy.success",
  },
};
