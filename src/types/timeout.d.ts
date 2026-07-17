/// <reference lib="dom" />

// Ensure that setTimeout/setInterval return numbers, not NodeJS.Timeout
// This is needed because @types/node's Timeout type can shadow the DOM's number type
declare global {
  function setTimeout(callback: (...args: any[]) => void, ms?: number, ...args: any[]): number;
  function setInterval(callback: (...args: any[]) => void, ms?: number, ...args: any[]): number;
  function setImmediate(callback: (...args: any[]) => void, ...args: any[]): number;
  function setImmediate(callback: (...args: any[]) => void, ...args: any[]): number;
}

export {};
