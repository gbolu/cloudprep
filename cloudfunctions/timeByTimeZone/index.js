const IP2Country = require("ip2countrify");
const moment = require("moment-timezone");
const ct = require("countries-and-timezones");

const getCountryCodeByIP = (ipAddress) => {
  return new Promise((resolve, reject) => {
    IP2Country.lookup(ipAddress, (ip, results, error) => {
      if (error) {
        reject(error);
      }
      const { countryCode: countryCode } = results;
      resolve(countryCode);
    });
  });
};

const getTimeZonesByCountryCode = (countryCode) => {
  return new Promise((resolve, reject) => {
    const { timezones: timezones } = ct.getCountry(countryCode);
    if (timezones) {
      resolve(timezones);
    }
    reject(timezones);
  });
};

const formatTimeByTimeZone = (timeZone) => {
  return moment().tz(timeZone).format("hh mm ss z");
};

exports.timeByTimeZone = async (req, res) => {
  res.status(200);
  const userIP = req.header("x-forwarded-for") || req.connection.remoteAddress;
  try {
    const countryCode = await getCountryCodeByIP(String(userIP));
    const timezones = (await getTimeZonesByCountryCode(countryCode)) || [];
    let greetingMsg = "";

    if (timezones.length != 0) {
      if (timezones.length === 1) {
        greetingMsg = "The current time in your timezone is: ";
        return res.send(greetingMsg + formatTimeByTimeZone(timezones[0]));
      } else {
        greetingMsg = "Current times for your timezones are: \n";
        for (const timezone of timezones) {
          res.write(
            `\tTime in timezone: ${timezone} is ${formatTimeByTimeZone(
              timezone
            )}\n`,
            (error) => {
              if (error) {
                throw error;
              }
            }
          );
        }
        res.end();
      }
    }
  } catch (error) {
    res.status(502).send(error);
  }
};
