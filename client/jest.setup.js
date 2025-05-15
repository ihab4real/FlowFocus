import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// Mock import.meta.env for Jest
globalThis.importMeta = globalThis.importMeta || {};
globalThis.importMeta.env = globalThis.importMeta.env || {};
globalThis.importMeta.env.VITE_API_URL = "http://localhost:3000/api"; // Or your test API URL
