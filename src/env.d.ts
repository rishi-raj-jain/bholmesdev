/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module 'simple:scope' {
    export function scope(prefix?: string): string;
}