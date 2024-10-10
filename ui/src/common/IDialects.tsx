import { IErrors } from "./ITranslationProvider";

interface IDialects extends IErrors
{
    dialects: string[];
}

export type {IDialects}