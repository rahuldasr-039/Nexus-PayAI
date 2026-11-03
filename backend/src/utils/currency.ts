import BigNumber from 'bignumber.js';

// Configure BigNumber for strict financial calculations
BigNumber.config({
  DECIMAL_PLACES: 2,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
});

export class MoneyUtil {
  /**
   * Convert any number/string/Decimal to a standard 2-decimal string
   */
  static format(amount: number | string | BigNumber): string {
    return new BigNumber(amount).toFixed(2);
  }

  /**
   * Parse amount safely to BigNumber
   */
  static toBigNumber(amount: number | string | BigNumber): BigNumber {
    return new BigNumber(amount);
  }

  /**
   * Compare two amounts:
   * Returns:
   *  1 if a > b
   * -1 if a < b
   *  0 if a === b
   */
  static compare(a: number | string | BigNumber, b: number | string | BigNumber): number {
    return new BigNumber(a).comparedTo(new BigNumber(b)) || 0;
  }

  /**
   * Check if amount A is strictly greater than amount B
   */
  static isGreaterThan(a: number | string | BigNumber, b: number | string | BigNumber): boolean {
    return new BigNumber(a).isGreaterThan(new BigNumber(b));
  }

  /**
   * Check if amount A is less than or equal to amount B (e.g. within budget)
   */
  static isLessThanOrEqualTo(a: number | string | BigNumber, b: number | string | BigNumber): boolean {
    return new BigNumber(a).isLessThanOrEqualTo(new BigNumber(b));
  }

  /**
   * Calculate difference: a - b
   */
  static subtract(a: number | string | BigNumber, b: number | string | BigNumber): string {
    return new BigNumber(a).minus(new BigNumber(b)).toFixed(2);
  }

  /**
   * Calculate sum: a + b
   */
  static add(a: number | string | BigNumber, b: number | string | BigNumber): string {
    return new BigNumber(a).plus(new BigNumber(b)).toFixed(2);
  }

  /**
   * Calculate percentage savings: (original - agreed) / original * 100
   */
  static calculateSavingsPercentage(original: number | string, agreed: number | string): string {
    const orig = new BigNumber(original);
    const agr = new BigNumber(agreed);
    if (orig.isZero()) return '0.00';
    return orig.minus(agr).dividedBy(orig).multipliedBy(100).toFixed(2);
  }
}
