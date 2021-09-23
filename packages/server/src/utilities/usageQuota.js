// const env = require("../environment")
const { getGlobalDB } = require("@budibase/auth/tenancy")

function getNewQuotaReset() {
  return Date.now() + 2592000000
}

exports.Properties = {
  ROW: "rows",
  UPLOAD: "storage",
  VIEW: "views",
  USER: "users",
  AUTOMATION: "automationRuns",
  APPS: "apps",
}

/**
 * Given a specified tenantId this will add to the usage object for the specified property.
 * @param {string} property The property which is to be added to (within the nested usageQuota object).
 * @param {number} usage The amount (this can be negative) to adjust the number by.
 * @returns {Promise<void>} When this completes the API key will now be up to date - the quota period may have
 * also been reset after this call.
 */
exports.update = async (property, usage) => {
  // if (!env.USE_QUOTAS) {
  //   return
  // }
  try {
    const db = getGlobalDB()
    const quota = await db.get("usage_quota")
    // TODO: check if the quota needs reset
    if (Date.now() >= quota.quotaReset) {
      quota.quotaReset = getNewQuotaReset()
      for (let prop of Object.keys(quota.usageQuota)) {
        quota.usageQuota[prop] = 0
      }
    }

    // increment the quota
    quota.usageQuota[property] += usage

    if (quota.usageQuota[property] >= quota.usageLimits[property]) {
      throw new Error(
        `You have exceeded your usage quota of ${quota.usageLimits[property]} ${property}.`
      )
    }

    // update the usage quotas
    await db.put(quota)
  } catch (err) {
    console.error(`Error updating usage quotas for ${property}`, err)
    throw err
  }
}
