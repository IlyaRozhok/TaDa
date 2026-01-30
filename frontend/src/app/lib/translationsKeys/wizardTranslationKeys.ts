/**
 * Translation keys for onboarding wizard (Complete Your Profile, preferences steps, etc.).
 * Use with useTranslation: t(wizardKeys.profile.title), etc.
 */
export const wizardKeys = {
  step1: {
    title: "wizard.step1.title",
    subtitle: "wizard.step1.subtitletitle",
    des: {
      text: "wizard.step1.des.text",
      address: "wizard.step1.des.address",
    },
    areas: "wizard.step1.areas",
    districts: "wizard.step1.districts",
    metro: {
      station: "wizard.step1.metro.station",
    },
  },
  step2: {
    title: "wizard.step2.title",
    subtitle: "wizard.step2.subtitle",
    des: {
      text1: "wizard.step2.des.text1",
      text2: "wizard.step2.des.text2",
    },
    move: {
      from: { title: "wizard.step2.move.from.title" },
      to: { title: "wizard.step2.move.to.title" },
    },
    budget: {
      from: "wizard.step2.budget.from",
      to: "wizard.step2.budget.to",
      flexible: "wizard.step2.budget.flexible",
    },
  },
  step3: {
    title: "wizard.step3.title",
    subtitle: "wizard.step3.subtitle",
    des: {
      text1: "wizard.step3.des.text1",
      text2: "wizard.step3.des.text2",
      text3: "wizard.step3.des.text3",
      text4: "wizard.step3.des.text4",
      text5: "wizard.step3.des.text5",
      text6: "wizard.step3.des.text6",
    },
    /** Section "Select property type" uses des.text1; 6 option labels use option1–6 */
    sectionPropertyType: "wizard.step3.des.text1",
    propertyTypeOptions: [
      "property.type.name1",
      "property.type.name2",
      "property.type.name3",
      "property.type.name4",
      "property.type.name5",
      "property.type.name6",
    ],
    roomsCount: [
      "rooms.count.name1",
      "rooms.count.name2",
      "rooms.count.name3",
      "rooms.count.name4",
      "rooms.count.name5",
    ],
    bathroomsCount: [
      "bathrooms.count.name1",
      "bathrooms.count.name2",
      "bathrooms.count.name3",
      "bathrooms.count.name4",
    ],
    furnishingCount: [
      "furnishing.count.name1",
      "furnishing.count.name2",
      "furnishing.count.name3",
    ],
    outdoorspace: ["outdoorspace.name1", "outdoorspace.name2"],
    meters: {
      min: "meters.des.name.min",
      max: "meters.des.name.max",
    },
  },
  step4: {
    title: "wizard.step4.title",
    subtitle: "wizard.step4.subtitle",
    des: {
      text1: "wizard.step4.des.text1",
      text2: "wizard.step4.des.text2",
      text3: "wizard.step4.des.text3",
    },
    buildtype: [
      "buildtype.name1",
      "buildtype.name2",
      "buildtype.name3",
      "buildtype.name4",
    ],
    rentalDuration: [
      "rental.duration.name1",
      "rental.duration.name2",
      "rental.duration.name3",
      "rental.duration.name4",
    ],
    bills: ["bills.name1", "bills.name2"],
  },
  step5: {
    title: "wizard.step5.title",
    subtitle: "wizard.step5.subtitle",
    des: {
      text1: "wizard.step5.des.text1",
    },
    tenantType: [
      "tenant.type.name.1",
      "tenant.type.name.2",
      "tenant.type.name.3",
      "tenant.type.name.4",
      "tenant.type.name.5",
      "tenant.type.name.6",
    ],
  },
  step6: {
    title: "wizard.step6.title",
    subtitle: "wizard.step6.subtitle",
    des: {
      text1: "wizard.step6.des.text1",
      text2: "wizard.step6.des.text2",
    },
    petType: [
      "pet.type.name1",
      "pet.type.name2",
      "pet.type.name3",
      "pet.type.name4",
      "pet.type.name5",
    ],
    numberPets: "pet.type.number.pets",
    additionalField: "wizard.step6.additional.field",
    optionalText: "wizard.text.optional",
  },
  profile: {
    title: "wizard.profile.title",
    subtitle: "wizard.profile.subtitle",
    name: "wizard.profile.name",
    lastName: "wizard.profile.last.name",
    address: "wizard.profile.address",
    birth: {
      title: "wizard.profile.birth.title",
      text: "wizard.profile.birth.text",
    },
    nationality: "wizard.profile.nationality",
  },
};
