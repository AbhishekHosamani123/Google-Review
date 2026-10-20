/** @type {import('next').NextConfig} */
const nextConfig = {
  // the printed card template must be available to the card-rendering API
  outputFileTracingIncludes: {
    "/api/card/image": ["./new-card.png"],
  },
};
export default nextConfig;
