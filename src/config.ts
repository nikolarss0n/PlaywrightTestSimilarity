export interface Config {
	openAIApiKey: string | undefined;
	similarityThreshold: number;
}

export const config: Config = {
	openAIApiKey: process.env.OPENAI_API_KEY,
	similarityThreshold: 70,
};
