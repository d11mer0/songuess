// src/components/deezerFunctions/types.ts

export interface Artist {
    id: number;
    name: string;
    picture_big?: string; // Робимо `picture_big` необов'язковим
}