import { Suspense } from "react";
import Loader from "@/components/loader";
import LoginClient from "./login-client";

export default function LoginPage() {
	return (
		<Suspense fallback={<Loader />}>
			<LoginClient />
		</Suspense>
	);
}
