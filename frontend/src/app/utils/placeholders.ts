// Utility functions for generating placeholder images

export const generatePlaceholderSVG = (
  width: number = 400,
  height: number = 300,
  text: string = "Property Image",
  bgColor: string = "#f1f5f9",
  textColor: string = "#64748b"
): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${bgColor}"/>
      <text x="${width / 2}" y="${
    height / 2
  }" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="${textColor}">${text}</text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const PROPERTY_PLACEHOLDER = generatePlaceholderSVG(
  400,
  300,
  "Property Image"
);
export const AVATAR_PLACEHOLDER = generatePlaceholderSVG(
  100,
  100,
  "Avatar",
  "#e2e8f0",
  "#94a3b8"
);
export const GALLERY_PLACEHOLDER = generatePlaceholderSVG(
  800,
  600,
  "Gallery Image"
);
