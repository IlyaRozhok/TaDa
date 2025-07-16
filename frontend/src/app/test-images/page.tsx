"use client";

import Image from "next/image";

export default function TestImagesPage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Image Test Page</h1>

      <div className="space-y-4">
        <h2 className="text-xl">Using Next.js Image Component</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg">Key Crown Image</h3>
            <Image
              src="/key-crown.jpg"
              alt="Key Crown"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>

          <div>
            <h3 className="text-lg">Background Image</h3>
            <Image
              src="/background.jpg"
              alt="Background"
              width={400}
              height={300}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl">Using Regular img Tags</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg">Key Crown Image</h3>
            <img
              src="/key-crown.jpg"
              alt="Key Crown"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>

          <div>
            <h3 className="text-lg">Background Image</h3>
            <img
              src="/background.jpg"
              alt="Background"
              width={400}
              height={300}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl">Using CSS Background Image</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg">Key Crown as Background</h3>
            <div
              className="w-48 h-48 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: "url('/key-crown.jpg')",
              }}
            />
          </div>

          <div>
            <h3 className="text-lg">Background as Background</h3>
            <div
              className="w-96 h-48 bg-cover bg-center rounded-lg"
              style={{
                backgroundImage: "url('/background.jpg')",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
