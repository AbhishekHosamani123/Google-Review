/** @type {import('next').NextConfig} */
const nextConfig = {
  // the printed card template must be available to the card-rendering API
  outputFileTracingIncludes: {
    "/api/card/image": ["./assets/New_Google_Review_Card.png"],
  },
};
export default nextConfig;
