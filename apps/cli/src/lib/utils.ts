export function normaliseUrl(url: string): string {
	// Add protocol if missing
	if (!url.startsWith("http://") && !url.startsWith("https://")) {
		// Default to http for localhost, https for others
		if (url.startsWith("localhost") || url.startsWith("127.0.0.1")) {
			return `http://${url}`;
		}
		return `https://${url}`;
	}
	return url;
}
