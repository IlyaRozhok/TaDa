"use client";

import React, { useState } from "react";
import Image from "next/image";
import { operatorKeys } from "../lib/translationsKeys/operatorTranslationKeys";
import { useTranslation } from "../hooks/useTranslation";

const AboutUsSection = () => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const { t } = useTranslation();
  const teamMembers = [
    {
      id: 1,
      name: t(operatorKeys.about.card1.name),
      position: t(operatorKeys.about.card1.position),
      image: "/artur.jpeg",
      description: t(operatorKeys.about.card1.description),
    },

    {
      id: 2,
      name: t(operatorKeys.about.card2.name),
      position: t(operatorKeys.about.card2.position),
      image: "/dima.png",
      description: t(operatorKeys.about.card2.description),
    },
    {
      id: 3,
      name: t(operatorKeys.about.card3.name),
      position: t(operatorKeys.about.card3.position),
      image: "/ilya.png",
      description: t(operatorKeys.about.card3.description),
    },
  ];

  const toggleAccordion = () => {
    setIsAccordionOpen(!isAccordionOpen);
  };

  return (
    <section id="about-us" className="md:py-20 py-5 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-8xl font-sf-pro font-semibold text-gray-900 leading-tight mb-8 mt-2">
            {t(operatorKeys.about.title)}
          </h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            {t(operatorKeys.about.subtitle)}
          </p>
        </div>

        {/* Accordion Toggle */}
        <div className="max-w-3xl mx-auto mb-12 flex justify-center">
          <button
            onClick={toggleAccordion}
            className="bg-white w-[80%] h-[40%] rounded-full py-4 px-6 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
          >
            <span className="text-md font-semibold text-gray-900 mr-4">
              {t(operatorKeys.about.btn)}
            </span>
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
                isAccordionOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Team Cards - Accordion Content */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isAccordionOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="grid pb-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl overflow-hidden"
              >
                {/* Member Image */}
                <div className="h-80 bg-gray-100 overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={400}
                    height={320}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Member Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {member.position}
                    </p>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {member.name}
                    </h3>
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="text-center mt-2 md:mb-0 mb-10">
          <blockquote className="text-2xl md:text-3xl lg:text-3xl font-sf-pro font-semibold text-gray-900 leading-tight max-w-4xl mx-auto">
            {t(operatorKeys.about.missions)}
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
