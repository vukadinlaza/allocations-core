import { Static, Runtype, ValidationError } from "runtypes";

export type ValidateSchemaOptions<T> = {
  readonly schema: T;
  readonly value: unknown;
  readonly errorMessage?: string;
};

export type ValidationResult<T, E extends Error = ValidationError> =
  | {
      readonly success: true;
      readonly value: T;
    }
  | {
      readonly success: false;
      readonly error: E;
    };

export const validateValue = <T extends Runtype>({
  schema,
  value,
  errorMessage,
}: ValidateSchemaOptions<T>): ValidationResult<Static<T>> => {
  try {
    return {
      success: true,
      value: schema.check(value),
    };
  } catch (e) {
    const error = e as ValidationError;
    const message = errorMessage ? `${errorMessage}. ` : "";
    error.message = `${message}${error.message}`;

    return {
      success: false,
      error,
    };
  }
};
