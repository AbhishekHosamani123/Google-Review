/** @type {import('next').NextConfig} */
const nextConfig = {
  // the printed card template must be available to the card-rendering API
  outputFileTracingIncludes: {
    "/api/card/image": ["./card.png"],
  },
};
export default nextConfig;
