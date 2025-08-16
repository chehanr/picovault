import { parseAsString } from "nuqs";

export const oauthParamsParser = {
	client_id: parseAsString,
	redirect_uri: parseAsString,
	response_type: parseAsString,
	scope: parseAsString,
	state: parseAsString,
	code_challenge: parseAsString,
	code_challenge_method: parseAsString,
};
