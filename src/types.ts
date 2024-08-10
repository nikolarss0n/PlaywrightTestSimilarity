export interface Test {
	testId: string;
	testSteps: string[];
}

export interface TestComparisonResult {
	test1: {
		name: string;
		steps: string[];
	};
	test2: {
		name: string;
		steps: string[];
	};
	similarity: number;
	mergeSuggestion: string;
}
