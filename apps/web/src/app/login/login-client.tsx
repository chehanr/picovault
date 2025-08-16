"use client";

import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect, useState } from "react";
import Loader from "@/components/loader";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";
import { oauthParamsParser } from "./_lib/parsers";

export default function LoginClient() {
	const [showSignIn, setShowSignIn] = useState(false);
	const [oauthParams] = useQueryStates(oauthParamsParser);
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	const isOAuthRequest = oauthParams.client_id !== null;

	useEffect(() => {
		if (session) {
			if (isOAuthRequest) {
				// Build OAuth2 authorize URL with parameters
				const params = new URLSearchParams();
				Object.entries(oauthParams).forEach(([key, value]) => {
					if (value) params.append(key, value);
				});

				// Redirect directly to OAuth2 authorise endpoint
				window.location.href = `/api/auth/oauth2/authorize?${params.toString()}`;
			} else {
				// Regular login page access while already logged in - redirect to home
				router.push("/");
			}
		}
	}, [isOAuthRequest, oauthParams, session, router]);

	// Show loading while checking session
	if (isPending) {
		return <Loader />;
	}

	// If logged in, useEffect will handle redirect
	if (session) {
		return <Loader />;
	}

	// Show login/signup forms for non-authenticated users
	return showSignIn ? (
		<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
	) : (
		<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
	);
}
