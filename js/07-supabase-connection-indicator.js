(() => {
  const home = document.getElementById("supabaseConnectionIndicator");
  const settings = document.getElementById("cloudState");
  if (!home || !settings) return;
  const label = home.querySelector(".supabase-label");

  function mirror() {
    const connected = settings.classList.contains("cloud-ok");
    home.classList.toggle("is-connected", connected);
    label.textContent = connected ? "Supabase connecté" : "Supabase déconnecté";
  }

  mirror();
  new MutationObserver(mirror).observe(settings, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true
  });
  setInterval(mirror, 1000);
})();