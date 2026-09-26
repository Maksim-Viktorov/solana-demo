import { mockDataService } from "./mock";
import type { DataService } from "./service";

// Swap this for the program-backed implementation when it exists.
export const data: DataService = mockDataService;
export type { DataService };
