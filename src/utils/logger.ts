export class Logger {
	info(message: string): void {
		console.log(`[INFO] ${message}`);
	}

	debug(message: string): void {
		console.debug(`[DEBUG] ${message}`);
	}

	error(message: string): void {
		console.error(`[ERROR] ${message}`);
	}

	warn(message: string): void {
		console.warn(`[WARN] ${message}`);
	}
}
