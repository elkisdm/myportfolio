// Easter egg #6: console.log art for devs who open DevTools
export function logConsoleArt() {
  const accent = "color: #5EEAD4; font-family: 'JetBrains Mono', monospace;";
  const muted = "color: #6B6B72; font-family: 'JetBrains Mono', monospace;";
  const text = "color: #E0E0E0; font-family: 'JetBrains Mono', monospace; font-size: 13px;";
  const big =
    "color: #5EEAD4; font-size: 14px; font-weight: bold; font-family: 'Space Grotesk', sans-serif;";

  console.log(
    `%c
  ███████╗██╗     ██╗  ██╗██╗███████╗
  ██╔════╝██║     ██║ ██╔╝██║██╔════╝
  █████╗  ██║     █████╔╝ ██║███████╗
  ██╔══╝  ██║     ██╔═██╗ ██║╚════██║
  ███████╗███████╗██║  ██╗██║███████║
  ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝╚══════╝
  `,
    accent
  );
  console.log('%cHey. You opened DevTools.', big);
  console.log('%cI like you already.', text);
  console.log('');
  console.log('%c→ I spot business problems. Build the full solution.', text);
  console.log('%c→ Currently building at Capital Inteligente · Santiago, CL', muted);
  console.log('%c→ Open to remote roles (US/EU) + freelance.', muted);
  console.log('');
  console.log('%cWant to talk?', text);
  console.log('%c   hello@elkis.dev', accent);
  console.log('%c   github.com/elkisdm', accent);
  console.log('');
  console.log('%cps. yes, this site was built orchestrating AI agents.', muted);
  console.log('%c    source: github.com/elkisdm/myportfolio', muted);
}
