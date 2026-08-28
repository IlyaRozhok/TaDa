export const operatorKeys = {
  header: {
    home: "landing.operators.web.header.block1",
    howItWorks: "landing.operators.web.header.block2",
    partners: "landing.operators.web.header.block3",
    forTenants: "landing.operators.web.header.block4",
    spotlight: "landing.operators.web.header.block5",
    about: "landing.operators.web.header.block6",
    ctaBtn: "landing.operators.web.hero.btn",
  },
  hero: {
    title: "landing.operators.web.hero.title",
    subtitle: "landing.operators.web.hero.subtitle",
  },
  howItWorks: {
    label: "landing.operators.web.hiw.subtitle",
    title: "landing.operators.web.hiw.title",
    subtitle: "landing.operators.web.hiw.description",
    card1: {
      boldText: "landing.operators.web.hiw.card1.title",
      regularText: "landing.operators.web.hiw.card1.subtitle",
    },
    card2: {
      boldText: "landing.operators.web.hiw.card2.title",
      regularText: "landing.operators.web.hiw.card2.subtitle",
    },
    card3: {
      boldText: "landing.operators.web.hiw.card3.title",
      regularText: "landing.operators.web.hiw.card3.subtitle",
    },
    card4: {
      boldText: "landing.operators.web.hiw.card4.title",
      regularText: "landing.operators.web.hiw.card4.subtitle",
    },
  },
  rent: {
    label: "landing.operators.web.tenants.subtitle",
    title: "landing.operators.web.tenants.title",
    subtitle: "landing.operators.web.tenants.description",
    card1: {
      label: "landing.operators.web.tenants.card1.subtitle",
      title: "landing.operators.web.tenants.card1.title",
      description: "landing.operators.web.tenants.card1.description",
    },
    card2: {
      label: "landing.operators.web.tenants.card2.subtitle",
      title: "landing.operators.web.tenants.card2.title",
      description: "landing.operators.web.tenants.card2.description",
    },
    card3: {
      label: "landing.operators.web.tenants.card3.subtitle",
      title: "landing.operators.web.tenants.card3.title",
      description: "landing.operators.web.tenants.card3.description",
    },
    card4: {
      label: "landing.operators.web.tenants.card4.subtitle",
      title: "landing.operators.web.tenants.card4.title",
      description: "landing.operators.web.tenants.card4.description",
    },
  },
  spotlight: {
    title: "landing.operators.web.spotlight.title",
    subtitle: "landing.operators.web.spotlight.subtitle",
    capture: "landing.operators.web.spotlight.des1",
    promote: "landing.operators.web.spotlight.des2",
    verify: "landing.operators.web.spotlight.des4",
    onboard: "landing.operators.web.spotlight.des3",
    notice: "landing.operators.web.spotlight.notice",
    ctaBtn: "landing.operators.web.spotlight.btn",
  },
  about: {
    title: "landing.operators.web.about.title",
    subtitle: "landing.operators.web.about.subtitle",
    btn: "landing.operators.web.about.btn",
    missions: "landing.operators.web.about.mission",
    card1: {
      position: "landing.operators.web.about.label1",
      name: "landing.operators.web.about.label1.name",
      description: "landing.operators.web.about.label1.description",
    },
    card2: {
      position: "landing.operators.web.about.label2",
      name: "landing.operators.web.about.label2.name",
      description: "landing.operators.web.about.label2.description",
    },
    card3: {
      position: "landing.operators.web.about.label3",
      name: "landing.operators.web.about.label3.name",
      description: "landing.operators.web.about.label3.description",
    },
  },
  // Landing listings section. Not synced from Localazy yet — the component
  // renders an English fallback until the keys land.
  listings: {
    title: "landing.operators.web.listings.title",
    subtitle: "landing.operators.web.listings.subtitle",
    seeAll: "landing.operators.web.listings.seeAll",
  },
  // "Book a call" reason options offered on the operator landing. Not synced
  // from Localazy yet — the modal renders an English fallback until the keys
  // land. The slug sent to the backend is the object key, not the label.
  bookACall: {
    /**
     * The option keys are positional (`option1`…`option8`) because that is the
     * owner's scheme; the object key stays the stable slug, which is what the
     * backend stores. Reordering the list means renumbering the keys.
     */
    reason: {
      units_to_fill: "book.call.field1.operator.option1",
      see_demo: "book.call.field1.operator.option2",
      pricing_and_terms: "book.call.field1.operator.option3",
      landlord_to_let: "book.call.field1.operator.option4",
      agent_partner: "book.call.field1.operator.option5",
      connect_feed: "book.call.field1.operator.option6",
      looking_for_home: "book.call.field1.operator.option7",
      something_else: "book.call.field1.operator.option8",
    },
  },
  partners: {
    title: "landing.operators.web.partners.title",
    stripe: "landing.operators.web.partner1",
    experian: "landing.operators.web.partner2",
    dps: "landing.operators.web.partner3",
    energy: "landing.operators.web.partner4",
  },
};
