import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["pg", "pg-pool"],
};

export default nextConfig;
