/**
 * @typedef {Object} Plan
 * @property {string} name
 * @property {string} blurb
 * @property {number | null} monthly
 * @property {number | null} yearly
 * @property {string} cta
 */

/**
 * @type {Plan[]}
 */
export const plans = [
  { name: 'Solo Venture', blurb: 'Perfect for individual store owners.', monthly: 49, yearly: 39, cta: 'Get Started' },
  { name: 'Unlimited Growth', blurb: 'Supports multiple stores.', monthly: 69, yearly: 59, cta: 'Get Started' },
  { name: 'Enterprise', blurb: 'Tailored for larger teams.', monthly: null, yearly: null, cta: 'Contact Sales' }
]
