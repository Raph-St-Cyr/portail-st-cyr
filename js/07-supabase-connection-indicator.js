(() => {
  const home = document.getElementById("supabaseConnectionIndicator");
  const settings = document.getElementById("cloudState");
  if (!home || !settings) return;
  const label = home.querySelector(".supabase-label");
  function mirrorSettingsState() {
    const text = (settings.textContent || "").trim();
    const connected = settings.classList.contains("cloud-ok");
    home.classList.toggle("is-connected", connected);
    label.textContent = connected ? "Supabase connecté" : "Supabase déconnecté";
    home.title = text ? "État Paramètres : " + text : "";
  }
  mirrorSettingsState();
  new MutationObserver(mirrorSettingsState).observe(settings, {
    childList:true, subtree:true, attributes:true, attributeFilter:["class"]
  });
})();