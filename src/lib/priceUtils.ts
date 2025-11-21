/**
 * Converts a dollar amount to cents
 * @param dollars - The amount in dollars (e.g., 19.99)
 * @returns The amount in cents (e.g., 1999)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Converts cents to a dollar amount
 * @param cents - The amount in cents (e.g., 1999)
 * @returns The amount in dollars (e.g., 19.99)
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Formats cents as a currency string
 * @param cents - The amount in cents
 * @param currency - The currency code (default: "USD")
 * @returns Formatted currency string (e.g., "$19.99")
 */
export function formatPrice(cents: number, currency: string = "USD"): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(dollars);
}
