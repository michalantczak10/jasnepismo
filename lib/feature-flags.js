// Centralized feature flag helper for Node scripts and server handlers.
// Usage: require('../lib/feature-flags').isEnabled('explain')
// Defaults: feature is ENABLED unless corresponding env var FEATURE_<NAME> is set to a falsy value
// (0, "0", "false", "off", "no"). You can also set FEATURE_ALL to force-enable/disable all features.

function normalizeFlagName(name) {
  return 'FEATURE_' + String(name).replace(/[^A-Za-z0-9]/g, '_').toUpperCase();
}

function parseBoolish(value) {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim().toLowerCase();
  if (s === '') return undefined;
  if (['0', 'false', 'off', 'no', 'none'].includes(s)) return false;
  if (['1', 'true', 'on', 'yes'].includes(s)) return true;
  return undefined;
}

function isEnabled(name) {
  // Global override
  const all = parseBoolish(process.env.FEATURE_ALL);
  if (all === false) return false;
  if (all === true) return true;

  const key = normalizeFlagName(name);
  const v = parseBoolish(process.env[key]);
  if (v === undefined) return true; // default: enabled
  return Boolean(v);
}

function flagName(name) {
  return normalizeFlagName(name);
}

module.exports = { isEnabled, flagName };

