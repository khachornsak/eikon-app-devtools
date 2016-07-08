var env = (function () {
  var hostname = window.top.location.hostname;
  var sites = {
    amers1: 'NTCP',
    amers2: 'HDCP',
    emea1: 'DTCP',
    apac1: 'STCP',
  };
  var temp;
  if (/\w+\.\D+\.cp\.(extranet\.)?thomsonreuters\.(com|biz)/.test(hostname)) {
    temp = sites[hostname.split('.')[0]];
    return 'PROD' + (temp ? ':' + temp : '');
  }

  if (/amers1\.\D+\.cp\.(extranet\.)?reutest\.(com|biz)/.test(hostname)) {
    return 'BETA';
  }

  if (/amers1\.\D+\.cp\.icp2\.mpp\.(extranet\.)?reutest\.(com|biz)/.test(hostname)) {
    return 'ALPH';
  }

  if (/amers1\.\D+\d+\.cp\.icp2\.mpp\.(extranet\.)?reutest\.(com|biz)/.test(hostname)) {
    return 'CINT';
  }

  if (hostname === 'localhost') {
    return 'DEV';
  }

  return null;
}());

module.exports = env;
